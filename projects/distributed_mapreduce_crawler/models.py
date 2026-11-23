import time
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class CrawlTask(BaseModel):
    url: str
    depth: int = Field(default=0, ge=0)
    domain: str
    status: TaskStatus = TaskStatus.PENDING
    retry_count: int = Field(default=0, ge=0)
    max_retries: int = Field(default=3, ge=1)
    error_message: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class ExtractedDocument(BaseModel):
    url: str
    domain: str
    title: str
    content_text: str
    content_hash: str
    word_count: int = Field(default=0, ge=0)
    discovered_links: List[str] = Field(default_factory=list)
    extraction_latency_ms: float = Field(default=0.0, ge=0.0)


class CrawlStats(BaseModel):
    total_discovered: int = 0
    total_completed: int = 0
    total_failed: int = 0
    total_words_extracted: int = 0
    domain_counts: dict = Field(default_factory=dict)
