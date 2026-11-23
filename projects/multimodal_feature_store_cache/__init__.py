"""Multimodal Feature Store & Semantic Vector Cache.

Provides high-performance semantic caching for multimodal LLM/VLM calls
using multi-table Random Projection LSH and cosine similarity matching.
"""

try:
    from .models import VectorRecord, QueryMatch, CacheMetrics, EvictionPolicy
    from .cache import SemanticVectorCache
except (ImportError, ValueError):
    from models import VectorRecord, QueryMatch, CacheMetrics, EvictionPolicy
    from cache import SemanticVectorCache

__all__ = [
    "VectorRecord",
    "QueryMatch",
    "CacheMetrics",
    "EvictionPolicy",
    "SemanticVectorCache",
]
