import argparse
import random
import time
from typing import List

try:
    from .engine import InferenceEngine, measure_quant_error
    from .models import BenchmarkResult, EngineConfig, GenerationConfig, Request
except ImportError:
    from engine import InferenceEngine, measure_quant_error
    from models import BenchmarkResult, EngineConfig, GenerationConfig, Request


def generate_synthetic_workload(
    num_requests: int,
    vocab_size: int,
    min_prompt_len: int = 4,
    max_prompt_len: int = 24,
    min_gen_tokens: int = 8,
    max_gen_tokens: int = 32,
    seed: int = 42,
) -> List[Request]:
    """Generate synthetic requests with varying prompt lengths and generation targets."""
    rng = random.Random(seed)
    requests = []
    for i in range(num_requests):
        prompt_len = rng.randint(min_prompt_len, max_prompt_len)
        gen_len = rng.randint(min_gen_tokens, max_gen_tokens)
        prompt_tokens = [rng.randint(1, vocab_size - 1) for _ in range(prompt_len)]
        req = Request(
            request_id=f"req-{i+1:03d}",
            prompt_tokens=prompt_tokens,
            generation_config=GenerationConfig(
                max_new_tokens=gen_len,
                temperature=0.7,
                top_k=20,
                stop_token_ids=[0],
            ),
        )
        requests.append(req)
    return requests


def print_banner(config: EngineConfig, num_requests: int) -> None:
    print("=" * 80)
    print("Custom AI Inference Kernel Engine: Continuous Batching & Paged KV-Cache")
    print("=" * 80)
    print(f"Architecture:       Hidden Dim={config.hidden_dim}, Heads={config.num_heads}, Head Dim={config.head_dim}")
    print(f"Paged KV Cache:     {config.num_blocks} blocks, {config.block_size} tokens/block (Capacity: {config.num_blocks * config.block_size} tokens)")
    print(f"Continuous Batch:   Max Batch Size={config.max_batch_size}")
    print(f"Quantization:       {'INT8 Dynamic Quantization' if config.quantize_int8 else 'FP32 Full Precision'}")
    print(f"Workload:           {num_requests} synthetic requests")
    print("-" * 80)


def print_results(result: BenchmarkResult, label: str = "Benchmark Results") -> None:
    print("-" * 80)
    print(f"--- {label} ---")
    print(f"Total Requests:              {result.total_requests}")
    print(f"Completed Requests:          {result.completed_requests}")
    print(f"Preempted Count:             {result.preempted_count}")
    print(f"Prompt Tokens Processed:     {result.total_prompt_tokens}")
    print(f"Generated Tokens:            {result.total_generated_tokens}")
    print(f"Total Tokens:                {result.total_prompt_tokens + result.total_generated_tokens}")
    print(f"Execution Duration:          {result.total_duration_sec:.4f} s")
    print(f"Inference Throughput:        {result.throughput_tokens_per_sec:.2f} tokens/sec")
    print(f"Peak KV Blocks Allocated:    {result.peak_kv_blocks_used} / {result.steps[0].free_blocks + result.steps[0].running_seqs} blocks")
    print(f"Peak KV Cache Utilization:   {result.kv_block_utilization_pct:.1f}%")
    if result.quant_mae > 0.0:
        print(f"INT8 Weight/Act Quant MAE:   {result.quant_mae:.5f}")
        print(f"Memory Compression Factor:   4.0x (32-bit float -> 8-bit integer)")
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Custom AI Inference Kernel Engine CLI")
    parser.add_argument("--num-prompts", type=int, default=8, help="Number of synthetic prompts")
    parser.add_argument("--batch-size", type=int, default=4, help="Continuous batching max batch size")
    parser.add_argument("--block-size", type=int, default=16, help="Tokens per physical KV cache block")
    parser.add_argument("--num-blocks", type=int, default=32, help="Total physical KV cache blocks in pool")
    parser.add_argument("--hidden-dim", type=int, default=128, help="Transformer hidden dimension")
    parser.add_argument("--num-heads", type=int, default=4, help="Attention heads")
    parser.add_argument("--head-dim", type=int, default=32, help="Head dimension")
    parser.add_argument("--vocab-size", type=int, default=1024, help="Vocabulary size")
    parser.add_argument("--no-quant", action="store_true", help="Disable INT8 dynamic quantization (use FP32)")
    parser.add_argument("--compare", action="store_true", help="Run side-by-side comparison between FP32 and INT8")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    config = EngineConfig(
        vocab_size=args.vocab_size,
        hidden_dim=args.hidden_dim,
        num_heads=args.num_heads,
        head_dim=args.head_dim,
        block_size=args.block_size,
        num_blocks=args.num_blocks,
        quantize_int8=not args.no_quant,
        max_batch_size=args.batch_size,
        seed=args.seed,
    )

    requests = generate_synthetic_workload(
        num_requests=args.num_prompts,
        vocab_size=args.vocab_size,
        seed=args.seed,
    )

    print_banner(config, len(requests))

    engine = InferenceEngine(config)
    result = engine.run_benchmark(requests)
    print_results(result, label="INT8 Engine Run" if config.quantize_int8 else "FP32 Engine Run")

    if args.compare:
        print("\nRunning Comparative Baseline (FP32 Full Precision)...")
        fp32_config = config.model_copy(update={"quantize_int8": False})
        fp32_engine = InferenceEngine(fp32_config)
        fp32_requests = generate_synthetic_workload(
            num_requests=args.num_prompts,
            vocab_size=args.vocab_size,
            seed=args.seed,
        )
        fp32_result = fp32_engine.run_benchmark(fp32_requests)
        print_results(fp32_result, label="FP32 Baseline Run")

        print("Performance & Memory Differential:")
        speedup = (result.throughput_tokens_per_sec / fp32_result.throughput_tokens_per_sec - 1.0) * 100.0
        print(f"Throughput Delta:            {speedup:+.1f}%")
        print(f"Weight Memory Reduction:     75.0% (4x compression)")
        print(f"Numerical Error (MAE):       {result.quant_mae:.5f}")


if __name__ == "__main__":
    main()
