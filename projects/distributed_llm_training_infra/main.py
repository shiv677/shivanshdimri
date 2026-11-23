import argparse
import sys
import time
import torch

try:
    from .models import TrainingConfig
    from .engine import DistributedEngine
except (ImportError, ValueError):
    from models import TrainingConfig
    from engine import DistributedEngine


def get_default_device() -> str:
    if torch.cuda.is_available():
        try:
            torch.zeros(1, device="cuda")
            return "cuda"
        except Exception:
            return "cpu"
    return "cpu"


def parse_args():
    parser = argparse.ArgumentParser(description="Distributed LLM Training Infrastructure Benchmark")
    parser.add_argument("--steps", type=int, default=10, help="Total training steps")
    parser.add_argument("--batch-size", type=int, default=8, help="Global batch size")
    parser.add_argument("--micro-batch-size", type=int, default=2, help="Microbatch size for pipelining")
    parser.add_argument("--model-dim", type=int, default=64, help="Model hidden dimension")
    parser.add_argument("--hidden-dim", type=int, default=128, help="MLP intermediate dimension")
    parser.add_argument("--vocab-size", type=int, default=256, help="Vocabulary size")
    parser.add_argument("--num-layers", type=int, default=4, help="Number of transformer/MLP layers")
    parser.add_argument("--tp-size", type=int, default=2, help="Tensor parallel degree")
    parser.add_argument("--pp-size", type=int, default=2, help="Pipeline parallel stages")
    parser.add_argument("--zero-shards", type=int, default=2, help="ZeRO optimizer shards")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--checkpoint-dir", type=str, default="./checkpoints", help="Directory for checkpointing")
    parser.add_argument("--simulate-crash-at", type=int, default=5, help="Step at which to simulate crash and recovery")
    parser.add_argument(
        "--device",
        type=str,
        default=get_default_device(),
        help="Device (cpu or cuda)",
    )
    return parser.parse_args()


def run_benchmark():
    args = parse_args()
    grad_accum_steps = args.batch_size // args.micro_batch_size

    config = TrainingConfig(
        vocab_size=args.vocab_size,
        model_dim=args.model_dim,
        hidden_dim=args.hidden_dim,
        num_layers=args.num_layers,
        batch_size=args.batch_size,
        micro_batch_size=args.micro_batch_size,
        gradient_accumulation_steps=grad_accum_steps,
        tp_size=args.tp_size,
        pp_size=args.pp_size,
        zero_shards=args.zero_shards,
        learning_rate=args.lr,
        max_steps=args.steps,
        checkpoint_dir=args.checkpoint_dir,
        device=args.device,
    )

    print("=" * 70)
    print(" DISTRIBUTED LLM TRAINING INFRASTRUCTURE BENCHMARK")
    print("=" * 70)
    print(f"Device:               {config.device}")
    print(f"Model Dim / Layers:   {config.model_dim} / {config.num_layers}")
    print(f"Batch / Micro-Batch:  {config.batch_size} / {config.micro_batch_size} (Accum: {grad_accum_steps})")
    print(f"Tensor Parallel (TP): {config.tp_size}")
    print(f"Pipeline Stages (PP): {config.pp_size}")
    print(f"ZeRO Optimizer Shards:{config.zero_shards}")
    print("-" * 70)

    engine = DistributedEngine(config)

    # Optimizer memory savings calculation
    total_opt_bytes = sum(
        sum(opt.get_shard_memory_bytes(s) for s in range(config.zero_shards))
        for opt in engine.optimizers
    )
    per_shard_bytes = sum(opt.get_shard_memory_bytes(0) for opt in engine.optimizers)
    savings_pct = (1.0 - (per_shard_bytes / max(1, total_opt_bytes))) * 100.0

    print(f"Unsharded Optimizer State: {total_opt_bytes / 1024:.2f} KB")
    print(f"Sharded State Per Rank:    {per_shard_bytes / 1024:.2f} KB (Savings: {savings_pct:.1f}%)")
    print("-" * 70)

    # Synthetic training sequence
    seq_len = 16
    torch.manual_seed(42)
    tokens = torch.randint(0, config.vocab_size, (config.batch_size, seq_len))
    targets = torch.randint(0, config.vocab_size, (config.batch_size, seq_len))

    print(f"{'Step':>5} | {'Loss':>8} | {'Grad Norm':>10} | {'Time (ms)':>10} | {'Throughput (samp/s)':>20}")
    print("-" * 70)

    total_start = time.perf_counter()
    crash_step = args.simulate_crash_at

    for step in range(1, args.steps + 1):
        if step == crash_step:
            print(f"\n[CRASH SIMULATION] Saving checkpoint at step {step - 1} and simulating node failure...")
            # Save checkpoint before crash
            engine.save_checkpoint(config.checkpoint_dir, step=step - 1, loss=last_loss)

            # Re-instantiate clean engine to simulate crash recovery
            print("[CRASH SIMULATION] Spawning fresh engine instance from checkpoint...")
            engine = DistributedEngine(config)
            meta = engine.load_checkpoint(config.checkpoint_dir)
            print(f"[RECOVERY SUCCESS] Restored state from step {meta.step} (loss: {meta.loss:.4f})")
            print("-" * 70)

        metrics = engine.train_step(step, tokens, targets)
        last_loss = metrics.loss
        throughput = (metrics.accumulated_samples / (metrics.step_time_ms / 1000.0)) if metrics.step_time_ms > 0 else 0
        print(
            f"{metrics.step:>5} | {metrics.loss:>8.4f} | {metrics.grad_norm:>10.4f} | "
            f"{metrics.step_time_ms:>10.2f} | {throughput:>20.1f}"
        )

    total_time = time.perf_counter() - total_start
    print("-" * 70)
    print(f"Benchmark finished successfully in {total_time:.3f}s")
    print("=" * 70)


if __name__ == "__main__":
    run_benchmark()
