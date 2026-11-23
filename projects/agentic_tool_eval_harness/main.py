import argparse
import json
import sys
from pathlib import Path

try:
    from .models import AgentTrajectory, ToolSignature
    from .evaluator import evaluate_batch
except ImportError:
    from models import AgentTrajectory, ToolSignature
    from evaluator import evaluate_batch

DEFAULT_REGISTRY = {
    "logs_query": ToolSignature(
        name="logs_query",
        description="Query log aggregation cluster",
        parameters={"query": "str"},
        required=["query"],
    ),
    "db_query": ToolSignature(
        name="db_query",
        description="Execute read-only SQL query against database",
        parameters={"query": "str"},
        required=["query"],
    ),
    "slack_notify": ToolSignature(
        name="slack_notify",
        description="Post message to Slack channel",
        parameters={"channel": "str", "message": "str"},
        required=["channel", "message"],
    ),
    "cluster_info": ToolSignature(
        name="cluster_info",
        description="Inspect Kubernetes cluster nodes",
        parameters={"cluster_id": "str"},
        required=["cluster_id"],
    ),
    "metrics_fetch": ToolSignature(
        name="metrics_fetch",
        description="Fetch CPU and memory Prometheus metrics",
        parameters={"metric": "str"},
        required=["metric"],
    ),
    "fetch_quote": ToolSignature(
        name="fetch_quote",
        description="Fetch billing quote from CRM",
        parameters={"quote_id": "str"},
        required=["quote_id"],
    ),
    "calculator": ToolSignature(
        name="calculator",
        description="Deterministic math computation tool",
        parameters={"expression": "str"},
        required=["expression"],
    ),
}


def load_trajectories(file_path: Path) -> list[AgentTrajectory]:
    trajectories = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data = json.loads(line)
                trajectories.append(AgentTrajectory(**data))
    return trajectories


def run_evaluation(data_path: Path):
    if not data_path.exists():
        print(f"Error: Trajectory dataset not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    trajectories = load_trajectories(data_path)
    summaries = evaluate_batch(trajectories, DEFAULT_REGISTRY)

    print("=" * 80)
    print("Agentic Tool Calling & Trajectory Evaluation Report")
    print("=" * 80)
    print(f"Dataset:        {data_path.name}")
    print(f"Trajectories:   {len(summaries)}")
    avg_score = sum(s.rubric_score for s in summaries) / max(1, len(summaries))
    avg_latency = sum(s.total_latency_ms for s in summaries) / max(1, len(summaries))
    print(f"Mean Rubric:    {avg_score:.4f} / 1.0000")
    print(f"Mean Latency:   {avg_latency:.2f} ms")
    print("-" * 80)
    print(f"{'Trajectory ID':<15} | {'Steps':<6} | {'Precision':<9} | {'Recall':<7} | {'Halluc':<7} | {'Goal':<6} | {'Score'}")
    print("-" * 80)
    for s in summaries:
        goal_str = "PASS" if s.goal_attained else "FAIL"
        print(
            f"{s.trajectory_id:<15} | "
            f"{s.total_steps:<6} | "
            f"{s.tool_call_precision * 100:>8.1f}% | "
            f"{s.tool_call_recall * 100:>6.1f}% | "
            f"{s.hallucinated_argument_count:>7} | "
            f"{goal_str:<6} | "
            f"{s.rubric_score:.4f}"
        )
    print("=" * 80)
    return summaries


def main():
    default_dataset = Path(__file__).parent / "sample_agent_trajectories.jsonl"
    parser = argparse.ArgumentParser(description="Evaluate Agent Trajectories for Tool Calling Precision.")
    parser.add_argument("--data", type=Path, default=default_dataset, help="Path to jsonl trajectories.")
    args = parser.parse_args()

    run_evaluation(args.data)


if __name__ == "__main__":
    main()
