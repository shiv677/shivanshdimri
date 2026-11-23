from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    tool_name: str
    success: bool
    output: str
    execution_time_ms: float = 0.0
    error: Optional[str] = None


class TaskNode(BaseModel):
    task_id: str
    description: str
    dependencies: List[str] = Field(default_factory=list)
    assigned_agent: str = "researcher"
    status: str = "pending"  # pending, running, completed, failed
    tool_calls: List[ToolCall] = Field(default_factory=list)
    output: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DAGPlan(BaseModel):
    query: str
    tasks: Dict[str, TaskNode] = Field(default_factory=dict)


class MemoryItem(BaseModel):
    key: str
    content: str
    source_agent: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Conflict(BaseModel):
    topic: str
    claim_a: str
    claim_b: str
    source_a: str
    source_b: str
    resolution: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class VerificationResult(BaseModel):
    is_valid: bool
    score: float = Field(default=1.0, ge=0.0, le=1.0)
    critique: str = ""
    missing_aspects: List[str] = Field(default_factory=list)
    hallucinations: List[str] = Field(default_factory=list)


class ResearchReport(BaseModel):
    query: str
    executive_summary: str
    findings: List[str] = Field(default_factory=list)
    resolved_conflicts: List[Conflict] = Field(default_factory=list)
    verification: Optional[VerificationResult] = None
    execution_stages: List[List[str]] = Field(default_factory=list)
    overall_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
