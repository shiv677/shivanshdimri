import math
import random
import sys
import time
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple

try:
    from .models import CacheMetrics, EvictionPolicy, QueryMatch, VectorRecord
except ImportError:
    from models import CacheMetrics, EvictionPolicy, QueryMatch, VectorRecord


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = 0.0
    norm1 = 0.0
    norm2 = 0.0
    for a, b in zip(v1, v2):
        dot += a * b
        norm1 += a * a
        norm2 += b * b
    if norm1 <= 0.0 or norm2 <= 0.0:
        return 0.0
    return dot / (math.sqrt(norm1) * math.sqrt(norm2))


def estimate_record_size(record: VectorRecord) -> int:
    size = sys.getsizeof(record.id)
    size += sys.getsizeof(record.prompt)
    size += sys.getsizeof(record.response)
    size += len(record.vector) * 8
    size += sys.getsizeof(record.metadata)
    size += 256  # Overhead for dict entries and object headers
    return size


class SemanticVectorCache:
    def __init__(
        self,
        dim: int = 64,
        num_tables: int = 4,
        num_bits: int = 8,
        similarity_threshold: float = 0.88,
        max_memory_bytes: int = 10 * 1024 * 1024,
        eviction_policy: EvictionPolicy | str = EvictionPolicy.LRU,
        cost_per_token: float = 0.00002,
        seed: int = 42,
    ):
        self.dim = dim
        self.num_tables = num_tables
        self.num_bits = num_bits
        self.similarity_threshold = similarity_threshold
        self.max_memory_bytes = max_memory_bytes
        self.eviction_policy = EvictionPolicy(eviction_policy)
        self.cost_per_token = cost_per_token

        # Storage
        self.records: Dict[str, VectorRecord] = {}
        self.record_sizes: Dict[str, int] = {}
        self.prompt_to_id: Dict[str, str] = {}
        self.tables: List[Dict[int, Set[str]]] = [defaultdict(set) for _ in range(num_tables)]

        # Hyperplanes for LSH
        self.hyperplanes: List[List[List[float]]] = []
        rng = random.Random(seed)
        for _ in range(num_tables):
            table_planes: List[List[float]] = []
            for _ in range(num_bits):
                plane = [rng.gauss(0.0, 1.0) for _ in range(dim)]
                table_planes.append(plane)
            self.hyperplanes.append(table_planes)

        # Telemetry
        self.total_queries = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.saved_tokens = 0
        self.estimated_cost_saved = 0.0
        self.eviction_count = 0
        self.current_memory_bytes = 0

    def _hash_vector(self, table_idx: int, vector: List[float]) -> int:
        planes = self.hyperplanes[table_idx]
        hash_val = 0
        for plane in planes:
            dot = sum(v * p for v, p in zip(vector, plane))
            bit = 1 if dot >= 0.0 else 0
            hash_val = (hash_val << 1) | bit
        return hash_val

    def _evict_victim(self) -> None:
        if not self.records:
            return

        if self.eviction_policy == EvictionPolicy.LRU:
            victim_id = min(self.records, key=lambda rid: self.records[rid].last_accessed)
        elif self.eviction_policy == EvictionPolicy.FIFO:
            victim_id = min(self.records, key=lambda rid: self.records[rid].created_at)
        else:  # LFU
            victim_id = min(self.records, key=lambda rid: self.records[rid].access_count)

        self._remove_record(victim_id)
        self.eviction_count += 1

    def _remove_record(self, record_id: str) -> None:
        record = self.records.pop(record_id, None)
        if not record:
            return

        size = self.record_sizes.pop(record_id, 0)
        self.current_memory_bytes -= size

        if record.prompt in self.prompt_to_id and self.prompt_to_id[record.prompt] == record_id:
            del self.prompt_to_id[record.prompt]

        for table_idx in range(self.num_tables):
            key = self._hash_vector(table_idx, record.vector)
            bucket = self.tables[table_idx].get(key)
            if bucket and record_id in bucket:
                bucket.remove(record_id)
                if not bucket:
                    del self.tables[table_idx][key]

    def put(self, record: VectorRecord) -> None:
        if len(record.vector) != self.dim:
            raise ValueError(f"Vector dimension {len(record.vector)} does not match cache dimension {self.dim}")

        rec_size = estimate_record_size(record)

        if record.id in self.records:
            self._remove_record(record.id)

        while (self.current_memory_bytes + rec_size > self.max_memory_bytes) and self.records:
            self._evict_victim()

        record.last_accessed = time.perf_counter()
        self.records[record.id] = record
        self.record_sizes[record.id] = rec_size
        self.current_memory_bytes += rec_size

        if record.prompt:
            self.prompt_to_id[record.prompt] = record.id

        for table_idx in range(self.num_tables):
            key = self._hash_vector(table_idx, record.vector)
            self.tables[table_idx][key].add(record.id)

    def query(self, vector: List[float], prompt: str = "") -> QueryMatch:
        start_time = time.perf_counter()
        self.total_queries += 1

        if len(vector) != self.dim:
            raise ValueError(f"Query vector dimension {len(vector)} does not match cache dimension {self.dim}")

        # Check exact prompt match first
        if prompt and prompt in self.prompt_to_id:
            rec_id = self.prompt_to_id[prompt]
            record = self.records.get(rec_id)
            if record:
                sim = cosine_similarity(vector, record.vector)
                record.last_accessed = time.perf_counter()
                record.access_count += 1

                self.cache_hits += 1
                self.saved_tokens += record.token_count
                saved_cost = record.cost if record.cost > 0.0 else record.token_count * self.cost_per_token
                self.estimated_cost_saved += saved_cost

                latency_ms = (time.perf_counter() - start_time) * 1000.0
                return QueryMatch(
                    record=record,
                    similarity=sim,
                    cache_hit=True,
                    lookup_latency_ms=latency_ms,
                    match_type="EXACT",
                )

        # LSH Candidate Retrieval
        candidates: Set[str] = set()
        for table_idx in range(self.num_tables):
            key = self._hash_vector(table_idx, vector)
            candidates.update(self.tables[table_idx].get(key, ()))

        # Fallback to linear scan if candidate pool is empty and cache is small
        if not candidates and len(self.records) <= 200:
            candidates = set(self.records.keys())

        best_sim = -1.0
        best_record: Optional[VectorRecord] = None

        for cand_id in candidates:
            rec = self.records.get(cand_id)
            if rec is None:
                continue
            sim = cosine_similarity(vector, rec.vector)
            if sim > best_sim:
                best_sim = sim
                best_record = rec

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        if best_record and best_sim >= self.similarity_threshold:
            best_record.last_accessed = time.perf_counter()
            best_record.access_count += 1

            self.cache_hits += 1
            self.saved_tokens += best_record.token_count
            saved_cost = best_record.cost if best_record.cost > 0.0 else best_record.token_count * self.cost_per_token
            self.estimated_cost_saved += saved_cost

            match_type = "EXACT" if best_sim >= 0.9999 else "SEMANTIC"
            return QueryMatch(
                record=best_record,
                similarity=best_sim,
                cache_hit=True,
                lookup_latency_ms=latency_ms,
                match_type=match_type,
            )

        self.cache_misses += 1
        return QueryMatch(
            record=None,
            similarity=max(0.0, best_sim),
            cache_hit=False,
            lookup_latency_ms=latency_ms,
            match_type="MISS",
        )

    def get_metrics(self) -> CacheMetrics:
        hit_rate = (self.cache_hits / self.total_queries) if self.total_queries > 0 else 0.0
        return CacheMetrics(
            total_queries=self.total_queries,
            cache_hits=self.cache_hits,
            cache_misses=self.cache_misses,
            hit_rate=round(hit_rate, 4),
            saved_tokens=self.saved_tokens,
            estimated_cost_saved=round(self.estimated_cost_saved, 6),
            eviction_count=self.eviction_count,
            current_memory_bytes=self.current_memory_bytes,
            max_memory_bytes=self.max_memory_bytes,
        )

    def size(self) -> int:
        return len(self.records)

    def clear(self) -> None:
        self.records.clear()
        self.record_sizes.clear()
        self.prompt_to_id.clear()
        for table in self.tables:
            table.clear()
        self.current_memory_bytes = 0
