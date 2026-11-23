import math
import sys
from pathlib import Path
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent))

try:
    from .engine import (
        InferenceEngine,
        PagedKVCache,
        dequantize_int8,
        measure_quant_error,
        quantize_int8,
        quantized_matmul,
        reference_sdpa,
        sample_token,
        tiled_paged_attention,
    )
    from .models import EngineConfig, GenerationConfig, Request, SequenceStatus
except ImportError:
    from engine import (
        InferenceEngine,
        PagedKVCache,
        dequantize_int8,
        measure_quant_error,
        quantize_int8,
        quantized_matmul,
        reference_sdpa,
        sample_token,
        tiled_paged_attention,
    )
    from models import EngineConfig, GenerationConfig, Request, SequenceStatus


def test_int8_quantization_roundtrip_and_matmul_error():
    """Verify INT8 quantization produces bounded numerical error vs FP32."""
    np.random.seed(42)
    w = (np.random.randn(64, 64) * 0.05).astype(np.float32)
    stats = measure_quant_error(w)

    assert stats.compression_ratio == 4.0
    assert stats.scale > 0.0
    assert stats.mean_err < 0.005
    assert stats.max_err < 0.02

    # Verify quantized matmul error against FP32 reference
    x = (np.random.randn(8, 64) * 0.1).astype(np.float32)
    q_w, scale_w = quantize_int8(w)
    y_int8 = quantized_matmul(x, q_w, scale_w)
    y_fp32 = np.matmul(x, w)

    mae = float(np.mean(np.abs(y_int8 - y_fp32)))
    assert mae < 0.02, f"Quantized matmul MAE too high: {mae}"


def test_paged_kv_cache_allocation_and_reclamation():
    """Verify paged memory manager allocation, exhaustion, and cleanup."""
    num_blocks = 4
    block_size = 8
    cache = PagedKVCache(num_blocks=num_blocks, block_size=block_size, num_heads=2, head_dim=16)

    assert cache.num_free() == 4
    assert cache.num_allocated() == 0
    assert cache.utilization() == 0.0

    b0 = cache.allocate()
    b1 = cache.allocate()
    b2 = cache.allocate()
    b3 = cache.allocate()
    b_overflow = cache.allocate()

    assert b_overflow is None
    assert cache.num_free() == 0
    assert cache.num_allocated() == 4
    assert cache.utilization() == 100.0

    # Free a subset
    cache.free([b1, b3])
    assert cache.num_free() == 2
    assert cache.num_allocated() == 2
    assert cache.utilization() == 50.0

    # Re-allocate
    new_b = cache.allocate()
    assert new_b in [b1, b3]
    assert cache.num_free() == 1

    # Free all
    cache.free([b0, b2, new_b])
    assert cache.num_free() == num_blocks
    assert cache.utilization() == 0.0


def test_paged_kv_cache_write_and_slot_integrity():
    """Verify writing slots to paged cache does not corrupt adjacent blocks or slots."""
    cache = PagedKVCache(num_blocks=2, block_size=4, num_heads=2, head_dim=4)
    k_val1 = np.ones((2, 4), dtype=np.float32) * 1.5
    v_val1 = np.ones((2, 4), dtype=np.float32) * 2.5
    k_val2 = np.ones((2, 4), dtype=np.float32) * 3.5
    v_val2 = np.ones((2, 4), dtype=np.float32) * 4.5

    cache.write_slot(0, 1, k_val1, v_val1)
    cache.write_slot(1, 0, k_val2, v_val2)

    assert np.allclose(cache.k_cache[0, 1], k_val1)
    assert np.allclose(cache.v_cache[0, 1], v_val1)
    assert np.allclose(cache.k_cache[1, 0], k_val2)
    assert np.allclose(cache.v_cache[1, 0], v_val2)
    assert np.allclose(cache.k_cache[0, 0], 0.0)  # Untouched slot remains 0


def test_tiled_paged_attention_numerical_parity():
    """Verify tiled paged attention is mathematically identical to reference SDPA."""
    np.random.seed(123)
    num_heads = 4
    head_dim = 32
    seq_len = 37  # Non-block-aligned length spanning across multiple blocks
    block_size = 16
    scale = 1.0 / math.sqrt(head_dim)

    q = np.random.randn(num_heads, head_dim).astype(np.float32)
    k = np.random.randn(seq_len, num_heads, head_dim).astype(np.float32)
    v = np.random.randn(seq_len, num_heads, head_dim).astype(np.float32)

    ref_out = reference_sdpa(q, k, v, scale)

    # Populate paged KV cache
    num_blocks = (seq_len + block_size - 1) // block_size
    cache = PagedKVCache(num_blocks=num_blocks, block_size=block_size, num_heads=num_heads, head_dim=head_dim)
    block_ids = [cache.allocate() for _ in range(num_blocks)]

    for t in range(seq_len):
        b_id = block_ids[t // block_size]
        slot = t % block_size
        cache.write_slot(b_id, slot, k[t], v[t])

    paged_out = tiled_paged_attention(
        q=q,
        block_ids=block_ids,
        k_cache=cache.k_cache,
        v_cache=cache.v_cache,
        seq_len=seq_len,
        block_size=block_size,
        scale=scale,
    )

    max_diff = float(np.max(np.abs(ref_out - paged_out)))
    assert max_diff < 1e-5, f"Paged attention disparity vs reference SDPA: {max_diff}"


def test_continuous_batching_multi_sequence_execution():
    """Verify continuous batching executes mixed requests to completion."""
    cfg = EngineConfig(
        vocab_size=128,
        hidden_dim=32,
        num_heads=2,
        head_dim=16,
        block_size=8,
        num_blocks=32,
        quantize_int8=True,
        seed=101,
    )
    engine = InferenceEngine(cfg)

    requests = [
        Request(request_id="req-1", prompt_tokens=[1, 2, 3], generation_config=GenerationConfig(max_new_tokens=6)),
        Request(request_id="req-2", prompt_tokens=[4, 5, 6, 7, 8], generation_config=GenerationConfig(max_new_tokens=4)),
        Request(request_id="req-3", prompt_tokens=[9, 10], generation_config=GenerationConfig(max_new_tokens=8)),
    ]

    for req in requests:
        engine.add_request(req)

    steps = 0
    while engine.has_unfinished_requests():
        engine.step()
        steps += 1
        assert steps < 50, "Scheduler loop exceeded safeguard iteration threshold"

    assert len(engine.completed) == 3
    assert all(seq.status == SequenceStatus.COMPLETED for seq in engine.completed)
    completed_map = {seq.request_id: seq for seq in engine.completed}
    assert len(completed_map["req-1"].output_tokens) == 6
    assert len(completed_map["req-2"].output_tokens) == 4
    assert len(completed_map["req-3"].output_tokens) == 8
    # Assert all blocks are freed back to memory pool
    assert engine.kv_cache.num_free() == cfg.num_blocks


def test_scheduler_preemption_under_memory_pressure():
    """Verify scheduler preempts running sequences and resumes them when blocks are constrained."""
    # Constrained 4 blocks total, each holds 4 tokens
    cfg = EngineConfig(
        vocab_size=64,
        hidden_dim=16,
        num_heads=2,
        head_dim=8,
        block_size=4,
        num_blocks=4,
        quantize_int8=False,
        max_batch_size=4,
        seed=42,
    )
    engine = InferenceEngine(cfg)

    # 3 requests competing for 4 blocks, each needing up to 2-3 blocks over time
    req1 = Request(request_id="heavy-1", prompt_tokens=[1, 2, 3], generation_config=GenerationConfig(max_new_tokens=8))
    req2 = Request(request_id="heavy-2", prompt_tokens=[4, 5, 6], generation_config=GenerationConfig(max_new_tokens=8))
    req3 = Request(request_id="heavy-3", prompt_tokens=[7, 8, 9], generation_config=GenerationConfig(max_new_tokens=8))

    engine.add_request(req1)
    engine.add_request(req2)
    engine.add_request(req3)

    steps = 0
    while engine.has_unfinished_requests():
        engine.step()
        steps += 1
        assert steps < 100, "Stalled scheduler under memory pressure"

    assert len(engine.completed) == 3
    assert engine.preempted_count >= 1, "Expected at least one preemption under constrained blocks"
    assert engine.kv_cache.num_free() == cfg.num_blocks


def test_stop_token_early_termination():
    """Verify generation halts immediately when a configured stop token is sampled."""
    cfg = EngineConfig(
        vocab_size=32,
        hidden_dim=16,
        num_heads=2,
        head_dim=8,
        block_size=4,
        num_blocks=8,
        seed=77,
    )
    engine = InferenceEngine(cfg)

    stop_token_id = 13
    req = Request(
        request_id="stop-test",
        prompt_tokens=[1, 2],
        generation_config=GenerationConfig(
            max_new_tokens=20,
            stop_token_ids=[stop_token_id],
            temperature=0.0,  # greedy
        ),
    )
    engine.add_request(req)

    while engine.has_unfinished_requests():
        engine.step()

    completed_seq = engine.completed[0]
    assert completed_seq.status == SequenceStatus.COMPLETED
    # Either stopped by token or reached max tokens
    if stop_token_id in completed_seq.output_tokens:
        assert completed_seq.output_tokens[-1] == stop_token_id
    assert engine.kv_cache.num_free() == cfg.num_blocks


def test_engine_benchmark_runner():
    """Verify run_benchmark produces accurate telemetry and valid token counts."""
    cfg = EngineConfig(
        vocab_size=128,
        hidden_dim=32,
        num_heads=2,
        head_dim=16,
        block_size=8,
        num_blocks=16,
        quantize_int8=True,
        seed=999,
    )
    engine = InferenceEngine(cfg)

    reqs = [
        Request(request_id=f"bench-{i}", prompt_tokens=[i + 1, i + 2], generation_config=GenerationConfig(max_new_tokens=5))
        for i in range(4)
    ]

    result = engine.run_benchmark(reqs)

    assert result.total_requests == 4
    assert result.completed_requests == 4
    assert result.total_prompt_tokens == 8
    assert result.total_generated_tokens == 20
    assert result.total_duration_sec > 0.0
    assert result.throughput_tokens_per_sec > 0.0
    assert result.peak_kv_blocks_used > 0
    assert 0.0 <= result.kv_block_utilization_pct <= 100.0
    assert result.quant_mae >= 0.0


def test_edge_case_single_token_and_exact_block_boundary():
    """Verify single-token prompts and exact block boundary prompts work correctly."""
    cfg = EngineConfig(
        vocab_size=64,
        hidden_dim=16,
        num_heads=2,
        head_dim=8,
        block_size=8,
        num_blocks=16,
        quantize_int8=True,
        seed=33,
    )
    engine = InferenceEngine(cfg)

    # 1-token prompt and exact 8-token prompt (matches block_size)
    req_single = Request(request_id="single", prompt_tokens=[5], generation_config=GenerationConfig(max_new_tokens=3))
    req_exact = Request(
        request_id="exact-boundary",
        prompt_tokens=list(range(1, 9)),  # length 8 == block_size
        generation_config=GenerationConfig(max_new_tokens=5),
    )

    engine.add_request(req_single)
    engine.add_request(req_exact)

    while engine.has_unfinished_requests():
        engine.step()

    comp_map = {s.request_id: s for s in engine.completed}
    assert len(comp_map["single"].output_tokens) == 3
    assert len(comp_map["exact-boundary"].output_tokens) == 5
    assert engine.kv_cache.num_free() == cfg.num_blocks


def test_int8_quantization_vs_fp32_end_to_end():
    """Verify engine runs deterministically and identically completes on both FP32 and INT8 modes."""
    base_cfg = dict(
        vocab_size=64,
        hidden_dim=16,
        num_heads=2,
        head_dim=8,
        block_size=4,
        num_blocks=8,
        seed=42,
    )

    engine_fp32 = InferenceEngine(EngineConfig(**base_cfg, quantize_int8=False))
    engine_int8 = InferenceEngine(EngineConfig(**base_cfg, quantize_int8=True))

    req = Request(
        request_id="comp-test",
        prompt_tokens=[2, 4, 6],
        generation_config=GenerationConfig(max_new_tokens=4, temperature=0.0),
    )

    res_fp32 = engine_fp32.run_benchmark([req])
    res_int8 = engine_int8.run_benchmark([req])

    assert res_fp32.completed_requests == 1
    assert res_int8.completed_requests == 1
    assert res_fp32.total_generated_tokens == 4
    assert res_int8.total_generated_tokens == 4
    assert res_int8.quant_mae > 0.0

