import math
import shutil
import tempfile
import pytest
import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    from projects.distributed_llm_training_infra.models import TrainingConfig, CheckpointMetadata
    from projects.distributed_llm_training_infra.engine import (
        ColumnParallelLinear,
        RowParallelLinear,
        TPBlock,
        ShardedOptimizer,
        DistributedEngine,
    )
except (ImportError, ValueError):
    from models import TrainingConfig, CheckpointMetadata
    from engine import (
        ColumnParallelLinear,
        RowParallelLinear,
        TPBlock,
        ShardedOptimizer,
        DistributedEngine,
    )


def test_column_row_parallel_math_equivalence():
    """Verify TP column + row decomposition equals standard single-device feedforward."""
    torch.manual_seed(42)
    in_dim, hidden_dim, out_dim = 16, 32, 16
    tp_size = 2
    batch_size, seq_len = 2, 4
    x = torch.randn(batch_size, seq_len, in_dim)

    # TP layers
    col_ranks = [ColumnParallelLinear(in_dim, hidden_dim, tp_size, r, bias=False) for r in range(tp_size)]
    row_ranks = [RowParallelLinear(hidden_dim, out_dim, tp_size, r, bias=False) for r in range(tp_size)]

    # Concatenate weights to form equivalent unpartitioned weights
    # col: weights are partitioned along out_features (dim 0)
    w_col_full = torch.cat([col_ranks[r].weight.data for r in range(tp_size)], dim=0)
    # row: weights are partitioned along in_features (dim 1)
    w_row_full = torch.cat([row_ranks[r].weight.data for r in range(tp_size)], dim=1)

    # Standard forward
    h_full = F.linear(x, w_col_full)
    out_expected = F.linear(h_full, w_row_full)

    # Distributed TP forward
    tp_outputs = []
    for r in range(tp_size):
        h_r = col_ranks[r](x)
        out_r = row_ranks[r](h_r)
        tp_outputs.append(out_r)
    out_tp = torch.stack(tp_outputs, dim=0).sum(dim=0)

    assert out_tp.shape == (batch_size, seq_len, out_dim)
    assert torch.allclose(out_tp, out_expected, atol=1e-5)


def test_tp_dimension_validation():
    """Ensure invalid TP dimensions raise ValueError."""
    with pytest.raises(ValueError, match="divisible by tp_size"):
        ColumnParallelLinear(in_features=16, out_features=15, tp_size=2, tp_rank=0)

    with pytest.raises(ValueError, match="divisible by tp_size"):
        RowParallelLinear(in_features=15, out_features=16, tp_size=2, tp_rank=0)


def test_sharded_optimizer_memory_reduction():
    """Verify ZeRO-1 optimizer states partition memory proportionally across shards."""
    p1 = nn.Parameter(torch.randn(100, 100))
    p2 = nn.Parameter(torch.randn(50, 50))
    total_elements = p1.numel() + p2.numel()  # 10000 + 2500 = 12500 float32s

    shards = 4
    opt = ShardedOptimizer([p1, p2], lr=1e-3, zero_shards=shards)

    shard_memories = [opt.get_shard_memory_bytes(s) for s in range(shards)]
    # Each parameter slice has exp_avg and exp_avg_sq in float32 (4 bytes each -> 8 bytes per element)
    total_opt_mem = sum(shard_memories)
    expected_bytes = total_elements * 8

    assert total_opt_mem == expected_bytes
    # Each shard should hold approximately 1/shards of the memory
    for mem in shard_memories:
        fraction = mem / total_opt_mem
        assert 0.20 <= fraction <= 0.30

    # Ensure step updates parameters and clears gradients
    p1.grad = torch.ones_like(p1)
    p2.grad = torch.ones_like(p2)
    p1_orig = p1.clone()
    opt.step()
    assert opt.step_count == 1
    assert not torch.equal(p1, p1_orig)
    opt.zero_grad()
    assert torch.all(p1.grad == 0)


def test_config_validation():
    """Ensure invalid batch and gradient accumulation configurations raise errors."""
    with pytest.raises(ValueError, match="must be divisible"):
        DistributedEngine(TrainingConfig(batch_size=7, micro_batch_size=2, gradient_accumulation_steps=3))

    with pytest.raises(ValueError, match="does not match"):
        DistributedEngine(TrainingConfig(batch_size=8, micro_batch_size=2, gradient_accumulation_steps=2))


def test_distributed_training_loss_reduction():
    """Verify pipeline and tensor parallel training loop runs and reduces loss on synthetic batch."""
    torch.manual_seed(123)
    config = TrainingConfig(
        vocab_size=64,
        model_dim=32,
        hidden_dim=64,
        num_layers=2,
        batch_size=4,
        micro_batch_size=2,
        gradient_accumulation_steps=2,
        tp_size=2,
        pp_size=2,
        zero_shards=2,
        learning_rate=0.01,
        device="cpu",
    )
    engine = DistributedEngine(config)

    # Fixed repeated batch to test learning convergence
    tokens = torch.randint(0, config.vocab_size, (config.batch_size, 8))
    targets = torch.randint(0, config.vocab_size, (config.batch_size, 8))

    losses = []
    for step in range(1, 6):
        metrics = engine.train_step(step, tokens, targets)
        losses.append(metrics.loss)
        assert metrics.grad_norm > 0.0
        assert metrics.step == step

    assert losses[-1] < losses[0]


def test_crash_checkpoint_recovery():
    """Verify model and sharded optimizer states restore exactly after simulated crash."""
    temp_dir = tempfile.mkdtemp()
    try:
        config = TrainingConfig(
            vocab_size=32,
            model_dim=16,
            hidden_dim=32,
            num_layers=2,
            batch_size=4,
            micro_batch_size=2,
            gradient_accumulation_steps=2,
            tp_size=2,
            pp_size=2,
            zero_shards=2,
            learning_rate=0.005,
            device="cpu",
        )
        engine_a = DistributedEngine(config)
        tokens = torch.randint(0, config.vocab_size, (config.batch_size, 6))
        targets = torch.randint(0, config.vocab_size, (config.batch_size, 6))

        # Train 2 steps and save checkpoint
        engine_a.train_step(1, tokens, targets)
        m2 = engine_a.train_step(2, tokens, targets)
        meta = engine_a.save_checkpoint(temp_dir, step=2, loss=m2.loss)

        assert meta.step == 2
        assert len(meta.saved_files) == 4  # 2 stages + 2 optimizers

        # Continue step 3 on engine A to record baseline output
        m3_expected = engine_a.train_step(3, tokens, targets)

        # Simulate crash: initialize completely fresh engine B
        engine_b = DistributedEngine(config)
        restored_meta = engine_b.load_checkpoint(temp_dir)
        assert restored_meta.step == 2

        # Step 3 on recovered engine B must match engine A exactly
        m3_recovered = engine_b.train_step(3, tokens, targets)
        assert math.isclose(m3_recovered.loss, m3_expected.loss, rel_tol=1e-4)

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_missing_checkpoint_raises():
    """Verify attempting to load from nonexistent checkpoint directory raises FileNotFoundError."""
    config = TrainingConfig(vocab_size=16, model_dim=16, hidden_dim=16, num_layers=2, device="cpu")
    engine = DistributedEngine(config)
    with pytest.raises(FileNotFoundError):
        engine.load_checkpoint("./nonexistent_directory_for_test")


def test_invalid_shard_memory_index():
    """Verify get_shard_memory_bytes bounds checking."""
    p = nn.Parameter(torch.randn(10))
    opt = ShardedOptimizer([p], zero_shards=2)
    with pytest.raises(IndexError):
        opt.get_shard_memory_bytes(5)
    with pytest.raises(IndexError):
        opt.get_shard_memory_bytes(-1)


def test_multi_stage_pipeline_forward_backward():
    """Verify 3-stage pipeline parallelism forward, backward, and gradient flow."""
    torch.manual_seed(999)
    config = TrainingConfig(
        vocab_size=32,
        model_dim=16,
        hidden_dim=32,
        num_layers=3,
        batch_size=4,
        micro_batch_size=2,
        gradient_accumulation_steps=2,
        tp_size=2,
        pp_size=3,
        zero_shards=2,
        device="cpu",
    )
    engine = DistributedEngine(config)
    tokens = torch.randint(0, config.vocab_size, (config.batch_size, 4))
    targets = torch.randint(0, config.vocab_size, (config.batch_size, 4))

    metrics = engine.train_step(1, tokens, targets)
    assert metrics.loss > 0.0
    assert metrics.grad_norm > 0.0
    assert len(engine.stages) == 3

