import os
import tempfile
from pathlib import Path
import pytest

try:
    from .models import (
        DAGPlan,
        MemoryItem,
        TaskNode,
        ToolCall,
    )
    from .engine import (
        ConflictReferee,
        PersistentMemory,
        ResearchEngine,
        ToolSandbox,
        safe_eval_math,
        topological_sort_dag,
    )
except ImportError:
    try:
        from models import (
            DAGPlan,
            MemoryItem,
            TaskNode,
            ToolCall,
        )
        from engine import (
            ConflictReferee,
            PersistentMemory,
            ResearchEngine,
            ToolSandbox,
            safe_eval_math,
            topological_sort_dag,
        )
    except ImportError:
        from projects.autonomous_multi_agent_research.models import (
            DAGPlan,
            MemoryItem,
            TaskNode,
            ToolCall,
        )
        from projects.autonomous_multi_agent_research.engine import (
            ConflictReferee,
            PersistentMemory,
            ResearchEngine,
            ToolSandbox,
            safe_eval_math,
            topological_sort_dag,
        )


def test_topological_sort_valid_dag():
    """Verify DAG topological sorting yields valid parallel execution stages."""
    tasks = {
        "t1": TaskNode(task_id="t1", description="fetch", dependencies=[]),
        "t2": TaskNode(task_id="t2", description="extract", dependencies=["t1"]),
        "t3": TaskNode(task_id="t3", description="validate", dependencies=["t1"]),
        "t4": TaskNode(task_id="t4", description="aggregate", dependencies=["t2", "t3"]),
    }
    dag = DAGPlan(query="Test Plan", tasks=tasks)
    stages = topological_sort_dag(dag)

    assert len(stages) == 3
    assert stages[0] == ["t1"]
    assert set(stages[1]) == {"t2", "t3"}
    assert stages[2] == ["t4"]


def test_topological_sort_cycle_detection():
    """Ensure cycle detection raises ValueError."""
    tasks = {
        "a": TaskNode(task_id="a", description="a", dependencies=["b"]),
        "b": TaskNode(task_id="b", description="b", dependencies=["a"]),
    }
    dag = DAGPlan(query="Cyclic", tasks=tasks)
    with pytest.raises(ValueError, match="Cycle detected"):
        topological_sort_dag(dag)


def test_topological_sort_missing_dependency():
    """Ensure missing dependency raises ValueError."""
    tasks = {
        "a": TaskNode(task_id="a", description="a", dependencies=["missing_task"]),
    }
    dag = DAGPlan(query="Missing Dep", tasks=tasks)
    with pytest.raises(ValueError, match="not found in DAG"):
        topological_sort_dag(dag)


def test_tool_sandbox_execution():
    """Verify built-in tools execute correctly within sandbox."""
    sandbox = ToolSandbox()

    # Search tool
    res_search = sandbox.execute("search", query="FlashAttention")
    assert res_search.success is True
    assert "SRAM tiling" in res_search.output

    # Math tool
    res_calc = sandbox.execute("calculate", expression="(50 * 2) / 4")
    assert res_calc.success is True
    assert res_calc.output == "25"

    # Summarize tool
    res_sum = sandbox.execute("summarize", text="Line one.\nLine two.\nLine three.")
    assert res_sum.success is True
    assert "Line one. Line two." in res_sum.output


def test_tool_sandbox_safety_and_errors():
    """Verify sandbox rejects unauthorized or invalid computations safely."""
    sandbox = ToolSandbox()

    # Division by zero
    res_div0 = sandbox.execute("calculate", expression="10 / 0")
    assert res_div0.success is False
    assert "ZeroDivisionError" in res_div0.error

    # Unauthorized AST nodes (e.g., function calls / imports)
    res_unauth = sandbox.execute("calculate", expression="__import__('os').system('ls')")
    assert res_unauth.success is False
    assert "Unsupported" in res_unauth.error

    # Unknown tool
    res_unknown = sandbox.execute("unknown_tool", query="test")
    assert res_unknown.success is False
    assert "not registered" in res_unknown.error


def test_persistent_memory_store_search_and_io():
    """Test memory storage, keyword search ranking, and JSON serialization."""
    memory = PersistentMemory()

    memory.store(
        MemoryItem(
            key="m1",
            content="FlashAttention optimizes GPU memory IO via tiling.",
            source_agent="researcher_a",
            confidence=0.9,
        )
    )
    memory.store(
        MemoryItem(
            key="m2",
            content="Quantization lowers parameter bit-depth.",
            source_agent="researcher_b",
            confidence=0.8,
        )
    )

    # Search
    search_results = memory.search("FlashAttention")
    assert len(search_results) == 1
    assert search_results[0].key == "m1"

    # Persistence to file
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        memory.save_to_file(tmp_path)
        new_memory = PersistentMemory()
        new_memory.load_from_file(tmp_path)

        assert new_memory.get("m1") is not None
        assert new_memory.get("m1").content == memory.get("m1").content
        assert new_memory.get("m2").confidence == 0.8
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_conflict_referee_arbitration():
    """Test detection and arbitration of conflicting claims across agents."""
    referee = ConflictReferee()

    items = [
        MemoryItem(
            key="latency_benchmark",
            content="Observed inference latency increased to 45ms.",
            source_agent="agent_alpha",
            confidence=0.70,
            metadata={"topic": "latency_bench", "metric_val": 45.0},
        ),
        MemoryItem(
            key="latency_benchmark_v2",
            content="Observed inference latency decreased to 18ms.",
            source_agent="agent_beta",
            confidence=0.95,
            metadata={"topic": "latency_bench", "metric_val": 18.0},
        ),
    ]

    conflicts = referee.arbitrate(items)
    assert len(conflicts) == 1
    conflict = conflicts[0]
    assert conflict.topic == "latency_bench"
    assert "agent_beta" in conflict.resolution
    assert conflict.confidence == 0.95


def test_self_verification_and_refinement():
    """Test verification scoring and detection of ungrounded or speculative claims."""
    engine = ResearchEngine()

    memory = PersistentMemory()
    memory.store(
        MemoryItem(
            key="k1",
            content="FlashAttention improves GPU throughput.",
            source_agent="literature_miner",
            confidence=0.95,
        )
    )

    # Grounded report
    v_good = engine.verify_report(
        summary="FlashAttention improves throughput.",
        findings=["FlashAttention improves GPU throughput."],
        memory=memory,
    )
    assert v_good.is_valid is True
    assert v_good.score >= 0.75

    # Report with hallucination flag
    v_bad = engine.verify_report(
        summary="This includes a hypothetical breakthrough and unverified claim.",
        findings=["Completely disconnected finding."],
        memory=memory,
    )
    assert v_bad.is_valid is False
    assert len(v_bad.hallucinations) > 0


def test_end_to_end_research_engine_execution():
    """Verify complete autonomous research pipeline produces verified report."""
    engine = ResearchEngine()
    dag = engine.build_default_dag("FlashAttention optimization")

    report = engine.execute_plan(dag)

    assert report.query == "FlashAttention optimization"
    assert len(report.execution_stages) >= 2
    assert len(report.findings) >= 2
    assert report.verification is not None
    assert report.verification.is_valid is True
    assert report.overall_confidence > 0.7
