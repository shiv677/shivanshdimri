from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class BenchmarkItem(BaseModel):
    id: str
    prompt: str
    reference_answer: str
    category: str = "general"
    rubric_criteria: Dict[str, float] = Field(
        default_factory=lambda: {"accuracy": 0.4, "reasoning": 0.3, "groundedness": 0.3}
    )
    canary_token: Optional[str] = None
    adversarial_trap: Optional[str] = None
    metadata: Dict[str, str] = Field(default_factory=dict)


class ModelOutput(BaseModel):
    item_id: str
    model_name: str
    prompt_sent: str
    output_text: str
    latency_ms: float = 0.0
    tokens_used: int = 0


class RubricScoreItem(BaseModel):
    criterion: str
    score: float = Field(ge=0.0, le=10.0)
    weight: float = Field(ge=0.0, le=1.0)
    rationale: str = ""


class JudgeEvaluation(BaseModel):
    item_id: str
    model_name: str
    rubric_scores: List[RubricScoreItem]
    weighted_score: float = Field(ge=0.0, le=10.0)
    verdict: str  # "PASS", "MARGINAL", "FAIL"
    feedback: str = ""


class ContaminationReport(BaseModel):
    item_id: str
    model_name: str
    ngram_overlap_score: float = Field(ge=0.0, le=1.0)
    exact_substring_match: bool = False
    detected_canary_leak: bool = False
    is_contaminated: bool = False
    evidence: str = ""


class SignificanceTestResult(BaseModel):
    model_a: str
    model_b: str
    mean_a: float
    mean_b: float
    diff: float
    t_stat: float
    p_value: float
    is_significant: bool
    confidence_interval_95: Tuple[float, float]


class ModelBenchmarkSummary(BaseModel):
    model_name: str
    total_items: int
    mean_score: float
    pass_rate: float
    canary_leak_count: int
    contamination_count: int
    avg_latency_ms: float


class BenchmarkRunSummary(BaseModel):
    timestamp: str
    dataset_size: int
    model_summaries: Dict[str, ModelBenchmarkSummary]
    pairwise_significance: List[SignificanceTestResult]
