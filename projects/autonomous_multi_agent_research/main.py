import argparse
import sys
from pathlib import Path
import time

try:
    from .engine import ResearchEngine, ToolSandbox
    from .models import MemoryItem
except ImportError:
    try:
        from engine import ResearchEngine, ToolSandbox
        from models import MemoryItem
    except ImportError:
        # Allow running directly via script path
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
        from projects.autonomous_multi_agent_research.engine import (
            ResearchEngine,
            ToolSandbox,
        )
        from projects.autonomous_multi_agent_research.models import MemoryItem


def run_benchmark(engine: ResearchEngine, query: str, iterations: int = 50) -> None:
    print(f"\n[BENCHMARK] Running {iterations} iterations on query: '{query}'...")
    latencies = []

    for _ in range(iterations):
        dag = engine.build_default_dag(query)
        start = time.perf_counter()
        _ = engine.execute_plan(dag)
        latencies.append((time.perf_counter() - start) * 1000.0)

    avg_lat = sum(latencies) / len(latencies)
    min_lat = min(latencies)
    max_lat = max(latencies)
    p95_lat = sorted(latencies)[int(0.95 * len(latencies))]

    print(f"[BENCHMARK RESULTS] Total runs: {iterations}")
    print(f"  Avg Latency:  {avg_lat:.2f} ms")
    print(f"  Min Latency:  {min_lat:.2f} ms")
    print(f"  Max Latency:  {max_lat:.2f} ms")
    print(f"  P95 Latency:  {p95_lat:.2f} ms")


def main() -> None:
    parser = argparse.ArgumentParser(description="Autonomous Multi-Agent Research System")
    parser.add_argument(
        "--query",
        type=str,
        default="FlashAttention and inference acceleration",
        help="Research topic/query to investigate",
    )
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="Run latency benchmark across multiple iterations",
    )
    parser.add_argument(
        "--simulate-conflict",
        action="store_true",
        help="Inject conflicting agent claims to demonstrate referee arbitration",
    )
    args = parser.parse_args()

    print("================================================================")
    print(" AUTONOMOUS MULTI-AGENT RESEARCH & REASONING SYSTEM")
    print("================================================================")
    print(f"Target Query: {args.query}\n")

    sandbox = ToolSandbox()
    engine = ResearchEngine(sandbox=sandbox)

    if args.simulate_conflict:
        print("[SETUP] Injecting conflicting agent findings into working memory...")
        engine.memory.store(
            MemoryItem(
                key="t_speedup_a",
                content="Benchmark measured 2.1x speedup on A100 GPUs.",
                source_agent="researcher_alpha",
                confidence=0.75,
                metadata={"topic": "speedup_metric", "metric_val": 2.1},
            )
        )
        engine.memory.store(
            MemoryItem(
                key="t_speedup_b",
                content="Benchmark measured 3.4x speedup on A100 GPUs.",
                source_agent="researcher_beta",
                confidence=0.92,
                metadata={"topic": "speedup_metric", "metric_val": 3.4},
            )
        )

    # 1. DAG Decomposition
    print("[STAGE 1] Decomposing query into DAG execution stages...")
    dag = engine.build_default_dag(args.query)
    for task_id, task in dag.tasks.items():
        deps = f" -> deps: {task.dependencies}" if task.dependencies else " (root)"
        print(f"  Node [{task_id}] ({task.assigned_agent}){deps}")

    # 2. Execution & Verification
    print("\n[STAGE 2] Executing DAG plan through sandboxed tools & memory buffer...")
    start_time = time.perf_counter()
    report = engine.execute_plan(dag)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    print(f"\nExecution Stages: {report.execution_stages}")
    print(f"Total Execution Time: {elapsed_ms:.2f} ms")

    # 3. Conflict Resolution
    print(f"\n[STAGE 3] Conflict Resolution Referee ({len(report.resolved_conflicts)} conflict(s) arbitrated):")
    if report.resolved_conflicts:
        for c in report.resolved_conflicts:
            print(f"  - Topic: {c.topic}")
            print(f"    Claim A ({c.source_a}): {c.claim_a}")
            print(f"    Claim B ({c.source_b}): {c.claim_b}")
            print(f"    Resolution: {c.resolution} (Confidence: {c.confidence:.2f})")
    else:
        print("  - No conflicting claims detected across agent outputs.")

    # 4. Self-Verification
    print("\n[STAGE 4] Self-Verification Loop:")
    if report.verification:
        print(f"  - Valid: {report.verification.is_valid}")
        print(f"  - Grounding Score: {report.verification.score:.2f}")
        print(f"  - Critique: {report.verification.critique}")

    # 5. Executive Synthesis
    print("\n[STAGE 5] Verified Research Report:")
    print(f"  Overall Confidence: {report.overall_confidence:.2f}")
    print(f"  Executive Summary: {report.executive_summary}\n")
    print("  Key Findings:")
    for finding in report.findings:
        print(f"   * {finding}")

    if args.benchmark:
        run_benchmark(engine, args.query)


if __name__ == "__main__":
    main()
