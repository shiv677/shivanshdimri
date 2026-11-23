# Multi-Tenant Distributed Token Bucket Rate Limiter

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.13-green.svg)](https://docs.pydantic.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](test_limiter.py)

A concurrency-safe, high-throughput asynchronous token bucket and sliding window rate limiter tailored for multi-tenant LLM inference providers. Features priority scheduling, tier quotas (TPM / RPM), and randomized jitter backoff.

---

## Architecture Overview

```
                        ┌───────────────────────────────┐
                        │   Inference Request Stream    │
                        │ [Provider, Tokens, Priority]  │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │   Async Rate Limiter (Lock)   │
                        │  Millisecond State Machine    │
                        └───────────────┬───────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
  ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
  │ Token Bucket (TPM)│       │Sliding Window(RPM)│       │Priority Scheduler │
  │ Refill Rate + Cap │       │ 60s Request Queue │       │  P0 Eval vs Batch │
  └─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │      Reservation Status       │
                        │ GRANTED or Jittered Backoff   │
                        └───────────────────────────────┘
```

---

## Features

- **Pydantic v2 Schemas**: Strict schemas for `RateLimitConfig`, `ProviderTier`, `TokenReservation`, and `ReservationStatus`.
- **Hybrid Token Bucket & Sliding Window**: Simultaneously enforces token-per-minute (TPM) refill dynamics with burst headroom and requests-per-minute (RPM) window limits.
- **Priority-Aware Scheduling**: Prioritizes latency-sensitive P0 interactive/evaluation requests while dynamically throttling background P2 batch tasks when token headroom drops below 20%.
- **Anti-Thundering Herd Jitter**: Automatically computes replenish latency and applies randomized uniform jitter to prevent synchronized retry spikes.
- **Multi-Tenant Provider Quotas**: Configures distinct limits and burst multipliers across OpenAI, Anthropic, and local vLLM instances.

---

## CLI Simulation

```bash
python projects/distributed_token_bucket_limiter/main.py --concurrency 4 --requests 8
```

## Running Tests

```bash
pytest projects/distributed_token_bucket_limiter
```
