import asyncio
import random
import time
import uuid
from collections import deque
from typing import Any

try:
    from .models import RateLimitConfig, ProviderTier, TokenReservation, ReservationStatus
except ImportError:
    from models import RateLimitConfig, ProviderTier, TokenReservation, ReservationStatus


class ProviderBucketState:
    """Internal state tracking tokens, sliding window requests, and metrics for a single provider."""

    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.max_tokens = float(config.tpm_limit * config.burst_multiplier)
        self.tokens = self.max_tokens
        self.refill_rate = float(config.tpm_limit) / 60.0  # tokens per second
        self.last_refill = time.monotonic()
        self.request_timestamps: deque[float] = deque()
        self.lock = asyncio.Lock()

        # Telemetry
        self.granted_count = 0
        self.throttled_count = 0
        self.total_tokens_consumed = 0

    def refill(self, now: float) -> None:
        """Refills tokens proportionally based on elapsed wall-clock time."""
        elapsed = now - self.last_refill
        if elapsed > 0:
            self.tokens = min(self.max_tokens, self.tokens + (elapsed * self.refill_rate))
            self.last_refill = now

    def prune_window(self, now: float) -> None:
        """Prunes sliding request window timestamps older than 60 seconds."""
        cutoff = now - 60.0
        while self.request_timestamps and self.request_timestamps[0] < cutoff:
            self.request_timestamps.popleft()


class AsyncRateLimiter:
    """High-throughput concurrency-safe async token bucket and sliding window rate limiter."""

    def __init__(self):
        self.buckets: dict[str, ProviderBucketState] = {}
        self._global_lock = asyncio.Lock()

    def register_config(self, config: RateLimitConfig) -> None:
        """Registers or updates rate limit configuration for a provider."""
        self.buckets[config.provider] = ProviderBucketState(config)

    def calculate_jittered_backoff_ms(self, state: ProviderBucketState, tokens_needed: int) -> float:
        """Calculates milliseconds to refill required tokens, plus randomized exponential jitter."""
        deficit = max(0.0, float(tokens_needed) - state.tokens)
        base_seconds = deficit / max(0.1, state.refill_rate)
        base_ms = base_seconds * 1000.0
        # Add 10% - 30% uniform jitter to avoid thundering herd
        jitter_ms = random.uniform(0.1, 0.3) * max(10.0, base_ms)
        return round(base_ms + jitter_ms, 2)

    async def acquire(
        self,
        provider: str,
        tokens: int,
        priority: int = 1,
        timeout_ms: float = 0.0,
    ) -> TokenReservation:
        """
        Attempts to reserve token and RPM quota for a provider request.
        Priority:
          0 = P0 Critical (evaluation/user prompt, allows 100% capacity + burst)
          1 = P1 Standard
          2 = P2 Batch (backs off if tokens < 20% or RPM > 85%)
        """
        if provider not in self.buckets:
            raise KeyError(f"Provider '{provider}' has no registered RateLimitConfig")

        state = self.buckets[provider]
        reservation_id = f"res_{uuid.uuid4().hex[:8]}"
        start_time = time.monotonic()
        total_waited_ms = 0.0

        while True:
            async with state.lock:
                now = time.monotonic()
                state.refill(now)
                state.prune_window(now)

                rpm_usage = len(state.request_timestamps)
                rpm_limit = state.config.rpm_limit
                tokens_available = state.tokens

                # Priority reservations: P2 batch jobs preserve a 20% token buffer and 15% RPM buffer
                if priority >= 2:
                    min_token_threshold = 0.20 * state.max_tokens
                    max_rpm_threshold = 0.85 * rpm_limit
                    if tokens_available - tokens < min_token_threshold or rpm_usage >= max_rpm_threshold:
                        state.throttled_count += 1
                        backoff = self.calculate_jittered_backoff_ms(state, tokens)
                        return TokenReservation(
                            reservation_id=reservation_id,
                            provider=provider,
                            tokens_requested=tokens,
                            priority=priority,
                            status=ReservationStatus.RATE_LIMITED,
                            wait_time_ms=round(total_waited_ms, 2),
                            retry_after_ms=backoff,
                            timestamp_ms=round(now * 1000.0, 2),
                        )

                # Check standard constraints (RPM and Token Bucket)
                rpm_allowed = rpm_usage < rpm_limit
                tokens_allowed = tokens_available >= tokens

                if rpm_allowed and tokens_allowed:
                    # Grant reservation
                    state.tokens -= tokens
                    state.request_timestamps.append(now)
                    state.granted_count += 1
                    state.total_tokens_consumed += tokens

                    return TokenReservation(
                        reservation_id=reservation_id,
                        provider=provider,
                        tokens_requested=tokens,
                        priority=priority,
                        status=ReservationStatus.GRANTED,
                        wait_time_ms=round(total_waited_ms, 2),
                        retry_after_ms=0.0,
                        timestamp_ms=round(now * 1000.0, 2),
                    )

                # If we cannot grant immediately, compute wait time
                backoff_ms = self.calculate_jittered_backoff_ms(state, tokens)

            # Outside lock: check if caller configured waiting within timeout
            remaining_timeout = timeout_ms - total_waited_ms
            if remaining_timeout > 0 and backoff_ms <= remaining_timeout:
                sleep_secs = min(backoff_ms / 1000.0, remaining_timeout / 1000.0)
                await asyncio.sleep(sleep_secs)
                total_waited_ms += sleep_secs * 1000.0
            else:
                async with state.lock:
                    state.throttled_count += 1
                return TokenReservation(
                    reservation_id=reservation_id,
                    provider=provider,
                    tokens_requested=tokens,
                    priority=priority,
                    status=ReservationStatus.RATE_LIMITED,
                    wait_time_ms=round(total_waited_ms, 2),
                    retry_after_ms=backoff_ms,
                    timestamp_ms=round(time.monotonic() * 1000.0, 2),
                )

    def get_metrics(self, provider: str) -> dict[str, Any]:
        """Returns rate limiting metrics and token availability for a provider."""
        if provider not in self.buckets:
            raise KeyError(f"Provider '{provider}' not found")
        state = self.buckets[provider]
        now = time.monotonic()
        state.refill(now)
        state.prune_window(now)

        return {
            "provider": provider,
            "tier": state.config.tier.value,
            "tokens_available": round(state.tokens, 2),
            "max_tokens": round(state.max_tokens, 2),
            "current_rpm_usage": len(state.request_timestamps),
            "rpm_limit": state.config.rpm_limit,
            "granted_count": state.granted_count,
            "throttled_count": state.throttled_count,
            "total_tokens_consumed": state.total_tokens_consumed,
        }

    def reset(self, provider: str | None = None) -> None:
        """Resets bucket state for testing and initialization."""
        if provider:
            if provider in self.buckets:
                cfg = self.buckets[provider].config
                self.buckets[provider] = ProviderBucketState(cfg)
        else:
            for p, state in self.buckets.items():
                self.buckets[p] = ProviderBucketState(state.config)
