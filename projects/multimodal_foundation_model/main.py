import argparse
import json
import sys
import time
from pathlib import Path
import torch

sys.path.insert(0, str(Path(__file__).parent))

try:
    from .models import BenchmarkReport, ModelConfig
    from .engine import (
        MultimodalFoundationModel,
        SimpleTokenizer,
        create_synthetic_data,
        train_step,
    )
except ImportError:
    from models import BenchmarkReport, ModelConfig
    from engine import (
        MultimodalFoundationModel,
        SimpleTokenizer,
        create_synthetic_data,
        train_step,
    )


def get_device(device_name: str = "auto") -> torch.device:
    """Resolve compute device with graceful fallback if GPU architecture is unsupported."""
    if device_name != "auto":
        return torch.device(device_name)
    if torch.cuda.is_available():
        try:
            _ = (torch.zeros(1, device="cuda") + 1).cpu()
            return torch.device("cuda")
        except Exception:
            pass
    return torch.device("cpu")


def run_benchmark(
    num_samples: int = 16,
    train_epochs: int = 5,
    device_name: str = "auto",
    output_path: str = None,
) -> BenchmarkReport:
    """Run multimodal foundation model training and visual reasoning benchmark."""
    device = get_device(device_name)

    print(f"Initializing Multimodal Foundation Model on {device}...")
    config = ModelConfig(
        vocab_size=256,
        image_size=32,
        patch_size=8,
        vision_dim=64,
        vision_layers=2,
        vision_heads=4,
        text_dim=64,
        text_layers=2,
        text_heads=4,
        mlp_dim=128,
        max_seq_len=256,
    )
    tokenizer = SimpleTokenizer(vocab_size=config.vocab_size)
    model = MultimodalFoundationModel(config).to(device)

    param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Model parameters: {param_count:,}")

    # Generate synthetic visual reasoning pairs
    images, samples = create_synthetic_data(num_samples=num_samples, image_size=config.image_size)
    images = images.to(device)

    # Optional quick fine-tuning adaptation
    if train_epochs > 0:
        print(f"\nRunning {train_epochs} training adaptation epochs...")
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)

        for epoch in range(1, train_epochs + 1):
            total_loss = 0.0
            for i in range(len(samples)):
                img = images[i : i + 1]
                prompt = f"Question: {samples[i].question}\nAnswer: " + samples[i].ground_truth
                tokens = tokenizer.encode(prompt, add_bos=True, add_eos=True)
                input_ids = torch.tensor([tokens[:-1]], dtype=torch.long, device=device)
                target_ids = torch.tensor([tokens[1:]], dtype=torch.long, device=device)

                loss = train_step(model, optimizer, img, input_ids, target_ids)
                total_loss += loss

            avg_loss = total_loss / len(samples)
            if epoch == 1 or epoch == train_epochs or epoch % 2 == 0:
                print(f"Epoch {epoch:2d}/{train_epochs:2d} - Loss: {avg_loss:.4f}")

    # Evaluate Visual Reasoning
    print("\nRunning Visual Reasoning Evaluation...")
    eval_result = model.evaluate_reasoning(samples, images, tokenizer)

    # Compute throughput
    t0 = time.perf_counter()
    with torch.no_grad():
        test_ids = torch.tensor([[tokenizer.bos_id, 10, 11, 12]], dtype=torch.long, device=device)
        for _ in range(20):
            model(images[:1], test_ids)
    elapsed = time.perf_counter() - t0
    fps = 20.0 / elapsed if elapsed > 0 else 0.0

    report = BenchmarkReport(
        device=str(device),
        param_count=param_count,
        eval_metrics=eval_result,
        throughput_fps=round(fps, 2),
    )

    print("\n" + "=" * 50)
    print("        BENCHMARK REPORT")
    print("=" * 50)
    print(f"Device:           {report.device}")
    print(f"Parameters:       {report.param_count:,}")
    print(f"Samples Evaluated:{report.eval_metrics.total_samples}")
    print(f"Correct:          {report.eval_metrics.correct_count}/{report.eval_metrics.total_samples}")
    print(f"Accuracy:         {report.eval_metrics.accuracy * 100:.1f}%")
    print(f"Avg Latency:      {report.eval_metrics.avg_latency_ms:.2f} ms")
    print(f"Throughput:       {report.throughput_fps:.1f} fps")
    print("=" * 50)

    print("\nSample Predictions:")
    for pred in report.eval_metrics.predictions[:4]:
        status = "PASS" if pred["correct"] else "FAIL"
        print(f"[{status}] Q: {pred['question']} -> Pred: '{pred['predicted']}' (GT: '{pred['ground_truth']}')")

    if output_path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(report.model_dump_json(indent=2))
        print(f"\nReport saved to: {out_file}")

    return report


def main():
    parser = argparse.ArgumentParser(description="Multimodal Foundation Model Benchmark Driver")
    parser.add_argument("--samples", type=int, default=16, help="Number of visual reasoning samples")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--device", type=str, default="auto", choices=["auto", "cpu", "cuda"], help="Execution device")
    parser.add_argument("--output", type=str, default=None, help="Optional output JSON report path")
    args = parser.parse_args()

    run_benchmark(
        num_samples=args.samples,
        train_epochs=args.epochs,
        device_name=args.device,
        output_path=args.output,
    )


if __name__ == "__main__":
    main()
