from typing import Any, Optional
from pydantic import BaseModel, Field


class DuplicateMatch(BaseModel):
    record_id: str
    matched_id: str
    match_type: str  # "EXACT" or "NEAR"
    hamming_distance: int = 0
    similarity: float = 1.0


class RecordAudit(BaseModel):
    record_id: str
    status: str  # "CLEAN", "QUARANTINED", "CORRUPT", "EXACT_DUPLICATE", "NEAR_DUPLICATE", "DUPLICATE"
    issues: list[str] = Field(default_factory=list)
    normalized_text: Optional[str] = None
    sha256: Optional[str] = None
    simhash: Optional[int] = None
    simhash_hex: Optional[str] = None
    duplicate_of: Optional[str] = None
    match_type: Optional[str] = None
    raw_data: dict[str, Any] = Field(default_factory=dict)


class SentinelReport(BaseModel):
    total_records: int = 0
    clean_records: int = 0
    quarantined_records: int = 0
    duplicate_records: int = 0
    exact_duplicate_records: int = 0
    near_duplicate_records: int = 0
    duplicates: list[DuplicateMatch] = Field(default_factory=list)
    audits: list[RecordAudit] = Field(default_factory=list)

    @property
    def clean_audits(self) -> list[RecordAudit]:
        return [a for a in self.audits if a.status == "CLEAN"]

    @property
    def quarantined_audits(self) -> list[RecordAudit]:
        return [a for a in self.audits if a.status in ("QUARANTINED", "CORRUPT")]

    @property
    def duplicate_audits(self) -> list[RecordAudit]:
        return [a for a in self.audits if a.status in ("DUPLICATE", "EXACT_DUPLICATE", "NEAR_DUPLICATE")]
