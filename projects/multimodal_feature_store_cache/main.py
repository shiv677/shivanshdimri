import argparse
import json
import sys
from pathlib import Path
from typing import Optional

try:
    from .cache import SemanticVectorCache
    from .models import CacheMetrics, VectorRecord
except ImportError:
    from cache import SemanticVectorCache
    from models import CacheMetrics, VectorRecord


def run_benchmark(
    data_path: Path,
    similarity_threshold: float = 0.88,
    max_memory_bytes: int = 10 * 1024 * 1024,
    num_tables: int = 4,
    num_bits: int = 6,
) -> CacheMetrics:
    if not data_path.exists():
        print(f"Error: Dataset file not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_records = data.get("records", [])
    raw_queries = data.get("benchmark_queries", [])

    if not raw_records:
        print("Error: No records found in dataset", file=sys.stderr)
        sys.exit(1)

    dim = len(raw_records[0]["vector"])

    cache = SemanticVectorCache(
        dim=dim,
        num_tables=num_tables,
        num_bits=num_bits,
        similarity_threshold=similarity_threshold,
        max_memory_bytes=max_memory_bytes,
        seed=42,
    )

    print("=" * 80)
    print("Multimodal Feature Store & Semantic Vector Cache Benchmark")
    print("=" * 80)
    print(f"Dataset:            {data_path.name}")
    print(f"Vector Dimension:   {dim}")
    print(f"Similarity Cutoff:  {similarity_threshold}")
    print(f"Max Memory (bytes): {max_memory_bytes}")
    print(f"LSH Config:         {num_tables} tables, {num_bits} bits/table")
    print("-" * 80)

    # Ingest records
    for item in raw_records:
        rec = VectorRecord(**item)
        cache.put(rec)
    print(f"Successfully loaded and indexed {cache.size()} vector records.")
    print("-" * 80)
    print(f"{'Query Name':<30} | {'Hit':<5} | {'Type':<8} | {'Sim':<6} | {'Tokens':<6} | {'Latency':<8}")
    print("-" * 80)

    for q in raw_queries:
        name = q.get("name", "query")
        prompt = q.get("prompt", "")
        vector = q["vector"]

        match = cache.query(vector=vector, prompt=prompt)
        hit_str = "YES" if match.cache_hit else "NO"
        tokens = match.record.token_count if match.record else 0

        print(
            f"{name:<30} | {hit_str:<5} | {match.match_type:<8} | "
            f"{match.similarity:<6.4f} | {tokens:<6} | {match.lookup_latency_ms:<8.3f}ms"
        )

    metrics = cache.get_metrics()
    print("=" * 80)
    print("Benchmark Telemetry Summary")
    print("=" * 80)
    print(f"Total Queries Executed: {metrics.total_queries}")
    print(f"Cache Hits:             {metrics.cache_hits}")
    print(f"Cache Misses:           {metrics.cache_misses}")
    print(f"Cache Hit Rate:         {metrics.hit_rate * 100:.1f}%")
    print(f"Tokens Saved:           {metrics.saved_tokens}")
    print(f"Estimated Cost Saved:   ${metrics.estimated_cost_saved:.4f}")
    print(f"Cache Memory Footprint: {metrics.current_memory_bytes} bytes")
    print(f"Evictions Triggered:    {metrics.eviction_count}")
    print("=" * 80)

    return metrics


def main() -> None:
    default_dataset = Path(__file__).parent / "sample_embeddings.json"
    parser = argparse.ArgumentParser(description="Multimodal Feature Store semantic cache benchmark runner.")
    parser.add_argument("--data", type=Path, default=default_dataset, help="Path to sample embeddings JSON.")
    parser.add_argument("--threshold", type=float, default=0.88, help="Cosine similarity cutoff threshold.")
    parser.add_argument("--max-memory-kb", type=int, default=10240, help="Cache memory clamp in Kilobytes.")
    parser.add_argument("--tables", type=int, default=4, help="Number of LSH hash tables.")
    parser.add_argument("--bits", type=int, default=6, help="Number of hash bits per LSH table.")
    args = parser.parse_args()

    run_benchmark(
        data_path=args.data,
        similarity_threshold=args.threshold,
        max_memory_bytes=args.max_memory_kb * 1024,
        num_tables=args.tables,
        num_bits=args.bits,
    )


if __name__ == "__main__":
    main()
