from typing import Any
from pydantic import BaseModel, Field


class ToolSignature(BaseModel):
    name: str
    description: str = ""
    parameters: dict[str, Any] = Field(default_factory=dict)
    required: list[str] = Field(default_factory=list)


class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    output: str | None = None
    execution_time_ms: float = Field(default=0.0, ge=0.0)
    cost_usd: float = Field(default=0.0, ge=0.0)


class TrajectoryStep(BaseModel):
    step_index: int = Field(ge=0)
    thought: str = ""
    action: ToolCallRecord | None = None
    observation: str = ""
    timestamp_ms: float = Field(default=0.0, ge=0.0)


class AgentTrajectory(BaseModel):
    trajectory_id: str
    task_goal: str
    ground_truth_tools: list[str] = Field(default_factory=list)
    expected_final_answer: str | None = None
    steps: list[TrajectoryStep] = Field(default_factory=list)
    final_answer: str | None = None
    success: bool | None = None


class EvalMetricSummary(BaseModel):
    trajectory_id: str
    total_steps: int
    tool_call_count: int
    valid_tool_count: int
    tool_call_precision: float
    tool_call_recall: float
    hallucinated_argument_count: int
    hallucinated_arguments: list[dict[str, Any]] = Field(default_factory=list)
    goal_attained: bool
    total_latency_ms: float
    total_cost_usd: float
    rubric_score: float
