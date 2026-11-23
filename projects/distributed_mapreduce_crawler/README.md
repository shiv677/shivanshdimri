# Distributed MapReduce Async Crawler

[![CI Test Suite](https://github.com/shiv677/distributed-mapreduce-crawler/actions/workflows/tests.yml/badge.svg)](https://github.com/shiv677/distributed-mapreduce-crawler/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.13-green.svg)](https://docs.pydantic.dev/)

An asynchronous, high-concurrency web and research corpus crawler featuring per-domain rate limiting, SQLite task state-machine management, and deterministic HTML content extraction.

## Features
- **Async Concurrency & Domain Semaphores**: Protects web hosts with per-domain concurrency locks while maximizing aggregate throughput.
- **SQLite Task State Machine**: Fault-tolerant task queue with states (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`), automatic retries, and crash restartability.
- **Content Cleaning & Deduplication**: Strips scripts, styles, and boilerplate HTML, extracting clean body text, titles, outbound links, and SHA-256 content hashes.
- **Pydantic v2 Schemas**: Strict schemas for `CrawlTask`, `ExtractedDocument`, and `CrawlStats`.

## Quickstart
```bash
pip install pytest pydantic
python main.py --seeds https://docs.python.org https://arxiv.org --max-tasks 10
pytest -v
```
