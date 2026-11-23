import time
from typing import List
from pydantic import BaseModel, Field


class TrainingConfig(BaseModel):
    vocab_size: int = Field(default=256, ge=1)
    model_dim: int = Field(default=64, ge=8)
    hidden_dim: int = Field(default=128, ge=8)
    num_layers: int = Field(default=4, ge=2)
    batch_size: int = Field(default=8, ge=1)
    micro_batch_size: int = Field(default=2, ge=1)
    gradient_accumulation_steps: int = Field(default=4, ge=1)
    tp_size: int = Field(default=2, ge=1)
    pp_size: int = Field(default=2, ge=1)
    zero_shards: int = Field(default=2, ge=1)
    learning_rate: float = Field(default=1e-3, gt=0.0)
    weight_decay: float = Field(default=0.01, ge=0.0)
    max_steps: int = Field(default=10, ge=1)
    checkpoint_dir: str = "./checkpoints"
    device: str = "cpu"


class StepMetrics(BaseModel):
    step: int
    loss: float
    grad_norm: float
    accumulated_samples: int
    step_time_ms: float
    device: str


class CheckpointMetadata(BaseModel):
    step: int
    loss: float
    tp_size: int
    pp_size: int
    zero_shards: int
    model_dim: int
    timestamp: float = Field(default_factory=time.time)
    saved_files: List[str] = Field(default_factory=list)
