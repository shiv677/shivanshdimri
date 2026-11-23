import argparse
import json
import os
import sys
from typing import Dict, List

try:
    from .engine import (
        mock_baseline_model,
        mock_contaminated_model,
        mock_frontier_model,
        run_benchmark,
    )
    from .models import BenchmarkItem
except ImportError:
    from engine import (
        mock_baseline_model,
        mock_contaminated_model,
        mock_frontier_model,
        run_benchmark,
    )
    from models import BenchmarkItem


def load_dataset(dataset_path: str) -> List[BenchmarkItem]:
    """Loads benchmark items from JSON file."""
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [BenchmarkItem(**item) for item in data]


def get_available_models() -> Dict[str, callable]:
    return {
        "frontier-reasoning": mock_frontier_model,
        "baseline-compact": mock_baseline_model,
        "contaminated-memorizer": mock_contaminated_model,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Frontier AI Benchmarking & Evaluation Engine"
    )
    default_dataset = os.path.join(
        os.path.dirname(__file__), "sample_benchmark_dataset.json"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=default_dataset,
        help="Path to JSON benchmark dataset",
    )
    parser.add_argument(
        "--models",
        type=str,
        default="frontier-reasoning,baseline-compact,contaminated-memorizer",
        help="Comma-separated list of model profiles to evaluate",
    )
    parser.add_argument(
        "--no-canaries",
        action="store_true",
        help="Disable adversarial canary token injection",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.50,
        help="N-gram overlap contamination threshold (default: 0.50)",
    )
    parser.add_argument(
        "--alpha",
        type=float,
        default=0.05,
        help="Significance level alpha for paired hypothesis tests (default: 0.05)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to export benchmark run summary as JSON",
    )

    args = parser.parse_args()

    # Load dataset
    dataset = load_dataset(args.dataset)
    all_models = get_available_models()
    requested_names = [m.strip() for m in args.models.split(",") if m.strip()]

    selected_models = {}
    for name in requested_names:
        if name in all_models:
            selected_models[name] = all_models[name]
        else:
            print(f"[WARN] Unknown model profile '{name}', skipping.")

    if not selected_models:
        print("[ERROR] No valid models selected. Exiting.")
        sys.exit(1)

    print("=" * 80)
    print("FRONTIER AI EVALUATION & BENCHMARKING ENGINE")
    print("=" * 80)
    print(f"Dataset Items:             {len(dataset)}")
    print(f"Models to Evaluate:        {', '.join(selected_models.keys())}")
    print(f"Adversarial Canaries:      {'Disabled' if args.no_canaries else 'Active (Trap Injection)'}")
    print(f"Contamination Threshold:   {args.threshold:.2%}")
    print(f"Alpha Significance Level:  {args.alpha}")
    print("-" * 80)

    summary = run_benchmark(
        dataset=dataset,
        models=selected_models,
        inject_canaries=not args.no_canaries,
        contamination_threshold=args.threshold,
        alpha=args.alpha,
    )

    print("\n[1] MODEL BENCHMARK LEADERBOARD")
    print(
        f"{'Model Name':<26} | {'Mean Score':<10} | {'Pass Rate':<10} | "
        f"{'Canary Leaks':<12} | {'Contaminations':<14} | {'Avg Latency (ms)':<16}"
    )
    print("-" * 100)
    for name, stats in summary.model_summaries.items():
        print(
            f"{name:<26} | {stats.mean_score:>8.2f}/10 | {stats.pass_rate:>9.1%} | "
            f"{stats.canary_leak_count:>12} | {stats.contamination_count:>14} | {stats.avg_latency_ms:>16.2f}"
        )

    print("\n[2] PAIRWISE STATISTICAL SIGNIFICANCE (Paired t-test)")
    print(
        f"{'Comparison':<45} | {'Mean Diff':<10} | {'t-stat':<8} | {'p-value':<9} | {'95% CI':<16} | {'Significant?':<12}"
    )
    print("-" * 108)
    for sig in summary.pairwise_significance:
        comp_str = f"{sig.model_a} vs {sig.model_b}"
        sig_str = "YES (p<0.05)" if sig.is_significant else "NO"
        ci_str = f"[{sig.confidence_interval_95[0]:.2f}, {sig.confidence_interval_95[1]:.2f}]"
        print(
            f"{comp_str:<45} | {sig.diff:>10.2f} | {sig.t_stat:>8.2f} | {sig.p_value:>9.4f} | {ci_str:<16} | {sig_str:<12}"
        )

    print("\n" + "=" * 80)
    print("BENCHMARK INTEGRITY VERDICT:")
    leaks = sum(s.canary_leak_count for s in summary.model_summaries.values())
    contams = sum(s.contamination_count for s in summary.model_summaries.values())
    if leaks > 0 or contams > 0:
        print(f"  [ALERT] Detected {leaks} canary leaks and {contams} contaminated responses across test models.")
    else:
        print("  [SECURE] All models passed canary trap integrity checks with 0 contamination flags.")
    print("=" * 80 + "\n")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(summary.model_dump_json(indent=2))
        print(f"Results successfully saved to {args.output}")


if __name__ == "__main__":
    main()
