import time
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class SequenceStatus(str, Enum):
    WAITING = "WAITING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    PREEMPTED = "PREEMPTED"


class GenerationConfig(BaseModel):
    max_new_tokens: int = Field(default=32, ge=1)
    temperature: float = Field(default=0.7, ge=0.0)
    top_k: int = Field(default=50, ge=1)
    stop_token_ids: List[int] = Field(default_factory=lambda: [0])


class Request(BaseModel):
    request_id: str
    prompt_tokens: List[int] = Field(..., min_length=1)
    generation_config: GenerationConfig = Field(default_factory=GenerationConfig)
    arrival_time: float = Field(default_factory=time.time)


class Sequence(BaseModel):
    request_id: str
    prompt_tokens: List[int]
    output_tokens: List[int] = Field(default_factory=list)
    generation_config: GenerationConfig = Field(default_factory=GenerationConfig)
    status: SequenceStatus = SequenceStatus.WAITING
    block_ids: List[int] = Field(default_factory=list)
    created_at: float = Field(default_factory=time.time)
    finished_at: Optional[float] = None

    @property
    def total_len(self) -> int:
        return len(self.prompt_tokens) + len(self.output_tokens)


class EngineConfig(BaseModel):
    vocab_size: int = Field(default=1024, ge=16)
    hidden_dim: int = Field(default=128, ge=8)
    num_heads: int = Field(default=4, ge=1)
    head_dim: int = Field(default=32, ge=4)
    block_size: int = Field(default=16, ge=1)
    num_blocks: int = Field(default=64, ge=4)
    quantize_int8: bool = Field(default=True)
    max_batch_size: int = Field(default=16, ge=1)
    seed: int = Field(default=42)


class QuantStats(BaseModel):
    scale: float
    max_err: float
    mean_err: float
    compression_ratio: float = 4.0


class StepExecutionRecord(BaseModel):
    step_idx: int
    running_seqs: int
    waiting_seqs: int
    free_blocks: int
    tokens_generated: int


class BenchmarkResult(BaseModel):
    total_requests: int
    completed_requests: int
    preempted_count: int
    total_prompt_tokens: int
    total_generated_tokens: int
    total_duration_sec: float
    throughput_tokens_per_sec: float
    peak_kv_blocks_used: int
    kv_block_utilization_pct: float
    quant_mae: float = 0.0
    steps: List[StepExecutionRecord] = Field(default_factory=list)
