import sys
from pathlib import Path
import pytest
import torch
from pydantic import ValidationError

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from projects.mechanistic_interpretability_suite.engine import (
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
    from projects.mechanistic_interpretability_suite.models import (
        ActivationSummary,
        AttentionAttribution,
        PatchingResult,
        SAEConfig,
        SAEDecompositionResult,
        SuiteReport,
        TransformerConfig,
    )
except ImportError:
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
        SAEConfig,
        SAEDecompositionResult,
        SuiteReport,
        TransformerConfig,
    )


@pytest.fixture
def sample_config() -> TransformerConfig:
    return TransformerConfig(
        vocab_size=40,
        d_model=32,
        num_layers=2,
        num_heads=4,
        d_mlp=64,
        max_seq_len=16,
    )


@pytest.fixture
def sample_model(sample_config) -> SimpleTransformer:
    torch.manual_seed(123)
    model = SimpleTransformer(sample_config)
    model.eval()
    return model


def test_forward_pass_and_residual_stream_caching(sample_model, sample_config):
    input_ids = torch.tensor([[3, 7, 12, 19, 25]], dtype=torch.long)
    logits, cache = run_with_cache(sample_model, input_ids)

    # 1. Output shapes
    assert logits.shape == (1, 5, sample_config.vocab_size)
    assert len(cache) > 0

    # 2. Residual stream cache keys
    for l in range(sample_config.num_layers):
        assert f"resid_pre_{l}" in cache
        assert f"attn_pattern_{l}" in cache
        assert f"attn_out_{l}" in cache
        assert f"mlp_out_{l}" in cache
        assert f"resid_post_{l}" in cache

        assert cache[f"resid_pre_{l}"].shape == (1, 5, sample_config.d_model)
        assert cache[f"attn_pattern_{l}"].shape == (
            1,
            sample_config.num_heads,
            5,
            5,
        )

    # 3. Causal masking check (upper triangle of attention weights must be 0)
    for l in range(sample_config.num_layers):
        attn_pat = cache[f"attn_pattern_{l}"][0, 0]
        for i in range(5):
            for j in range(i + 1, 5):
                assert attn_pat[i, j].item() < 1e-6


def test_cache_summarization(sample_model):
    input_ids = torch.tensor([[1, 2, 3, 4]], dtype=torch.long)
    _, cache = run_with_cache(sample_model, input_ids)
    summaries = summarize_cache(cache)

    assert len(summaries) == len(cache)
    for item in summaries:
        assert isinstance(item, ActivationSummary)
        assert item.l2_norm >= 0.0
        assert item.std >= 0.0
        assert len(item.shape) >= 2


def test_attention_head_pattern_attribution(sample_model, sample_config):
    input_ids = torch.tensor([[4, 8, 15, 16]], dtype=torch.long)
    target_tok = 22
    attributions = compute_attention_attribution(
        sample_model, input_ids, target_token_id=target_tok
    )

    expected_count = sample_config.num_layers * sample_config.num_heads * 4
    assert len(attributions) == expected_count

    top = attributions[0]
    assert isinstance(top, AttentionAttribution)
    assert 0.0 <= top.attention_weight <= 1.0 + 1e-5
    assert abs(top.attribution_score) >= abs(attributions[-1].attribution_score)

    # Attribution without target_token_id (norm-based)
    attributions_norm = compute_attention_attribution(sample_model, input_ids)
    assert len(attributions_norm) == expected_count
    assert attributions_norm[0].attribution_score >= 0.0


def test_sparse_autoencoder_training_and_decomposition():
    torch.manual_seed(42)
    d_model = 32
    d_sae = 64
    sae = SparseAutoencoder(d_model=d_model, d_sae=d_sae)

    # Generate synthetic residual activations
    activations = torch.randn(8, 6, d_model)
    initial_mse = torch.nn.functional.mse_loss(sae(activations)[0], activations).item()

    losses = train_sae(sae, activations, steps=30, lr=5e-3, l1_coeff=1e-3)
    assert len(losses) == 30
    assert losses[-1] < losses[0]

    decomp = decompose_features(sae, activations, top_k=4)
    assert isinstance(decomp, SAEDecompositionResult)
    assert decomp.reconstruction_mse < initial_mse
    assert 0.0 <= decomp.explained_variance <= 1.0
    assert len(decomp.top_feature_indices) == 4
    assert len(decomp.top_feature_activations) == 4
    assert decomp.l0_sparsity >= 0.0

    # Decoder unit norm constraint check
    col_norms = torch.linalg.norm(sae.decoder.weight, dim=0)
    assert torch.allclose(col_norms, torch.ones_like(col_norms), atol=1e-4)


def test_causal_activation_patching(sample_model):
    clean_tokens = torch.tensor([[10, 15, 20]], dtype=torch.long)
    corrupted_tokens = torch.tensor([[10, 15, 30]], dtype=torch.long)

    target_tok = 5
    distractor_tok = 6

    patch_results = run_activation_patching(
        sample_model,
        clean_tokens=clean_tokens,
        corrupted_tokens=corrupted_tokens,
        target_token_id=target_tok,
        distractor_token_id=distractor_tok,
        components=["resid_pre", "attn_out"],
        positions=[None, 2],
    )

    assert len(patch_results) > 0
    for res in patch_results:
        assert isinstance(res, PatchingResult)
        assert isinstance(res.recovery_rate, float)

    # Patching layer 0 resid_pre at corrupted pos 2 with clean pos 2 should restore token 20
    exact_patch = [
        r for r in patch_results if r.layer == 0 and r.component == "resid_pre" and r.position == 2
    ]
    assert len(exact_patch) == 1
    # Clean input and corrupted input differ only at index 2.
    # Restoring index 2 on resid_pre should yield recovery_rate close to 1.0
    assert abs(exact_patch[0].recovery_rate - 1.0) < 1e-2


def test_edge_cases_single_token_and_minimal_transformer():
    # 1. Single token input (seq_len = 1)
    minimal_cfg = TransformerConfig(
        vocab_size=20, d_model=16, num_layers=1, num_heads=1, d_mlp=32, max_seq_len=8
    )
    mini_model = SimpleTransformer(minimal_cfg)
    mini_model.eval()

    single_token = torch.tensor([[7]], dtype=torch.long)
    logits, cache = run_with_cache(mini_model, single_token)
    assert logits.shape == (1, 1, 20)
    assert cache["resid_pre_0"].shape == (1, 1, 16)
    assert cache["attn_pattern_0"].shape == (1, 1, 1, 1)

    attrs = compute_attention_attribution(mini_model, single_token)
    assert len(attrs) == 1
    assert attrs[0].attention_weight == 1.0


def test_pydantic_schema_validations():
    # Valid config
    cfg = TransformerConfig(vocab_size=50, d_model=32, num_layers=1, num_heads=2)
    assert cfg.vocab_size == 50

    # Invalid config (negative dimensions or below constraints)
    with pytest.raises(ValidationError):
        TransformerConfig(vocab_size=5)  # ge=10

    with pytest.raises(ValidationError):
        SAEConfig(d_model=4)  # ge=8


def test_suite_end_to_end_report():
    report = run_mechanistic_suite()
    assert isinstance(report, SuiteReport)
    assert report.cached_layers == 2
    assert len(report.top_attention_attributions) == 5
    assert report.sae_summary.reconstruction_mse >= 0.0
    assert len(report.causal_patch_results) == 5
    assert report.latency_ms > 0.0
