import time
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EvictionPolicy(str, Enum):
    LRU = "LRU"
    FIFO = "FIFO"
    LFU = "LFU"


class VectorRecord(BaseModel):
    id: str
    prompt: str
    vector: List[float]
    response: str
    token_count: int = Field(default=0, ge=0)
    cost: float = Field(default=0.0, ge=0.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: float = Field(default_factory=time.time)
    last_accessed: float = Field(default_factory=time.time)
    access_count: int = Field(default=1, ge=1)


class QueryMatch(BaseModel):
    record: Optional[VectorRecord] = None
    similarity: float = 0.0
    cache_hit: bool = False
    lookup_latency_ms: float = 0.0
    match_type: str = "MISS"  # "EXACT", "SEMANTIC", "MISS"


class CacheMetrics(BaseModel):
    total_queries: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    hit_rate: float = 0.0
    saved_tokens: int = 0
    estimated_cost_saved: float = 0.0
    eviction_count: int = 0
    current_memory_bytes: int = 0
    max_memory_bytes: int = 10 * 1024 * 1024  # 10 MB default
