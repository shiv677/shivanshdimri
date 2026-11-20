import argparse
import json
import sys
from pathlib import Path

try:
    from .engine import ConsensusEngine
    from .models import ConsensusResult, EvaluationSample
except ImportError:
    from engine import ConsensusEngine
    from models import ConsensusResult, EvaluationSample


DEFAULT_TEST_CASES = [
    {
        "task_id": "eval_001_strong_grounded",
        "prompt": "Summarize the primary benefits of SQLite WAL mode in data pipelines.",
        "context": "SQLite WAL (Write-Ahead Logging) mode separates reads and writes. Readers do not block writers, and writers do not block readers. It improves concurrency and write throughput while ensuring atomic durability across checkpoint intervals.",
        "response": "SQLite WAL mode provides two primary advantages: first, readers do not block writers and writers do not block readers, enabling high-concurrency throughput. Second, it maintains atomic commits through periodic checkpoints, ensuring strict durability without corruption.",
        "required_format": "text",
        "required_keys": None,
    },
    {
        "task_id": "eval_002_hallucinated",
        "prompt": "Explain the architectural layers of the custom VLM system.",
        "context": "The VLM system uses a Swin Transformer visual encoder and a Llama-3 8B language model decoder connected by a 2-layer MLP projection adapter.",
        "response": "The architecture is built upon quantum optical neural pathways using proprietary graphene tensor processors and hypothetical hyper-dimensional memory matrices that operate at light speed.",
        "required_format": "text",
        "required_keys": None,
    },
    {
        "task_id": "eval_003_malformed_schema",
        "prompt": "Extract the key metrics into a JSON object with keys 'throughput' and 'latency'.",
        "context": "Pipeline achieved 5400 items/sec throughput and 12ms p99 latency.",
        "response": "Here is your JSON: {throughput: 5400, latency: 12ms, INVALID_UNQUOTED_JSON",
        "required_format": "json",
        "required_keys": ["throughput", "latency"],
    },
]


def run_pipeline(cases: list[dict], json_output: bool = False):
    engine = ConsensusEngine()
    results: list[ConsensusResult] = []

    for case in cases:
        rubric = engine.evaluate(
            task_id=case.get("task_id", "eval_sample"),
            prompt=case.get("prompt", ""),
            candidate_response=case.get("response", ""),
            context=case.get("context", ""),
            required_format=case.get("required_format", "text"),
            required_keys=case.get("required_keys"),
            expected_schema=case.get("expected_schema"),
        )
        results.append(rubric)

    if json_output:
        rubrics_json = [r.model_dump() for r in results]
        print(json.dumps(rubrics_json, indent=2))
        return results

    print("=" * 75)
    print("Multi-Agent Consensus Evaluation Debate Engine")
    print("=" * 75)

    for rubric in results:
        print(f"\nTask ID:       {rubric.task_id}")
        print(f"Rounds:        {rubric.round_count} round(s)")
        print(f"Final Verdict: {rubric.final_verdict} (Score: {rubric.final_score:.2f}, Conf: {rubric.composite_confidence:.2f})")
        print(f"Status:        {rubric.consensus_status} (Escalate: {rubric.escalate_to_human})")
        print("Agent Breakdown:")
        for agent_name, v in rubric.agent_scores.items():
            flag_str = f" [Flags: {', '.join(v.flags)}]" if v.flags else ""
            pass_str = "PASS" if v.passed else "FAIL"
            print(f"  - {agent_name:<16}: score={v.score:.2f} ({pass_str}) conf={v.confidence:.2f}{flag_str}")
        print("Synthesis:")
        for note in rubric.synthesis_notes:
            print(f"  * {note}")

    print("\n" + "=" * 75)
    sample_export = results[0].model_dump_json(indent=2)
    print("Exported Rubric (Pydantic v2 JSON Schema snippet):")
    print(sample_export[:350] + "\n... [truncated] ...")
    print("=" * 75)

    return results


def main():
    parser = argparse.ArgumentParser(description="Multi-Agent Consensus Evaluation Debate Engine")
    parser.add_argument("--json", action="store_true", help="Output full JSON rubric")
    parser.add_argument("--file", type=str, help="Path to JSON file containing test cases")
    args = parser.parse_args()

    cases = DEFAULT_TEST_CASES
    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {args.file}", file=sys.stderr)
            sys.exit(1)
        with open(file_path, "r", encoding="utf-8") as f:
            cases = json.load(f)
            if isinstance(cases, dict):
                cases = [cases]

    run_pipeline(cases, json_output=args.json)


if __name__ == "__main__":
    main()
