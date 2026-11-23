from typing import List, Optional
from pydantic import BaseModel, Field


class TransformerConfig(BaseModel):
    vocab_size: int = Field(default=100, ge=10)
    d_model: int = Field(default=64, ge=8)
    num_layers: int = Field(default=2, ge=1)
    num_heads: int = Field(default=4, ge=1)
    d_mlp: int = Field(default=128, ge=8)
    max_seq_len: int = Field(default=32, ge=4)


class ActivationSummary(BaseModel):
    component: str
    layer: int
    shape: List[int]
    mean: float
    std: float
    l2_norm: float


class AttentionAttribution(BaseModel):
    layer: int
    head: int
    source_idx: int
    target_idx: int
    source_token: Optional[str] = None
    target_token: Optional[str] = None
    attention_weight: float
    attribution_score: float


class SAEConfig(BaseModel):
    d_model: int = Field(default=64, ge=8)
    d_sae: int = Field(default=256, ge=16)
    l1_coeff: float = Field(default=1e-3, ge=0.0)
    lr: float = Field(default=1e-3, gt=0.0)


class SAEDecompositionResult(BaseModel):
    l0_sparsity: float
    reconstruction_mse: float
    explained_variance: float
    top_feature_indices: List[int]
    top_feature_activations: List[float]


class PatchingTarget(BaseModel):
    layer: int
    component: str
    position: Optional[int] = None


class PatchingResult(BaseModel):
    layer: int
    component: str
    position: Optional[int] = None
    clean_metric: float
    corrupted_metric: float
    patched_metric: float
    recovery_rate: float


class SuiteReport(BaseModel):
    transformer_config: TransformerConfig
    cached_layers: int
    top_attention_attributions: List[AttentionAttribution]
    sae_summary: SAEDecompositionResult
    causal_patch_results: List[PatchingResult]
    latency_ms: float
