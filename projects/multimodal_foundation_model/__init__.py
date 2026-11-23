"""Multimodal Foundation Model Package."""

try:
    from .models import ModelConfig, VisualReasoningSample, InferenceOutput, EvaluationResult, BenchmarkReport
    from .engine import MultimodalFoundationModel, SimpleTokenizer, create_synthetic_data
except (ImportError, ValueError):
    from models import ModelConfig, VisualReasoningSample, InferenceOutput, EvaluationResult, BenchmarkReport
    from engine import MultimodalFoundationModel, SimpleTokenizer, create_synthetic_data

__all__ = [
    "ModelConfig",
    "VisualReasoningSample",
    "InferenceOutput",
    "EvaluationResult",
    "BenchmarkReport",
    "MultimodalFoundationModel",
    "SimpleTokenizer",
    "create_synthetic_data",
]
