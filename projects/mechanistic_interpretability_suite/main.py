import argparse
import json
import time

import torch

try:
    from .engine import (
        SimpleTransformer,
        SparseAutoencoder,
        compute_attention_attribution,
        decompose_features,
        run_activation_patching,
        run_mechanistic_suite,
        run_with_cache,
        summarize_cache,
        train_sae,
    )
    from .models import SAEConfig, TransformerConfig
except (ImportError, ValueError):
    from engine import (
        SimpleTransformer,
        SparseAutoencoder,
        compute_attention_attribution,
        decompose_features,
        run_activation_patching,
        run_mechanistic_suite,
        run_with_cache,
        summarize_cache,
        train_sae,
    )
    from models import SAEConfig, TransformerConfig


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mechanistic Interpretability Suite CLI & Benchmark Runner"
    )
    parser.add_argument("--d-model", type=int, default=32, help="Transformer d_model")
    parser.add_argument("--layers", type=int, default=2, help="Number of transformer layers")
    parser.add_argument("--heads", type=int, default=4, help="Number of attention heads")
    parser.add_argument("--sae-dim", type=int, default=128, help="SAE dictionary dimension")
    parser.add_argument("--benchmark", action="store_true", help="Run throughput benchmark")
    parser.add_argument("--iterations", type=int, default=30, help="Benchmark iterations")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    return parser.parse_args()


def run_benchmark(model_cfg: TransformerConfig, sae_cfg: SAEConfig, iterations: int):
    print(f"[*] Starting benchmark ({iterations} iterations)...")
    latencies = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = run_mechanistic_suite(model_cfg=model_cfg, sae_cfg=sae_cfg)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    avg_ms = sum(latencies) / len(latencies)
    min_ms = min(latencies)
    max_ms = max(latencies)
    throughput = 1000.0 / avg_ms

    print("\n=== Benchmark Results ===")
    print(f"Iterations:     {iterations}")
    print(f"Mean Latency:   {avg_ms:.2f} ms")
    print(f"Min Latency:    {min_ms:.2f} ms")
    print(f"Max Latency:    {max_ms:.2f} ms")
    print(f"Throughput:     {throughput:.2f} runs/sec")


def main():
    args = parse_args()
    model_cfg = TransformerConfig(
        vocab_size=50,
        d_model=args.d_model,
        num_layers=args.layers,
        num_heads=args.heads,
        d_mlp=args.d_model * 4,
    )
    sae_cfg = SAEConfig(d_model=args.d_model, d_sae=args.sae_dim)

    if args.benchmark:
        run_benchmark(model_cfg, sae_cfg, args.iterations)
        return

    report = run_mechanistic_suite(model_cfg=model_cfg, sae_cfg=sae_cfg)

    if args.json:
        print(report.model_dump_json(indent=2))
        return

    print("============================================================")
    print("       MECHANISTIC INTERPRETABILITY SUITE EXECUTION         ")
    print("============================================================")
    print(f"Config: d_model={args.d_model}, layers={args.layers}, heads={args.heads}")
    print(f"Execution Latency: {report.latency_ms:.2f} ms\n")

    print("[1] Top Attention Head Attributions:")
    for attr in report.top_attention_attributions:
        print(
            f"  - L{attr.layer}H{attr.head}: token[{attr.source_idx}] -> token[{attr.target_idx}] | "
            f"attn_weight={attr.attention_weight:.4f} | score={attr.attribution_score:.4f}"
        )

    print("\n[2] Sparse Autoencoder (SAE) Decomposition:")
    print(f"  - L0 Sparsity:          {report.sae_summary.l0_sparsity}")
    print(f"  - Reconstruction MSE:   {report.sae_summary.reconstruction_mse}")
    print(f"  - Explained Variance:   {report.sae_summary.explained_variance * 100:.2f}%")
    print(f"  - Top Active Features:  {report.sae_summary.top_feature_indices}")
    print(f"  - Mean Activations:     {report.sae_summary.top_feature_activations}")

    print("\n[3] Causal Activation Patching:")
    print("  Layer | Component | Pos  | Clean   | Corrupt | Patched | Recovery %")
    print("  ------+-----------+------+---------+---------+---------+-----------")
    for p in report.causal_patch_results:
        pos_str = str(p.position) if p.position is not None else "ALL"
        print(
            f"  L{p.layer: <4} | {p.component: <9} | {pos_str: <4} | "
            f"{p.clean_metric: >7.3f} | {p.corrupted_metric: >7.3f} | {p.patched_metric: >7.3f} | "
            f"{p.recovery_rate * 100: >8.1f}%"
        )
    print("============================================================")


if __name__ == "__main__":
    main()
