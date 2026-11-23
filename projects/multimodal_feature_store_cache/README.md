# Multimodal Feature Store & Semantic Vector Cache

A semantic vector cache using multi-table Random Projection Locality-Sensitive Hashing (LSH) and cosine similarity to deduplicate high-cost Vision-Language Model (VLM) and Large Language Model (LLM) inference requests.

## Architecture

```
Incoming Query (Vector v, Prompt)
               │
               ▼
    [ Exact Prompt / Hash Check ] ──(Match)──► Instant Cache Hit (EXACT)
               │ (Miss)
               ▼
   [ Multi-Table Random Projection LSH ]
               │
      Table 0: Bucket(h0(v))
      Table 1: Bucket(h1(v)) ──► Candidate Set C = ⋃ Bucket_k
      Table 2: Bucket(h2(v))
               │
               ▼
   [ Cosine Similarity Filter ]
   Compute cos(v, u) for u in C
               │
     cos(v, u*) >= Threshold ?
         ├── Yes ──► Cache Hit (SEMANTIC) -> Serve Cached Response & Telemetry
         └── No  ──► Cache Miss -> Forward to Foundation Model & Store Record
```

## Features

- **Multi-Table Random Projection LSH**: Partitions continuous embedding spaces into binary hash codes using random hyperplanes, providing sublinear candidate pruning.
- **Dual Match Tiers**: Instant $O(1)$ exact prompt hit tier alongside continuous $\epsilon$-radius cosine neighborhood search ($\ge \text{threshold}$).
- **Byte-Level Memory Clamp & Eviction Policies**: Accurately tracks memory consumption in bytes and supports **LRU** (Least Recently Used), **FIFO** (First In First Out), and **LFU** (Least Frequently Used) eviction.
- **Telemetry & Cost Accounting**: Tracks hit rate, token savings, latency in milliseconds, and estimated dollar savings per query.

## Models & Schemas

Defined using **Pydantic v2**:
- `VectorRecord`: Encapsulates embedding vector, raw prompt, cached model response, token count, cost, and access metadata.
- `QueryMatch`: Query result with similarity score, hit indicator, lookup latency, and match classification (`EXACT`, `SEMANTIC`, `MISS`).
- `CacheMetrics`: Aggregated telemetry for hit rate, token savings, cost savings, byte consumption, and eviction count.
- `EvictionPolicy`: Supported eviction strategies (`LRU`, `FIFO`, `LFU`).

## CLI Usage

Run the benchmark runner with the included synthetic dataset:

```bash
python projects/multimodal_feature_store_cache/main.py --threshold 0.88 --tables 4 --bits 6
```

Options:
- `--data PATH`: Path to custom embeddings JSON dataset (default: `sample_embeddings.json`).
- `--threshold FLOAT`: Cosine similarity cutoff (default: `0.88`).
- `--max-memory-kb INT`: Cache memory clamp in KB (default: `10240`).
- `--tables INT`: Number of LSH hash tables (default: `4`).
- `--bits INT`: Number of projection bits per table (default: `6`).

## Running Tests

Run pytest to verify functionality:

```bash
python -m pytest projects/multimodal_feature_store_cache/test_cache.py -v
```
