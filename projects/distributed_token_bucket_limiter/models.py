from enum import Enum
from pydantic import BaseModel, Field


class ProviderTier(str, Enum):
    FREE = "FREE"
    STANDARD = "STANDARD"
    ENTERPRISE = "ENTERPRISE"


class ReservationStatus(str, Enum):
    GRANTED = "GRANTED"
    RATE_LIMITED = "RATE_LIMITED"
    REJECTED = "REJECTED"
    QUEUED = "QUEUED"


class RateLimitConfig(BaseModel):
    provider: str
    tier: ProviderTier = ProviderTier.STANDARD
    tpm_limit: int = Field(gt=0, description="Tokens per minute limit")
    rpm_limit: int = Field(gt=0, description="Requests per minute limit")
    burst_multiplier: float = Field(default=1.2, ge=1.0, description="Allowed burst headroom above base TPM")


class TokenReservation(BaseModel):
    reservation_id: str
    provider: str
    tokens_requested: int = Field(ge=0)
    priority: int = Field(default=1, ge=0, le=3, description="0=P0 critical, 1=P1 normal, 2=P2 batch")
    status: ReservationStatus = ReservationStatus.GRANTED
    wait_time_ms: float = Field(default=0.0, ge=0.0)
    retry_after_ms: float = Field(default=0.0, ge=0.0)
    timestamp_ms: float = Field(default=0.0, ge=0.0)
