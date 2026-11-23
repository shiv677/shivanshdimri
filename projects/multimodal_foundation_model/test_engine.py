import sys
from pathlib import Path
import pytest
import torch

sys.path.insert(0, str(Path(__file__).parent))

try:
    from .models import ModelConfig, VisualReasoningSample, EvaluationResult, InferenceOutput
    from .engine import (
        SimpleTokenizer,
        PatchEmbedding,
        VisionEncoder,
        CrossModalProjector,
        CausalDecoder,
        MultimodalFoundationModel,
        create_synthetic_data,
        train_step,
    )
except ImportError:
    from models import ModelConfig, VisualReasoningSample, EvaluationResult, InferenceOutput
    from engine import (
        SimpleTokenizer,
        PatchEmbedding,
        VisionEncoder,
        CrossModalProjector,
        CausalDecoder,
        MultimodalFoundationModel,
        create_synthetic_data,
        train_step,
    )


@pytest.fixture
def test_config():
    return ModelConfig(
        vocab_size=128,
        image_size=16,
        patch_size=4,
        vision_dim=32,
        vision_layers=2,
        vision_heads=2,
        text_dim=32,
        text_layers=2,
        text_heads=2,
        mlp_dim=64,
        max_seq_len=256,
        dropout=0.0,
    )


@pytest.fixture
def tokenizer():
    return SimpleTokenizer(vocab_size=128)


def test_tokenizer_encode_decode(tokenizer):
    text = "Hello multimodal world!"
    encoded = tokenizer.encode(text, add_bos=True, add_eos=True)
    assert encoded[0] == tokenizer.bos_id
    assert encoded[-1] == tokenizer.eos_id

    decoded = tokenizer.decode(encoded, skip_special=True)
    assert decoded == text

    # Unknown characters fallback to unk_id
    weird = tokenizer.encode("\u2603", add_bos=False, add_eos=False)
    assert weird == [tokenizer.unk_id]


def test_patch_embedding_shape():
    batch_size = 2
    patch_embed = PatchEmbedding(image_size=16, patch_size=4, in_channels=3, embed_dim=32)
    x = torch.randn(batch_size, 3, 16, 16)
    out = patch_embed(x)

    num_patches = (16 // 4) ** 2  # 16 patches
    assert out.shape == (batch_size, num_patches, 32)


def test_cross_modal_projector():
    projector = CrossModalProjector(vision_dim=32, text_dim=48, mlp_dim=64)
    v_tokens = torch.randn(2, 16, 32)
    proj_tokens = projector(v_tokens)

    assert proj_tokens.shape == (2, 16, 48)
    assert not torch.isnan(proj_tokens).any()


def test_multimodal_forward_and_loss(test_config, tokenizer):
    model = MultimodalFoundationModel(test_config)
    images = torch.randn(2, 3, 16, 16)
    input_ids = torch.tensor([[1, 10, 11, 12], [1, 20, 21, 22]], dtype=torch.long)
    targets = torch.tensor([[10, 11, 12, 2], [20, 21, 22, 2]], dtype=torch.long)

    # Forward without targets
    logits, loss = model(images, input_ids)
    assert logits.shape == (2, 4, test_config.vocab_size)
    assert loss is None

    # Forward with targets
    logits, loss = model(images, input_ids, targets=targets)
    assert loss is not None
    assert loss.item() > 0.0

    # Gradient flow test
    loss.backward()
    assert model.vision_encoder.patch_embed.proj.weight.grad is not None
    assert model.projector.net[0].weight.grad is not None
    assert model.decoder.lm_head.weight.grad is not None


def test_prefix_causal_mask(test_config):
    model = MultimodalFoundationModel(test_config)
    device = torch.device("cpu")
    mask = model._build_prefix_causal_mask(num_vision=4, num_text=4, device=device)

    assert mask.shape == (8, 8)
    # Visual-to-visual block should be unmasked (0.0)
    assert (mask[:4, :4] == 0.0).all()
    # Text token attending to future text token should be -inf
    assert mask[4, 5] == float("-inf")
    # Text token attending to visual token should be 0.0
    assert mask[5, 2] == 0.0


def test_model_generation(test_config, tokenizer):
    model = MultimodalFoundationModel(test_config)
    image = torch.randn(1, 3, 16, 16)
    prompt_ids = tokenizer.encode("What is this?", add_bos=True, add_eos=False)

    out = model.generate(image, prompt_ids, tokenizer, max_new_tokens=8)
    assert isinstance(out, InferenceOutput)
    assert len(out.generated_token_ids) <= 8
    assert isinstance(out.generated_text, str)
    assert out.latency_ms > 0.0


def test_visual_reasoning_evaluation(test_config, tokenizer):
    model = MultimodalFoundationModel(test_config)
    images, samples = create_synthetic_data(num_samples=4, image_size=16)

    result = model.evaluate_reasoning(samples, images, tokenizer)
    assert isinstance(result, EvaluationResult)
    assert result.total_samples == 4
    assert 0 <= result.correct_count <= 4
    assert 0.0 <= result.accuracy <= 1.0
    assert len(result.predictions) == 4
    assert result.avg_latency_ms > 0.0


def test_train_step_reduces_or_updates_weights(test_config):
    model = MultimodalFoundationModel(test_config)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

    images = torch.randn(2, 3, 16, 16)
    input_ids = torch.tensor([[1, 5, 6], [1, 7, 8]], dtype=torch.long)
    targets = torch.tensor([[5, 6, 2], [7, 8, 2]], dtype=torch.long)

    param_before = model.projector.net[0].weight.clone()
    loss_val = train_step(model, optimizer, images, input_ids, targets)

    assert loss_val > 0.0
    param_after = model.projector.net[0].weight
    assert not torch.equal(param_before, param_after)


def test_edge_cases(test_config, tokenizer):
    model = MultimodalFoundationModel(test_config)
    # Batch size 1
    image_single = torch.randn(1, 3, 16, 16)
    ids_single = torch.tensor([[1, 4]], dtype=torch.long)
    logits, _ = model(image_single, ids_single)
    assert logits.shape == (1, 2, test_config.vocab_size)

    # Empty options evaluation (generative fallback)
    sample_open = VisualReasoningSample(
        id="open_01",
        question="Describe",
        options=[],
        ground_truth="red",
    )
    res = model.evaluate_reasoning([sample_open], image_single, tokenizer)
    assert res.total_samples == 1
    assert len(res.predictions) == 1

    # Exceeding max_seq_len raises ValueError
    too_long_ids = torch.ones((1, test_config.max_seq_len + 1), dtype=torch.long)
    with pytest.raises(ValueError, match="exceeds max_seq_len"):
        model(image_single, too_long_ids)


def test_config_validation():
    # Valid config
    cfg = ModelConfig(vocab_size=256, image_size=32, patch_size=8)
    assert cfg.vocab_size == 256

    # Invalid config (patch size too small or dropout > 1.0)
    with pytest.raises(Exception):
        ModelConfig(dropout=1.5)

