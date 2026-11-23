import argparse
import asyncio
import random
import time

try:
    from .models import RateLimitConfig, ProviderTier, ReservationStatus
    from .limiter import AsyncRateLimiter
except ImportError:
    from models import RateLimitConfig, ProviderTier, ReservationStatus
    from limiter import AsyncRateLimiter


async def simulate_traffic_worker(
    limiter: AsyncRateLimiter,
    provider: str,
    worker_id: int,
    request_count: int,
    results: list,
):
    for i in range(request_count):
        # Assign priority: 20% P0 critical, 50% P1 normal, 30% P2 batch
        rand_val = random.random()
        if rand_val < 0.2:
            priority = 0
            tokens = random.randint(500, 1500)
        elif rand_val < 0.7:
            priority = 1
            tokens = random.randint(1000, 3000)
        else:
            priority = 2
            tokens = random.randint(3000, 8000)

        res = await limiter.acquire(provider=provider, tokens=tokens, priority=priority, timeout_ms=50.0)
        results.append(res)
        await asyncio.sleep(0.005)


async def run_simulation(concurrency: int = 5, requests_per_worker: int = 10):
    limiter = AsyncRateLimiter()

    # Configure multiple provider tiers
    configs = [
        RateLimitConfig(
            provider="openai-gpt-4o",
            tier=ProviderTier.ENTERPRISE,
            tpm_limit=120000,
            rpm_limit=600,
            burst_multiplier=1.25,
        ),
        RateLimitConfig(
            provider="anthropic-claude-3.5",
            tier=ProviderTier.STANDARD,
            tpm_limit=40000,
            rpm_limit=200,
            burst_multiplier=1.1,
        ),
        RateLimitConfig(
            provider="local-vllm",
            tier=ProviderTier.FREE,
            tpm_limit=8000,
            rpm_limit=50,
            burst_multiplier=1.0,
        ),
    ]
    for cfg in configs:
        limiter.register_config(cfg)

    print("=" * 80)
    print("Multi-Tenant LLM Rate Limiter Simulation Running...")
    print(f"Workers: {concurrency} | Requests/Worker: {requests_per_worker}")
    print("=" * 80)

    start_time = time.monotonic()
    tasks = []
    results = []

    for cfg in configs:
        for w in range(concurrency):
            tasks.append(simulate_traffic_worker(limiter, cfg.provider, w, requests_per_worker, results))

    await asyncio.gather(*tasks)
    elapsed = time.monotonic() - start_time

    print(f"Simulation completed in {elapsed:.3f} seconds. Total requests processed: {len(results)}")
    print("-" * 80)
    print(f"{'Provider':<24} | {'Tier':<10} | {'Tokens Left':<12} | {'RPM':<6} | {'Granted':<8} | {'Throttled'}")
    print("-" * 80)

    for cfg in configs:
        m = limiter.get_metrics(cfg.provider)
        print(
            f"{m['provider']:<24} | "
            f"{m['tier']:<10} | "
            f"{m['tokens_available']:<12.0f} | "
            f"{m['current_rpm_usage']:<6} | "
            f"{m['granted_count']:<8} | "
            f"{m['throttled_count']}"
        )
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Simulate High-Throughput Token Bucket Rate Limiter.")
    parser.add_argument("--concurrency", type=int, default=4, help="Concurrent workers per provider (default 4)")
    parser.add_argument("--requests", type=int, default=8, help="Requests per worker (default 8)")
    args = parser.parse_args()

    asyncio.run(run_simulation(concurrency=args.concurrency, requests_per_worker=args.requests))


if __name__ == "__main__":
    main()
