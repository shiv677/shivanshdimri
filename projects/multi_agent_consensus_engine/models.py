from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class AgentScore(BaseModel):
    agent_name: str
    score: float = Field(..., ge=0.0, le=1.0, description="Normalized agent score [0.0, 1.0]")
    passed: bool
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Agent confidence score [0.0, 1.0]")
    critique: str
    flags: List[str] = Field(default_factory=list)
    details: Dict[str, Any] = Field(default_factory=dict)

    @property
    def reasoning(self) -> str:
        return self.critique


# Backward-compatible alias
AgentVerdict = AgentScore


class ConsensusResult(BaseModel):
    sample_id: str
    task_id: str = ""
    prompt: str = ""
    candidate_response: str = ""
    context: str = ""
    round_count: int = 1
    final_score: float = Field(..., ge=0.0, le=1.0, description="Weighted composite score: 0.4*G + 0.4*R + 0.2*S")
    weighted_score: float = Field(default=0.0, ge=0.0, le=1.0)
    composite_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    passed: bool
    escalate_to_human: bool
    consensus_status: str  # "VERIFIED_ACCEPT", "FLAG_REJECT", "HUMAN_AUDIT"
    final_verdict: str  # "ACCEPT", "REJECT", "NEEDS_REVIEW"
    consensus_reached: bool = True
    weights: Dict[str, float] = Field(
        default_factory=lambda: {"grounding": 0.4, "reasoning": 0.4, "schema": 0.2}
    )
    agent_scores: Dict[str, AgentScore] = Field(default_factory=dict)
    individual_verdicts: Dict[str, AgentScore] = Field(default_factory=dict)
    summary: str
    synthesis_notes: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def populate_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("task_id") and data.get("sample_id"):
                data["task_id"] = data["sample_id"]
            if not data.get("sample_id") and data.get("task_id"):
                data["sample_id"] = data["task_id"]

            if "final_score" in data and ("weighted_score" not in data or data["weighted_score"] == 0.0):
                data["weighted_score"] = data["final_score"]
            elif "weighted_score" in data and "final_score" not in data:
                data["final_score"] = data["weighted_score"]

            if "agent_scores" in data and not data.get("individual_verdicts"):
                data["individual_verdicts"] = data["agent_scores"]
            elif "individual_verdicts" in data and not data.get("agent_scores"):
                data["agent_scores"] = data["individual_verdicts"]
        return data


# Backward-compatible alias
ConsensusRubric = ConsensusResult


class EvaluationSample(BaseModel):
    id: str
    prompt: str
    response: str
    reference_data: str = ""
    chain_of_thought: str = ""
    structured_output: Optional[Dict[str, Any]] = None
    expected_schema: Optional[Dict[str, Any]] = None
    required_format: str = "text"
    required_keys: Optional[List[str]] = None


class EvaluationReport(BaseModel):
    total_samples: int
    passed_samples: int
    escalated_samples: int
    rejected_samples: int
    average_score: float
    results: List[ConsensusResult]
