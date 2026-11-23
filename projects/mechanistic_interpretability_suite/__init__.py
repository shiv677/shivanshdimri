"""Mechanistic Interpretability Suite

Residual stream caching, attention attribution, SAE decomposition, and causal patching.
"""

try:
    from .engine import (
        MultiHeadAttention,
        SimpleTransformer,
        SparseAutoencoder,
        compute_attention_attribution,
        decompose_features,
        run_activation_patching,
        run_mechanistic_suite,
        run_with_cache,
        summarize_cache,
        train_sae,
    )
    from .models import (
        ActivationSummary,
        AttentionAttribution,
        PatchingResult,
        PatchingTarget,
        SAEConfig,
        SAEDecompositionResult,
        SuiteReport,
        TransformerConfig,
    )
except (ImportError, ValueError):
    from engine import (
        MultiHeadAttention,
        SimpleTransformer,
        SparseAutoencoder,
        compute_attention_attribution,
        decompose_features,
        run_activation_patching,
        run_mechanistic_suite,
        run_with_cache,
        summarize_cache,
        train_sae,
    )
    from models import (
        ActivationSummary,
        AttentionAttribution,
        PatchingResult,
        PatchingTarget,
        SAEConfig,
        SAEDecompositionResult,
        SuiteReport,
        TransformerConfig,
    )

__all__ = [
    "TransformerConfig",
    "ActivationSummary",
    "AttentionAttribution",
    "SAEConfig",
    "SAEDecompositionResult",
    "PatchingTarget",
    "PatchingResult",
    "SuiteReport",
    "SimpleTransformer",
    "MultiHeadAttention",
    "SparseAutoencoder",
    "run_with_cache",
    "summarize_cache",
    "compute_attention_attribution",
    "train_sae",
    "decompose_features",
    "run_activation_patching",
    "run_mechanistic_suite",
]
