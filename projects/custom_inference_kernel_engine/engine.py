import math
import time
from typing import List, Optional, Tuple
import numpy as np

try:
    from .models import (
        BenchmarkResult,
        EngineConfig,
        GenerationConfig,
        QuantStats,
        Request,
        Sequence,
        SequenceStatus,
        StepExecutionRecord,
    )
except ImportError:
    from models import (
        BenchmarkResult,
        EngineConfig,
        GenerationConfig,
        QuantStats,
        Request,
        Sequence,
        SequenceStatus,
        StepExecutionRecord,
    )


# ============================================================================
# INT8 Dynamic Quantization
# ============================================================================

def quantize_int8(tensor: np.ndarray) -> Tuple[np.ndarray, float]:
    """Symmetric dynamic quantization to INT8 (-128 to 127)."""
    max_val = float(np.max(np.abs(tensor)))
    scale = max(max_val / 127.0, 1e-8)
    q = np.clip(np.round(tensor / scale), -128, 127).astype(np.int8)
    return q, scale


def dequantize_int8(q: np.ndarray, scale: float) -> np.ndarray:
    """Dequantize INT8 back to float32."""
    return q.astype(np.float32) * scale


def quantized_matmul(x: np.ndarray, q_w: np.ndarray, w_scale: float) -> np.ndarray:
    """Dynamic activation quantization and INT32 accumulation matmul."""
    x_max = float(np.max(np.abs(x)))
    x_scale = max(x_max / 127.0, 1e-8)
    q_x = np.clip(np.round(x / x_scale), -128, 127).astype(np.int8)
    acc = np.matmul(q_x.astype(np.int32), q_w.astype(np.int32))
    return acc.astype(np.float32) * (x_scale * w_scale)


def measure_quant_error(w: np.ndarray) -> QuantStats:
    """Calculate quantization error against FP32 reference."""
    q, scale = quantize_int8(w)
    deq = dequantize_int8(q, scale)
    abs_err = np.abs(w - deq)
    return QuantStats(
        scale=scale,
        max_err=float(np.max(abs_err)),
        mean_err=float(np.mean(abs_err)),
        compression_ratio=4.0,
    )


# ============================================================================
# Paged KV-Cache Memory Manager
# ============================================================================

class PagedKVCache:
    """Fixed-size block memory manager for Key-Value cache."""

    def __init__(self, num_blocks: int, block_size: int, num_heads: int, head_dim: int):
        self.num_blocks = num_blocks
        self.block_size = block_size
        self.num_heads = num_heads
        self.head_dim = head_dim
        self.k_cache = np.zeros((num_blocks, block_size, num_heads, head_dim), dtype=np.float32)
        self.v_cache = np.zeros((num_blocks, block_size, num_heads, head_dim), dtype=np.float32)
        self.free_blocks = list(range(num_blocks))

    def allocate(self) -> Optional[int]:
        if not self.free_blocks:
            return None
        return self.free_blocks.pop(0)

    def free(self, block_ids: List[int]) -> None:
        for b in block_ids:
            if b not in self.free_blocks:
                self.free_blocks.append(b)

    def write_slot(self, block_id: int, slot: int, k_vec: np.ndarray, v_vec: np.ndarray) -> None:
        self.k_cache[block_id, slot] = k_vec
        self.v_cache[block_id, slot] = v_vec

    def num_free(self) -> int:
        return len(self.free_blocks)

    def num_allocated(self) -> int:
        return self.num_blocks - len(self.free_blocks)

    def utilization(self) -> float:
        return (self.num_allocated() / self.num_blocks) * 100.0


# ============================================================================
# Optimized Attention Kernels
# ============================================================================

def reference_sdpa(q: np.ndarray, k: np.ndarray, v: np.ndarray, scale: float) -> np.ndarray:
    """Standard scaled dot-product attention for verification.
    q: (num_heads, head_dim)
    k: (seq_len, num_heads, head_dim)
    v: (seq_len, num_heads, head_dim)
    Returns: (num_heads, head_dim)
    """
    scores = np.einsum("hd,thd->th", q, k) * scale  # (T, H)
    scores_max = np.max(scores, axis=0, keepdims=True)  # (1, H)
    exp_scores = np.exp(scores - scores_max)
    weights = exp_scores / np.sum(exp_scores, axis=0, keepdims=True)  # (T, H)
    return np.einsum("th,thd->hd", weights, v)


def tiled_paged_attention(
    q: np.ndarray,
    block_ids: List[int],
    k_cache: np.ndarray,
    v_cache: np.ndarray,
    seq_len: int,
    block_size: int,
    scale: float,
) -> np.ndarray:
    """Tiled online-softmax attention over paged KV memory blocks.
    Executes single query decode without materializing contiguous KV tensors.
    q: (num_heads, head_dim)
    """
    num_heads, head_dim = q.shape
    running_max = np.full(num_heads, -np.inf, dtype=np.float32)
    running_sum = np.zeros(num_heads, dtype=np.float32)
    acc = np.zeros((num_heads, head_dim), dtype=np.float32)

    for i, b_id in enumerate(block_ids):
        tokens_in_block = min(block_size, seq_len - (i * block_size))
        if tokens_in_block <= 0:
            break

        k_blk = k_cache[b_id, :tokens_in_block]  # (tokens_in_block, H, D)
        v_blk = v_cache[b_id, :tokens_in_block]

        # Block attention scores: (tokens_in_block, H)
        scores = np.einsum("hd,thd->th", q, k_blk) * scale
        blk_max = np.max(scores, axis=0)  # (H,)

        new_max = np.maximum(running_max, blk_max)
        exp_prev = np.exp(running_max - new_max)
        p = np.exp(scores - new_max[None, :])  # (tokens_in_block, H)

        running_sum = (running_sum * exp_prev) + np.sum(p, axis=0)
        blk_v = np.einsum("th,thd->hd", p, v_blk)
        acc = (acc * exp_prev[:, None]) + blk_v
        running_max = new_max

    return acc / (running_sum[:, None] + 1e-12)


# ============================================================================
# Token Sampling & Continuous Batching Inference Engine
# ============================================================================

def sample_token(logits: np.ndarray, config: GenerationConfig) -> int:
    """Sample next token with temperature and top-k filtering."""
    if config.temperature <= 1e-4:
        return int(np.argmax(logits))

    scaled = logits / max(config.temperature, 1e-4)
    if 0 < config.top_k < len(scaled):
        cutoff_idx = np.argpartition(scaled, -config.top_k)[-config.top_k:]
        filtered = np.full_like(scaled, -np.inf)
        filtered[cutoff_idx] = scaled[cutoff_idx]
        scaled = filtered

    exp_scaled = np.exp(scaled - np.max(scaled))
    probs = exp_scaled / np.sum(exp_scaled)
    return int(np.random.choice(len(probs), p=probs))


class InferenceEngine:
    """Custom inference engine with continuous batching, paged KV, and INT8."""

    def __init__(self, config: EngineConfig):
        self.config = config
        np.random.seed(config.seed)

        self.kv_cache = PagedKVCache(
            num_blocks=config.num_blocks,
            block_size=config.block_size,
            num_heads=config.num_heads,
            head_dim=config.head_dim,
        )

        # Initialize model projection weights
        hidden = config.hidden_dim
        scale = 0.02
        self.embed_table = (np.random.randn(config.vocab_size, hidden) * scale).astype(np.float32)
        self.w_q = (np.random.randn(hidden, hidden) * scale).astype(np.float32)
        self.w_k = (np.random.randn(hidden, hidden) * scale).astype(np.float32)
        self.w_v = (np.random.randn(hidden, hidden) * scale).astype(np.float32)
        self.w_o = (np.random.randn(hidden, hidden) * scale).astype(np.float32)
        self.w_lm_head = (np.random.randn(hidden, config.vocab_size) * scale).astype(np.float32)

        # Quantize weights if INT8 is enabled
        self.q_weights = {}
        if config.quantize_int8:
            for name, w in [
                ("w_q", self.w_q),
                ("w_k", self.w_k),
                ("w_v", self.w_v),
                ("w_o", self.w_o),
                ("w_lm_head", self.w_lm_head),
            ]:
                q, s = quantize_int8(w)
                self.q_weights[name] = (q, s)

        self.attn_scale = 1.0 / math.sqrt(config.head_dim)
        self.waiting: List[Sequence] = []
        self.running: List[Sequence] = []
        self.completed: List[Sequence] = []
        self.preempted_count = 0
        self.step_counter = 0

    def _linear(self, x: np.ndarray, weight_name: str, fp_weight: np.ndarray) -> np.ndarray:
        if self.config.quantize_int8:
            q_w, w_s = self.q_weights[weight_name]
            return quantized_matmul(x, q_w, w_s)
        return np.matmul(x, fp_weight)

    def add_request(self, request: Request) -> Sequence:
        seq = Sequence(
            request_id=request.request_id,
            prompt_tokens=list(request.prompt_tokens),
            generation_config=request.generation_config,
        )
        self.waiting.append(seq)
        return seq

    def has_unfinished_requests(self) -> bool:
        return bool(self.waiting or self.running)

    def step(self) -> StepExecutionRecord:
        """Single iteration step of continuous batching scheduler."""
        self.step_counter += 1
        tokens_generated = 0

        # Phase 1: Admit waiting sequences if blocks are available
        to_admit = []
        for seq in self.waiting:
            if len(self.running) + len(to_admit) >= self.config.max_batch_size:
                break
            prompt_len = len(seq.prompt_tokens)
            blocks_needed = (prompt_len + self.config.block_size - 1) // self.config.block_size
            if self.kv_cache.num_free() >= blocks_needed:
                to_admit.append((seq, blocks_needed))

        newly_admitted = []
        for seq, blocks_needed in to_admit:
            self.waiting.remove(seq)
            allocated = [self.kv_cache.allocate() for _ in range(blocks_needed)]
            seq.block_ids = allocated

            # Prefill: compute & write K, V for all prompt tokens
            prompt_len = len(seq.prompt_tokens)
            last_q = None
            for idx, tok in enumerate(seq.prompt_tokens):
                x = self.embed_table[tok]
                q = self._linear(x, "w_q", self.w_q).reshape(self.config.num_heads, self.config.head_dim)
                k = self._linear(x, "w_k", self.w_k).reshape(self.config.num_heads, self.config.head_dim)
                v = self._linear(x, "w_v", self.w_v).reshape(self.config.num_heads, self.config.head_dim)
                b_id = seq.block_ids[idx // self.config.block_size]
                slot = idx % self.config.block_size
                self.kv_cache.write_slot(b_id, slot, k, v)
                if idx == prompt_len - 1:
                    last_q = q

            # Generate first token from prompt's final token query
            attn_out = tiled_paged_attention(
                last_q,
                seq.block_ids,
                self.kv_cache.k_cache,
                self.kv_cache.v_cache,
                seq_len=prompt_len,
                block_size=self.config.block_size,
                scale=self.attn_scale,
            ).reshape(self.config.hidden_dim)

            h = self._linear(attn_out, "w_o", self.w_o)
            logits = self._linear(h, "w_lm_head", self.w_lm_head)
            first_tok = sample_token(logits, seq.generation_config)
            seq.output_tokens.append(first_tok)
            tokens_generated += 1

            if (
                first_tok in seq.generation_config.stop_token_ids
                or len(seq.output_tokens) >= seq.generation_config.max_new_tokens
            ):
                seq.status = SequenceStatus.COMPLETED
                seq.finished_at = time.time()
                self.kv_cache.free(seq.block_ids)
                self.completed.append(seq)
            else:
                seq.status = SequenceStatus.RUNNING
                newly_admitted.append(seq)

        # Phase 2: Check memory availability for active decode sequences
        for seq in list(self.running):
            cached_len = len(seq.prompt_tokens) + len(seq.output_tokens) - 1
            if cached_len % self.config.block_size == 0 and self.kv_cache.num_free() < 1:
                if len(self.running) > 1:
                    # Preempt another sequence to relieve memory pressure
                    preempt_seq = self.running.pop() if self.running[-1] != seq else self.running.pop(0)
                    self.kv_cache.free(preempt_seq.block_ids)
                    preempt_seq.block_ids = []
                    preempt_seq.output_tokens = []
                    preempt_seq.status = SequenceStatus.PREEMPTED
                    self.waiting.insert(0, preempt_seq)
                    self.preempted_count += 1
                    break
                else:
                    # Single sequence exhausted all cache blocks; finish gracefully
                    seq.status = SequenceStatus.COMPLETED
                    seq.finished_at = time.time()
                    self.kv_cache.free(seq.block_ids)
                    self.running.remove(seq)
                    self.completed.append(seq)
                    break

        # Phase 3: Execute decode step for all running sequences
        for seq in list(self.running):
            cached_len = len(seq.prompt_tokens) + len(seq.output_tokens) - 1
            if cached_len % self.config.block_size == 0:
                new_block = self.kv_cache.allocate()
                if new_block is None:
                    seq.status = SequenceStatus.COMPLETED
                    seq.finished_at = time.time()
                    self.kv_cache.free(seq.block_ids)
                    self.running.remove(seq)
                    self.completed.append(seq)
                    continue
                seq.block_ids.append(new_block)

            b_idx = cached_len // self.config.block_size
            b_id = seq.block_ids[b_idx]
            slot = cached_len % self.config.block_size

            # Process last generated token
            last_tok = seq.output_tokens[-1]
            x = self.embed_table[last_tok]
            q = self._linear(x, "w_q", self.w_q).reshape(self.config.num_heads, self.config.head_dim)
            k = self._linear(x, "w_k", self.w_k).reshape(self.config.num_heads, self.config.head_dim)
            v = self._linear(x, "w_v", self.w_v).reshape(self.config.num_heads, self.config.head_dim)

            self.kv_cache.write_slot(b_id, slot, k, v)
            total_tokens = cached_len + 1

            attn_out = tiled_paged_attention(
                q,
                seq.block_ids,
                self.kv_cache.k_cache,
                self.kv_cache.v_cache,
                seq_len=total_tokens,
                block_size=self.config.block_size,
                scale=self.attn_scale,
            ).reshape(self.config.hidden_dim)

            h = self._linear(attn_out, "w_o", self.w_o)
            logits = self._linear(h, "w_lm_head", self.w_lm_head)
            next_tok = sample_token(logits, seq.generation_config)
            seq.output_tokens.append(next_tok)
            tokens_generated += 1

            if (
                next_tok in seq.generation_config.stop_token_ids
                or len(seq.output_tokens) >= seq.generation_config.max_new_tokens
            ):
                seq.status = SequenceStatus.COMPLETED
                seq.finished_at = time.time()
                self.kv_cache.free(seq.block_ids)
                self.running.remove(seq)
                self.completed.append(seq)

        self.running.extend(newly_admitted)

        return StepExecutionRecord(
            step_idx=self.step_counter,
            running_seqs=len(self.running),
            waiting_seqs=len(self.waiting),
            free_blocks=self.kv_cache.num_free(),
            tokens_generated=tokens_generated,
        )

    def run_benchmark(self, requests: List[Request]) -> BenchmarkResult:
        """Run all requests to completion and collect benchmark telemetry."""
        for req in requests:
            self.add_request(req)

        total_requests = len(requests)
        total_prompt_tokens = sum(len(r.prompt_tokens) for r in requests)
        peak_used_blocks = 0
        step_records = []

        start_time = time.perf_counter()
        while self.has_unfinished_requests():
            record = self.step()
            step_records.append(record)
            used_blocks = self.config.num_blocks - record.free_blocks
            if used_blocks > peak_used_blocks:
                peak_used_blocks = used_blocks

        duration = max(time.perf_counter() - start_time, 1e-6)
        total_generated = sum(len(s.output_tokens) for s in self.completed)

        # Quantization MAE metric
        quant_mae = 0.0
        if self.config.quantize_int8:
            test_x = np.random.randn(8, self.config.hidden_dim).astype(np.float32)
            fp_y = np.matmul(test_x, self.w_o)
            int8_y = quantized_matmul(test_x, self.q_weights["w_o"][0], self.q_weights["w_o"][1])
            quant_mae = float(np.mean(np.abs(fp_y - int8_y)))

        return BenchmarkResult(
            total_requests=total_requests,
            completed_requests=len(self.completed),
            preempted_count=self.preempted_count,
            total_prompt_tokens=total_prompt_tokens,
            total_generated_tokens=total_generated,
            total_duration_sec=duration,
            throughput_tokens_per_sec=(total_prompt_tokens + total_generated) / duration,
            peak_kv_blocks_used=peak_used_blocks,
            kv_block_utilization_pct=(peak_used_blocks / self.config.num_blocks) * 100.0,
            quant_mae=quant_mae,
            steps=step_records,
        )
