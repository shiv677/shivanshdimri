import json
import math
import os
import tempfile
import time
from typing import List, Tuple, Dict, Any

import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    from .models import TrainingConfig, StepMetrics, CheckpointMetadata
except (ImportError, ValueError):
    from models import TrainingConfig, StepMetrics, CheckpointMetadata


class ColumnParallelLinear(nn.Module):
    def __init__(self, in_features: int, out_features: int, tp_size: int, tp_rank: int, bias: bool = True):
        super().__init__()
        if out_features % tp_size != 0:
            raise ValueError(f"out_features ({out_features}) must be divisible by tp_size ({tp_size})")
        self.in_features = in_features
        self.out_features = out_features
        self.tp_size = tp_size
        self.tp_rank = tp_rank
        self.split_out_features = out_features // tp_size

        self.weight = nn.Parameter(torch.empty(self.split_out_features, in_features))
        if bias:
            self.bias = nn.Parameter(torch.empty(self.split_out_features))
        else:
            self.register_parameter("bias", None)
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.kaiming_uniform_(self.weight, a=math.sqrt(5))
        if self.bias is not None:
            fan_in = self.in_features
            bound = 1 / math.sqrt(fan_in) if fan_in > 0 else 0
            nn.init.uniform_(self.bias, -bound, bound)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.linear(x, self.weight, self.bias)


class RowParallelLinear(nn.Module):
    def __init__(self, in_features: int, out_features: int, tp_size: int, tp_rank: int, bias: bool = True):
        super().__init__()
        if in_features % tp_size != 0:
            raise ValueError(f"in_features ({in_features}) must be divisible by tp_size ({tp_size})")
        self.in_features = in_features
        self.out_features = out_features
        self.tp_size = tp_size
        self.tp_rank = tp_rank
        self.split_in_features = in_features // tp_size

        self.weight = nn.Parameter(torch.empty(out_features, self.split_in_features))
        if bias:
            # Bias is assigned only to rank 0 so it is not multiplied during all-reduce sum
            if tp_rank == 0:
                self.bias = nn.Parameter(torch.empty(out_features))
            else:
                self.register_buffer("bias", torch.zeros(out_features))
        else:
            self.register_parameter("bias", None)
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.kaiming_uniform_(self.weight, a=math.sqrt(5))
        if self.bias is not None and isinstance(self.bias, nn.Parameter):
            fan_in = self.in_features
            bound = 1 / math.sqrt(fan_in) if fan_in > 0 else 0
            nn.init.uniform_(self.bias, -bound, bound)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = F.linear(x, self.weight, None)
        if self.bias is not None:
            out = out + self.bias
        return out


class TPBlock(nn.Module):
    def __init__(self, model_dim: int, hidden_dim: int, tp_size: int):
        super().__init__()
        self.tp_size = tp_size
        self.norm = nn.LayerNorm(model_dim)
        self.col_shards = nn.ModuleList([
            ColumnParallelLinear(model_dim, hidden_dim, tp_size, r)
            for r in range(tp_size)
        ])
        self.row_shards = nn.ModuleList([
            RowParallelLinear(hidden_dim, model_dim, tp_size, r)
            for r in range(tp_size)
        ])

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        norm_x = self.norm(x)
        # Compute sharded tensor-parallel branch activations
        rank_outputs = []
        for r in range(self.tp_size):
            h_r = F.gelu(self.col_shards[r](norm_x))
            out_r = self.row_shards[r](h_r)
            rank_outputs.append(out_r)
        # Tensor-parallel All-Reduce (SUM) across ranks
        reduced = torch.stack(rank_outputs, dim=0).sum(dim=0)
        return x + reduced


class PipelineStage(nn.Module):
    def __init__(
        self,
        stage_idx: int,
        pp_size: int,
        vocab_size: int,
        model_dim: int,
        hidden_dim: int,
        num_layers: int,
        tp_size: int,
    ):
        super().__init__()
        self.stage_idx = stage_idx
        self.pp_size = pp_size

        layers_per_stage = max(1, num_layers // pp_size)
        self.blocks = nn.ModuleList([
            TPBlock(model_dim, hidden_dim, tp_size)
            for _ in range(layers_per_stage)
        ])

        if stage_idx == 0:
            self.embed = nn.Embedding(vocab_size, model_dim)
        else:
            self.embed = None

        if stage_idx == pp_size - 1:
            self.norm = nn.LayerNorm(model_dim)
            self.head = nn.Linear(model_dim, vocab_size, bias=False)
        else:
            self.norm = None
            self.head = None

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.stage_idx == 0:
            h = self.embed(x)
        else:
            h = x

        for block in self.blocks:
            h = block(h)

        if self.stage_idx == self.pp_size - 1:
            h = self.norm(h)
            return self.head(h)
        return h


class ShardedOptimizer:
    """ZeRO-1 / FSDP style optimizer sharding optimizer states (m, v) across ranks."""
    def __init__(
        self,
        params,
        lr: float = 1e-3,
        betas: Tuple[float, float] = (0.9, 0.999),
        eps: float = 1e-8,
        weight_decay: float = 0.01,
        zero_shards: int = 2,
    ):
        self.params = [p for p in params if p.requires_grad]
        self.lr = lr
        self.beta1, self.beta2 = betas
        self.eps = eps
        self.weight_decay = weight_decay
        self.zero_shards = max(1, zero_shards)
        self.step_count = 0

        # Partition states across shards
        self.shard_states: List[Dict[int, Dict[str, Any]]] = [{} for _ in range(self.zero_shards)]
        self._init_sharded_states()

    def _init_sharded_states(self):
        for p_idx, p in enumerate(self.params):
            numel = p.numel()
            chunk = (numel + self.zero_shards - 1) // self.zero_shards
            for s in range(self.zero_shards):
                start = s * chunk
                end = min(start + chunk, numel)
                length = max(0, end - start)
                self.shard_states[s][p_idx] = {
                    "start": start,
                    "end": end,
                    "exp_avg": torch.zeros(length, dtype=p.dtype, device=p.device),
                    "exp_avg_sq": torch.zeros(length, dtype=p.dtype, device=p.device),
                }

    def zero_grad(self):
        for p in self.params:
            if p.grad is not None:
                p.grad.detach_()
                p.grad.zero_()

    def step(self):
        self.step_count += 1
        b1, b2 = self.beta1, self.beta2
        bc1 = 1.0 - (b1 ** self.step_count)
        bc2 = 1.0 - (b2 ** self.step_count)

        with torch.no_grad():
            for p_idx, p in enumerate(self.params):
                if p.grad is None:
                    continue
                p_flat = p.view(-1)
                g_flat = p.grad.view(-1)

                for s in range(self.zero_shards):
                    meta = self.shard_states[s][p_idx]
                    start, end = meta["start"], meta["end"]
                    if start >= end:
                        continue

                    p_slice = p_flat[start:end]
                    g_slice = g_flat[start:end]
                    exp_avg = meta["exp_avg"]
                    exp_avg_sq = meta["exp_avg_sq"]

                    if self.weight_decay > 0.0:
                        p_slice.mul_(1.0 - self.lr * self.weight_decay)

                    exp_avg.mul_(b1).add_(g_slice, alpha=1.0 - b1)
                    exp_avg_sq.mul_(b2).addcmul_(g_slice, g_slice, value=1.0 - b2)

                    denom = (exp_avg_sq.sqrt() / math.sqrt(bc2)).add_(self.eps)
                    step_size = self.lr / bc1
                    p_slice.addcdiv_(exp_avg, denom, value=-step_size)

    def get_shard_memory_bytes(self, shard_idx: int) -> int:
        if shard_idx < 0 or shard_idx >= self.zero_shards:
            raise IndexError("Invalid shard index")
        total = 0
        for meta in self.shard_states[shard_idx].values():
            total += meta["exp_avg"].nbytes + meta["exp_avg_sq"].nbytes
        return total

    def state_dict(self) -> Dict[str, Any]:
        return {
            "step_count": self.step_count,
            "zero_shards": self.zero_shards,
            "shard_states": [
                {
                    p_idx: {
                        "start": meta["start"],
                        "end": meta["end"],
                        "exp_avg": meta["exp_avg"].cpu().clone(),
                        "exp_avg_sq": meta["exp_avg_sq"].cpu().clone(),
                    }
                    for p_idx, meta in shard.items()
                }
                for shard in self.shard_states
            ],
        }

    def load_state_dict(self, state: Dict[str, Any]):
        self.step_count = state["step_count"]
        saved_shards = state["shard_states"]
        for s in range(min(self.zero_shards, len(saved_shards))):
            for p_idx, meta in saved_shards[s].items():
                if p_idx in self.shard_states[s]:
                    self.shard_states[s][p_idx]["exp_avg"].copy_(meta["exp_avg"])
                    self.shard_states[s][p_idx]["exp_avg_sq"].copy_(meta["exp_avg_sq"])


class DistributedEngine:
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.device = torch.device(config.device)
        self._validate_config()

        # Build pipeline stages
        self.stages: List[PipelineStage] = [
            PipelineStage(
                stage_idx=i,
                pp_size=config.pp_size,
                vocab_size=config.vocab_size,
                model_dim=config.model_dim,
                hidden_dim=config.hidden_dim,
                num_layers=config.num_layers,
                tp_size=config.tp_size,
            ).to(self.device)
            for i in range(config.pp_size)
        ]

        # Build sharded optimizer for each stage
        self.optimizers: List[ShardedOptimizer] = [
            ShardedOptimizer(
                stage.parameters(),
                lr=config.learning_rate,
                weight_decay=config.weight_decay,
                zero_shards=config.zero_shards,
            )
            for stage in self.stages
        ]

    def _validate_config(self):
        if self.config.batch_size % self.config.micro_batch_size != 0:
            raise ValueError(
                f"batch_size ({self.config.batch_size}) must be divisible by micro_batch_size ({self.config.micro_batch_size})"
            )
        computed_accum = self.config.batch_size // self.config.micro_batch_size
        if computed_accum != self.config.gradient_accumulation_steps:
            raise ValueError(
                f"gradient_accumulation_steps ({self.config.gradient_accumulation_steps}) "
                f"does not match batch_size / micro_batch_size ({computed_accum})"
            )

    def train_step(self, step: int, tokens: torch.Tensor, targets: torch.Tensor) -> StepMetrics:
        start_time = time.perf_counter()
        tokens = tokens.to(self.device)
        targets = targets.to(self.device)

        batch_size = tokens.size(0)
        micro_size = self.config.micro_batch_size
        num_mbs = self.config.gradient_accumulation_steps

        for opt in self.optimizers:
            opt.zero_grad()

        total_loss = 0.0

        for mb in range(num_mbs):
            mb_tokens = tokens[mb * micro_size : (mb + 1) * micro_size]
            mb_targets = targets[mb * micro_size : (mb + 1) * micro_size]

            # Forward pass across pipeline stages
            activations = [self.stages[0](mb_tokens)]
            inputs_detached = []

            for s in range(1, self.config.pp_size):
                h_in = activations[-1].detach().requires_grad_(True)
                inputs_detached.append(h_in)
                h_out = self.stages[s](h_in)
                activations.append(h_out)

            logits = activations[-1]
            loss = F.cross_entropy(logits.view(-1, self.config.vocab_size), mb_targets.view(-1))
            scaled_loss = loss / num_mbs

            # Backward pass across pipeline stages in reverse
            scaled_loss.backward()
            total_loss += loss.item()

            for s in range(self.config.pp_size - 1, 0, -1):
                grad_in = inputs_detached[s - 1].grad
                activations[s - 1].backward(grad_in)

        # Calculate gradient norm for telemetry
        total_norm_sq = 0.0
        for stage in self.stages:
            for p in stage.parameters():
                if p.grad is not None:
                    total_norm_sq += p.grad.data.norm(2).item() ** 2
        grad_norm = math.sqrt(total_norm_sq)

        # Step sharded optimizers
        for opt in self.optimizers:
            opt.step()

        duration_ms = (time.perf_counter() - start_time) * 1000.0
        avg_loss = total_loss / num_mbs

        return StepMetrics(
            step=step,
            loss=avg_loss,
            grad_norm=grad_norm,
            accumulated_samples=batch_size,
            step_time_ms=duration_ms,
            device=str(self.device),
        )

    def save_checkpoint(self, checkpoint_dir: str, step: int, loss: float) -> CheckpointMetadata:
        os.makedirs(checkpoint_dir, exist_ok=True)
        saved_files = []

        # Save stage weights
        for idx, stage in enumerate(self.stages):
            filename = f"stage_{idx}.pt"
            filepath = os.path.join(checkpoint_dir, filename)
            torch.save(stage.state_dict(), filepath)
            saved_files.append(filename)

        # Save sharded optimizer states
        for idx, opt in enumerate(self.optimizers):
            filename = f"optimizer_{idx}.pt"
            filepath = os.path.join(checkpoint_dir, filename)
            torch.save(opt.state_dict(), filepath)
            saved_files.append(filename)

        metadata = CheckpointMetadata(
            step=step,
            loss=loss,
            tp_size=self.config.tp_size,
            pp_size=self.config.pp_size,
            zero_shards=self.config.zero_shards,
            model_dim=self.config.model_dim,
            saved_files=saved_files,
        )

        meta_path = os.path.join(checkpoint_dir, "metadata.json")
        temp_fd, temp_path = tempfile.mkstemp(dir=checkpoint_dir, suffix=".tmp")
        with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
            f.write(metadata.model_dump_json(indent=2))
        os.replace(temp_path, meta_path)

        return metadata

    def load_checkpoint(self, checkpoint_dir: str) -> CheckpointMetadata:
        meta_path = os.path.join(checkpoint_dir, "metadata.json")
        if not os.path.exists(meta_path):
            raise FileNotFoundError(f"Metadata file not found: {meta_path}")

        with open(meta_path, "r", encoding="utf-8") as f:
            meta_dict = json.load(f)
        metadata = CheckpointMetadata.model_validate(meta_dict)

        # Restore stage weights
        for idx, stage in enumerate(self.stages):
            filepath = os.path.join(checkpoint_dir, f"stage_{idx}.pt")
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Stage checkpoint not found: {filepath}")
            stage.load_state_dict(torch.load(filepath, map_location=self.device, weights_only=True))

        # Restore sharded optimizer states
        for idx, opt in enumerate(self.optimizers):
            filepath = os.path.join(checkpoint_dir, f"optimizer_{idx}.pt")
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Optimizer checkpoint not found: {filepath}")
            opt.load_state_dict(torch.load(filepath, map_location=self.device, weights_only=False))

        return metadata
