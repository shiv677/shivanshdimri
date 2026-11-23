import asyncio
import sys
import time
from pathlib import Path
import pytest
from pydantic import ValidationError

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from projects.distributed_token_bucket_limiter.models import (
        RateLimitConfig,
        ProviderTier,
        TokenReservation,
        ReservationStatus,
    )
    from projects.distributed_token_bucket_limiter.limiter import AsyncRateLimiter
except ImportError:
    from models import (
        RateLimitConfig,
        ProviderTier,
        TokenReservation,
        ReservationStatus,
    )
    from limiter import AsyncRateLimiter


def test_models_validation():
    # Valid config
    cfg = RateLimitConfig(
        provider="gpt-4",
        tier=ProviderTier.ENTERPRISE,
        tpm_limit=60000,
        rpm_limit=100,
        burst_multiplier=1.2,
    )
    assert cfg.provider == "gpt-4"
    assert cfg.burst_multiplier == 1.2

    # Negative limits should fail validation
    with pytest.raises(ValidationError):
        RateLimitConfig(provider="bad", tpm_limit=-100, rpm_limit=10)

    with pytest.raises(ValidationError):
        RateLimitConfig(provider="bad", tpm_limit=100, rpm_limit=-5)


@pytest.mark.asyncio
async def test_token_bucket_grant_and_capacity():
    limiter = AsyncRateLimiter()
    cfg = RateLimitConfig(
        provider="test-provider",
        tier=ProviderTier.STANDARD,
        tpm_limit=6000,  # 100 tokens/sec
        rpm_limit=100,
        burst_multiplier=1.0,
    )
    limiter.register_config(cfg)

    # Initial acquire of 2000 tokens should be GRANTED
    res = await limiter.acquire("test-provider", tokens=2000, priority=1)
    assert res.status == ReservationStatus.GRANTED
    assert res.tokens_requested == 2000

    metrics = limiter.get_metrics("test-provider")
    assert metrics["granted_count"] == 1
    assert metrics["tokens_available"] == pytest.approx(4000, abs=10)


@pytest.mark.asyncio
async def test_sliding_window_rpm_limit():
    limiter = AsyncRateLimiter()
    cfg = RateLimitConfig(
        provider="rpm-provider",
        tier=ProviderTier.FREE,
        tpm_limit=1000000,  # ample tokens
        rpm_limit=3,         # only 3 requests allowed
        burst_multiplier=1.0,
    )
    limiter.register_config(cfg)

    # First 3 requests should be granted
    for _ in range(3):
        res = await limiter.acquire("rpm-provider", tokens=10, priority=1)
        assert res.status == ReservationStatus.GRANTED

    # 4th request should be throttled on RPM
    res_throttled = await limiter.acquire("rpm-provider", tokens=10, priority=1)
    assert res_throttled.status == ReservationStatus.RATE_LIMITED
    assert res_throttled.retry_after_ms > 0


@pytest.mark.asyncio
async def test_priority_scheduling_p0_vs_batch():
    limiter = AsyncRateLimiter()
    cfg = RateLimitConfig(
        provider="priority-provider",
        tier=ProviderTier.STANDARD,
        tpm_limit=10000,
        rpm_limit=100,
        burst_multiplier=1.0,
    )
    limiter.register_config(cfg)

    # Drain tokens down to 15% capacity (1,500 left out of 10,000)
    await limiter.acquire("priority-provider", tokens=8500, priority=0)

    # Batch request (P2) requesting 500 tokens should be RATE_LIMITED because available tokens < 20%
    res_batch = await limiter.acquire("priority-provider", tokens=500, priority=2)
    assert res_batch.status == ReservationStatus.RATE_LIMITED

    # P0 critical request requesting 500 tokens should still be GRANTED
    res_p0 = await limiter.acquire("priority-provider", tokens=500, priority=0)
    assert res_p0.status == ReservationStatus.GRANTED


@pytest.mark.asyncio
async def test_concurrency_safe_acquisitions():
    limiter = AsyncRateLimiter()
    cfg = RateLimitConfig(
        provider="concurrent-provider",
        tier=ProviderTier.ENTERPRISE,
        tpm_limit=50000,
        rpm_limit=500,
        burst_multiplier=1.0,
    )
    limiter.register_config(cfg)

    async def worker(amount: int):
        return await limiter.acquire("concurrent-provider", tokens=amount, priority=1)

    # Launch 20 concurrent tasks requesting 1,000 tokens each = 20,000 tokens total
    tasks = [worker(1000) for _ in range(20)]
    results = await asyncio.gather(*tasks)

    granted = [r for r in results if r.status == ReservationStatus.GRANTED]
    assert len(granted) == 20

    metrics = limiter.get_metrics("concurrent-provider")
    assert metrics["granted_count"] == 20
    assert metrics["total_tokens_consumed"] == 20000
    assert metrics["tokens_available"] == pytest.approx(30000, abs=50)


@pytest.mark.asyncio
async def test_jittered_backoff_and_retry_after():
    limiter = AsyncRateLimiter()
    cfg = RateLimitConfig(
        provider="backoff-provider",
        tier=ProviderTier.FREE,
        tpm_limit=6000,  # 100 tokens/sec
        rpm_limit=100,
        burst_multiplier=1.0,
    )
    limiter.register_config(cfg)

    # Drain all 6000 tokens
    await limiter.acquire("backoff-provider", tokens=6000, priority=0)

    # Request another 500 tokens
    res = await limiter.acquire("backoff-provider", tokens=500, priority=1)
    assert res.status == ReservationStatus.RATE_LIMITED
    # Need 500 tokens at 100 tokens/sec = ~5000ms base + jitter
    assert res.retry_after_ms >= 5000.0


@pytest.mark.asyncio
async def test_reset_limiter():
    limiter = AsyncRateLimiter()
    cfg = RateLimitConfig(provider="reset-provider", tpm_limit=1000, rpm_limit=10)
    limiter.register_config(cfg)

    await limiter.acquire("reset-provider", tokens=500)
    assert limiter.get_metrics("reset-provider")["granted_count"] == 1

    limiter.reset("reset-provider")
    assert limiter.get_metrics("reset-provider")["granted_count"] == 0
