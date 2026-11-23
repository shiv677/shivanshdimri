import sys
from pathlib import Path
import pytest
from pydantic import ValidationError

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from projects.agentic_tool_eval_harness.models import (
        ToolSignature,
        ToolCallRecord,
        TrajectoryStep,
        AgentTrajectory,
        EvalMetricSummary,
    )
    from projects.agentic_tool_eval_harness.evaluator import (
        match_tool_signature,
        find_hallucinated_arguments,
        evaluate_trajectory,
        evaluate_batch,
    )
    from projects.agentic_tool_eval_harness.main import load_trajectories, run_evaluation, DEFAULT_REGISTRY
except ImportError:
    from models import (
        ToolSignature,
        ToolCallRecord,
        TrajectoryStep,
        AgentTrajectory,
        EvalMetricSummary,
    )
    from evaluator import (
        match_tool_signature,
        find_hallucinated_arguments,
        evaluate_trajectory,
        evaluate_batch,
    )
    from main import load_trajectories, run_evaluation, DEFAULT_REGISTRY


def test_models_validation():
    # Valid tool signature
    tool = ToolSignature(name="search", description="Web search", parameters={"q": "str"}, required=["q"])
    assert tool.name == "search"
    assert tool.required == ["q"]

    # Valid tool call record
    call = ToolCallRecord(tool_name="search", arguments={"q": "python"}, execution_time_ms=120.0, cost_usd=0.002)
    assert call.execution_time_ms == 120.0

    # Negative execution time should fail
    with pytest.raises(ValidationError):
        ToolCallRecord(tool_name="search", execution_time_ms=-5.0)

    # Negative step index should fail
    with pytest.raises(ValidationError):
        TrajectoryStep(step_index=-1)


def test_fuzzy_tool_signature_matching():
    registry = {
        "database_query": ToolSignature(name="database_query"),
        "http_request": ToolSignature(name="http_request"),
    }

    # Exact match
    sig, sim = match_tool_signature("database_query", registry)
    assert sig is not None
    assert sig.name == "database_query"
    assert sim == 1.0

    # Slight typo match
    sig_fuzzy, sim_fuzzy = match_tool_signature("database_querry", registry, similarity_threshold=0.8)
    assert sig_fuzzy is not None
    assert sig_fuzzy.name == "database_query"
    assert sim_fuzzy > 0.85

    # Completely alien tool
    sig_none, sim_low = match_tool_signature("render_3d_mesh", registry, similarity_threshold=0.7)
    assert sig_none is None
    assert sim_low < 0.5


def test_hallucinated_argument_detection():
    context = "Customer reported outage on cluster prod-west-2 for service auth-service."

    # Grounded call
    grounded_action = ToolCallRecord(
        tool_name="inspect_cluster",
        arguments={"cluster": "prod-west-2", "service": "auth-service"},
    )
    hallucinations = find_hallucinated_arguments(grounded_action, context)
    assert len(hallucinations) == 0

    # Ungrounded call with fabricated cluster ID
    hallucinated_action = ToolCallRecord(
        tool_name="inspect_cluster",
        arguments={"cluster": "phantom-secret-datacenter-99", "service": "auth-service"},
    )
    hallucinations = find_hallucinated_arguments(hallucinated_action, context)
    assert len(hallucinations) == 1
    assert hallucinations[0]["value"] == "phantom-secret-datacenter-99"
    assert hallucinations[0]["argument"] == "cluster"


def test_trajectory_latency_and_cost_accounting():
    traj = AgentTrajectory(
        trajectory_id="latency_test",
        task_goal="Measure latencies and costs",
        steps=[
            TrajectoryStep(
                step_index=0,
                action=ToolCallRecord(tool_name="tool_a", execution_time_ms=50.0, cost_usd=0.001),
            ),
            TrajectoryStep(
                step_index=1,
                action=ToolCallRecord(tool_name="tool_b", execution_time_ms=150.5, cost_usd=0.0025),
            ),
        ],
        success=True,
    )

    summary = evaluate_trajectory(traj)
    assert summary.total_latency_ms == pytest.approx(200.5)
    assert summary.total_cost_usd == pytest.approx(0.0035)
    assert summary.total_steps == 2
    assert summary.tool_call_count == 2


def test_rubric_scoring_and_goal_attainment():
    traj_success = AgentTrajectory(
        trajectory_id="scoring_pass",
        task_goal="Lookup balance for user user_123",
        ground_truth_tools=["lookup_user"],
        steps=[
            TrajectoryStep(
                step_index=0,
                action=ToolCallRecord(tool_name="lookup_user", arguments={"user": "user_123"}),
                observation="user_123 balance is 500 USD",
            )
        ],
        final_answer="user_123 balance is 500 USD",
        success=True,
    )

    summary_pass = evaluate_trajectory(traj_success, {"lookup_user": ToolSignature(name="lookup_user")})
    assert summary_pass.goal_attained is True
    assert summary_pass.tool_call_precision == 1.0
    assert summary_pass.tool_call_recall == 1.0
    assert summary_pass.hallucinated_argument_count == 0
    assert summary_pass.rubric_score == 1.0

    # Failed goal trajectory
    traj_fail = AgentTrajectory(
        trajectory_id="scoring_fail",
        task_goal="Lookup balance for user user_123",
        ground_truth_tools=["lookup_user"],
        steps=[],
        success=False,
    )
    summary_fail = evaluate_trajectory(traj_fail, {"lookup_user": ToolSignature(name="lookup_user")})
    assert summary_fail.goal_attained is False
    assert summary_fail.rubric_score < 0.5


def test_sample_dataset_loading_and_batch_evaluation():
    sample_file = Path(__file__).parent / "sample_agent_trajectories.jsonl"
    trajectories = load_trajectories(sample_file)
    assert len(trajectories) >= 3

    summaries = evaluate_batch(trajectories, DEFAULT_REGISTRY)
    assert len(summaries) == len(trajectories)

    # First trajectory should pass goal
    assert summaries[0].goal_attained is True
    assert summaries[0].rubric_score > 0.8

    # Second trajectory has hallucinated arguments and failed goal
    assert summaries[1].goal_attained is False
    assert summaries[1].hallucinated_argument_count > 0

    # Third trajectory should pass goal
    assert summaries[2].goal_attained is True


def test_empty_trajectory_edge_case():
    empty_traj = AgentTrajectory(
        trajectory_id="empty",
        task_goal="Do nothing",
        ground_truth_tools=[],
        steps=[],
    )
    summary = evaluate_trajectory(empty_traj)
    assert summary.total_steps == 0
    assert summary.tool_call_count == 0
    assert summary.valid_tool_count == 0
