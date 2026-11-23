# Distributed LLM Training Infrastructure

High-performance, minimal distributed LLM training infrastructure implementing:
- **PyTorch FSDP / DeepSpeed ZeRO-1 Style Sharded Optimizer States** (reducing per-rank optimizer state memory by $1/N$).
- **Megatron-LM Style Tensor Parallelism (TP)** with column-parallel and row-parallel linear layers and all-reduce sum.
- **Pipeline Parallelism (PP)** with microbatch stage forward activation propagation and backward activation gradient flow.
- **Gradient Accumulation** over microbatches before optimizer stepping.
- **Crash Checkpoint Recovery** with atomic checkpoint serialization, deterministic state resumption, and step recovery.

---

## Architecture Overview

```
                      Global Batch (Batch Size = B)
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
      Microbatch 0                              Microbatch 1 ... (M microbatches)
              │                                         │
┌─────────────▼──────────────┐             ┌────────────▼──────────────┐
│  Pipeline Stage 0          │             │  Pipeline Stage 0         │
│  - Embedding               │             │  - Embedding              │
│  - TP Blocks (Column + Row)│             │  - TP Blocks (Column + Row│
└─────────────┬──────────────┘             └────────────┬──────────────┘
              │ Activations                             │ Activations
┌─────────────▼──────────────┐             ┌────────────▼──────────────┐
│  Pipeline Stage 1          │             │  Pipeline Stage 1         │
│  - TP Blocks (Column + Row)│             │  - TP Blocks (Column + Row│
│  - LayerNorm & LM Head     │             │  - LayerNorm & LM Head    │
└─────────────┬──────────────┘             └────────────┬──────────────┘
              │ Scaled Loss                             │ Scaled Loss
              ▼                                         ▼
      Stage 1 Backward                          Stage 1 Backward
              │ Activation Gradients                    │ Activation Gradients
      Stage 0 Backward                          Stage 0 Backward
              │                                         │
              └────────────────────┬────────────────────┘
                                   │ (Accumulate Gradients across microbatches)
                                   ▼
                   Sharded Optimizer Step (ZeRO-1)
                   - Rank 0: updates param slice 0
                   - Rank 1: updates param slice 1
                   (50% - 75%+ optimizer state memory savings)
```

### 1. Tensor Parallelism (TP)
- **ColumnParallelLinear**: Weights partitioned column-wise across TP ranks ($W_1 \in \mathbb{R}^{d_{in} \times (d_{out}/TP)}$). Generates split activations with no inter-rank communication.
- **RowParallelLinear**: Weights partitioned row-wise ($W_2 \in \mathbb{R}^{(d_{in}/TP) \times d_{out}}$).
- **All-Reduce Sum**: The outputs of row-parallel shards are summed across ranks:
  $$\text{Output} = \sum_{r=0}^{TP-1} X_r W_{2, r}^T + b$$
  This matches single-device dense MLP execution to floating-point precision.

### 2. Pipeline Parallelism (PP) & Gradient Accumulation
- The model is split into sequential stages across PP ranks.
- A global batch of size $B$ is split into $K$ microbatches of size $M = B / K$.
- Forward pass propagates intermediate tensor activations from Stage $s \to s+1$.
- Loss is scaled by $1 / K$ and backpropagated from Stage $s+1 \to s$ using PyTorch autograd activation hooks.
- Gradients naturally accumulate on each stage's parameters before taking an optimizer step.

### 3. ZeRO-1 / FSDP Optimizer Sharding
- First ($m$) and second ($v$) moment buffers in AdamW are partitioned evenly across `zero_shards`.
- Shard $s$ allocates and updates only its slice $[s \cdot C : (s+1) \cdot C]$.
- Memory reduction:
  $$\text{Per-rank Optimizer Memory} = \frac{1}{\text{zero\_shards}} \times \text{Standard Optimizer Memory}$$

### 4. Crash Checkpoint Recovery
- Checkpoint persistence includes stage model weights, sharded optimizer states ($m, v$, step counter), and metadata.
- Written using atomic rename operations to prevent file corruption during sudden crashes.
- Verification ensures recovered training continues with exact deterministic loss and gradient trajectories.

---

## Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    participant D as Driver / DataLoader
    participant S0 as Pipeline Stage 0 (TP Embedding/Layers)
    participant S1 as Pipeline Stage 1 (TP Layers/Head)
    participant Opt as ZeRO Sharded Optimizer
    participant Disk as Checkpoint Store

    loop For each microbatch in batch
        D->>S0: Forward(tokens_mb)
        S0->>S1: Send intermediate activations
        S1->>S1: Forward(activations) -> Logits & Loss
        S1->>S1: Backward(scaled_loss) -> Stage 1 Param Grads
        S1-->>S0: Backward(activation_grads) -> Stage 0 Param Grads
    end

    Note over S0,S1: Microbatch Gradients Accumulated
    S0->>Opt: Step() on slice 0 & slice 1
    S1->>Opt: Step() on slice 0 & slice 1
    Opt-->>S0: Synchronize updated parameter slices
    Opt-->>S1: Synchronize updated parameter slices
    Opt->>Opt: zero_grad()

    opt Node Crash & Checkpoint Recovery
        S0->>Disk: Save stage_0.pt
        S1->>Disk: Save stage_1.pt
        Opt->>Disk: Save optimizer_shards.pt & metadata.json
        Note over S0,S1: [CRASH SIMULATED]
        Disk-->>S0: Load stage_0.pt
        Disk-->>S1: Load stage_1.pt
        Disk-->>Opt: Load optimizer_shards.pt
        Note over S0,S1: Resumed deterministic training
    end
```

---

## CLI Driver & Benchmark

Run the command-line benchmark with default settings (includes automatic crash and recovery simulation):

```powershell
python -m projects.distributed_llm_training_infra.main --steps 8 --simulate-crash-at 5
```

### CLI Options

| Argument | Type | Default | Description |
|---|---|---|---|
| `--steps` | int | 10 | Total training steps |
| `--batch-size` | int | 8 | Global batch size |
| `--micro-batch-size` | int | 2 | Microbatch size for pipelining |
| `--model-dim` | int | 64 | Model hidden dimension |
| `--hidden-dim` | int | 128 | Intermediate MLP dimension |
| `--vocab-size` | int | 256 | Vocabulary size |
| `--num-layers` | int | 4 | Number of layers |
| `--tp-size` | int | 2 | Tensor parallel degree |
| `--pp-size` | int | 2 | Pipeline parallel stages |
| `--zero-shards` | int | 2 | ZeRO optimizer state shards |
| `--lr` | float | 1e-3 | Learning rate |
| `--checkpoint-dir` | str | `./checkpoints` | Checkpoint save directory |
| `--simulate-crash-at` | int | 5 | Step to trigger crash simulation & restore |

---

## Test Specifications

Pytest suite: `projects/distributed_llm_training_infra/test_engine.py` (9 tests, 100% passing):

1. `test_column_row_parallel_math_equivalence`: Verifies mathematical equivalence between TP column/row decomposition with All-Reduce and dense single-device Linear layers.
2. `test_tp_dimension_validation`: Confirms `ValueError` is raised when feature dimensions are not divisible by `tp_size`.
3. `test_sharded_optimizer_memory_reduction`: Asserts optimizer state memory scales linearly ($1/N$) across shards and verifies AdamW parameter updates.
4. `test_config_validation`: Validates batch size, microbatch size, and gradient accumulation step alignment.
5. `test_distributed_training_loss_reduction`: Confirms multi-step end-to-end training converges and reduces loss.
6. `test_crash_checkpoint_recovery`: Tests atomic saving, node crash simulation, state re-loading, and verified deterministic post-recovery loss equivalence.
7. `test_missing_checkpoint_raises`: Tests handling of missing checkpoint files with `FileNotFoundError`.
8. `test_invalid_shard_memory_index`: Tests shard index bounds checking.
9. `test_multi_stage_pipeline_forward_backward`: Tests multi-stage ($PP \ge 3$) pipeline parallelism gradient flow.

Run tests:
```powershell
pytest projects/distributed_llm_training_infra/test_engine.py -v
```
