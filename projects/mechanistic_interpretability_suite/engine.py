import math
import time
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    from .models import (
        ActivationSummary,
        AttentionAttribution,
        PatchingResult,
        SAEConfig,
        SAEDecompositionResult,
        SuiteReport,
        TransformerConfig,
    )
except (ImportError, ValueError):
    from models import (
        ActivationSummary,
        AttentionAttribution,
        PatchingResult,
        SAEConfig,
        SAEDecompositionResult,
        SuiteReport,
        TransformerConfig,
    )


class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_head = d_model // num_heads

        self.q_proj = nn.Linear(d_model, d_model, bias=False)
        self.k_proj = nn.Linear(d_model, d_model, bias=False)
        self.v_proj = nn.Linear(d_model, d_model, bias=False)
        self.out_proj = nn.Linear(d_model, d_model, bias=False)

    def forward(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        batch_size, seq_len, _ = x.shape
        q = (
            self.q_proj(x)
            .view(batch_size, seq_len, self.num_heads, self.d_head)
            .transpose(1, 2)
        )
        k = (
            self.k_proj(x)
            .view(batch_size, seq_len, self.num_heads, self.d_head)
            .transpose(1, 2)
        )
        v = (
            self.v_proj(x)
            .view(batch_size, seq_len, self.num_heads, self.d_head)
            .transpose(1, 2)
        )

        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.d_head)
        mask = torch.triu(
            torch.ones(seq_len, seq_len, device=x.device), diagonal=1
        ).bool()
        scores = scores.masked_fill(mask.unsqueeze(0).unsqueeze(0), -1e9)
        attn_pattern = F.softmax(scores, dim=-1)

        attn_out = torch.matmul(attn_pattern, v)
        attn_out = (
            attn_out.transpose(1, 2)
            .contiguous()
            .view(batch_size, seq_len, self.d_model)
        )
        attn_out = self.out_proj(attn_out)
        return attn_out, attn_pattern, v


class TransformerBlock(nn.Module):
    def __init__(self, d_model: int, num_heads: int, d_mlp: int):
        super().__init__()
        self.attn = MultiHeadAttention(d_model, num_heads)
        self.mlp = nn.Sequential(
            nn.Linear(d_model, d_mlp),
            nn.GELU(),
            nn.Linear(d_mlp, d_model),
        )
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)

    def forward(
        self,
        x: torch.Tensor,
        layer_idx: int,
        cache: Optional[Dict[str, torch.Tensor]] = None,
        patch_dict: Optional[Dict[Tuple[str, int, Optional[int]], torch.Tensor]] = None,
    ) -> torch.Tensor:
        resid_pre = x
        if patch_dict:
            resid_pre = apply_patch(resid_pre, "resid_pre", layer_idx, patch_dict)
        if cache is not None:
            cache[f"resid_pre_{layer_idx}"] = resid_pre.detach()

        normed1 = self.ln1(resid_pre)
        attn_out, attn_pattern, v_act = self.attn(normed1)

        if patch_dict:
            attn_out = apply_patch(attn_out, "attn_out", layer_idx, patch_dict)
        if cache is not None:
            cache[f"attn_pattern_{layer_idx}"] = attn_pattern.detach()
            cache[f"attn_v_{layer_idx}"] = v_act.detach()
            cache[f"attn_out_{layer_idx}"] = attn_out.detach()

        resid_mid = resid_pre + attn_out
        normed2 = self.ln2(resid_mid)
        mlp_out = self.mlp(normed2)

        if patch_dict:
            mlp_out = apply_patch(mlp_out, "mlp_out", layer_idx, patch_dict)
        if cache is not None:
            cache[f"mlp_out_{layer_idx}"] = mlp_out.detach()

        resid_post = resid_mid + mlp_out
        if patch_dict:
            resid_post = apply_patch(resid_post, "resid_post", layer_idx, patch_dict)
        if cache is not None:
            cache[f"resid_post_{layer_idx}"] = resid_post.detach()

        return resid_post


class SimpleTransformer(nn.Module):
    def __init__(self, cfg: TransformerConfig):
        super().__init__()
        self.cfg = cfg
        self.tok_embed = nn.Embedding(cfg.vocab_size, cfg.d_model)
        self.pos_embed = nn.Embedding(cfg.max_seq_len, cfg.d_model)
        self.blocks = nn.ModuleList(
            [
                TransformerBlock(cfg.d_model, cfg.num_heads, cfg.d_mlp)
                for _ in range(cfg.num_layers)
            ]
        )
        self.ln_final = nn.LayerNorm(cfg.d_model)
        self.unembed = nn.Linear(cfg.d_model, cfg.vocab_size, bias=False)

    def forward(
        self,
        input_ids: torch.Tensor,
        cache: Optional[Dict[str, torch.Tensor]] = None,
        patch_dict: Optional[Dict[Tuple[str, int, Optional[int]], torch.Tensor]] = None,
    ) -> torch.Tensor:
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)
        x = self.tok_embed(input_ids) + self.pos_embed(positions)

        for layer_idx, block in enumerate(self.blocks):
            x = block(x, layer_idx=layer_idx, cache=cache, patch_dict=patch_dict)

        x_norm = self.ln_final(x)
        logits = self.unembed(x_norm)
        return logits


def apply_patch(
    tensor: torch.Tensor,
    component: str,
    layer_idx: int,
    patch_dict: Dict[Tuple[str, int, Optional[int]], torch.Tensor],
) -> torch.Tensor:
    # Check for whole-sequence patch
    if (component, layer_idx, None) in patch_dict:
        tensor = patch_dict[(component, layer_idx, None)]
    # Check for position-specific patches
    for (comp, l, pos), patch_val in patch_dict.items():
        if comp == component and l == layer_idx and pos is not None:
            tensor = tensor.clone()
            tensor[:, pos, :] = patch_val[:, pos, :]
    return tensor


def run_with_cache(
    model: SimpleTransformer,
    input_ids: torch.Tensor,
    patch_dict: Optional[Dict[Tuple[str, int, Optional[int]], torch.Tensor]] = None,
) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
    cache: Dict[str, torch.Tensor] = {}
    logits = model(input_ids, cache=cache, patch_dict=patch_dict)
    return logits, cache


def summarize_cache(cache: Dict[str, torch.Tensor]) -> List[ActivationSummary]:
    summaries = []
    for key, tensor in cache.items():
        parts = key.rsplit("_", 1)
        comp = parts[0]
        layer = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        mean_val = float(tensor.mean().item())
        std_val = float(tensor.std().item()) if tensor.numel() > 1 else 0.0
        l2_val = float(torch.linalg.vector_norm(tensor.float()).item())
        summaries.append(
            ActivationSummary(
                component=comp,
                layer=layer,
                shape=list(tensor.shape),
                mean=round(mean_val, 4),
                std=round(std_val, 4),
                l2_norm=round(l2_val, 4),
            )
        )
    return summaries


def compute_attention_attribution(
    model: SimpleTransformer,
    input_ids: torch.Tensor,
    target_token_id: Optional[int] = None,
) -> List[AttentionAttribution]:
    _, cache = run_with_cache(model, input_ids)
    seq_len = input_ids.size(1)
    target_idx = seq_len - 1
    attributions = []

    for layer_idx in range(model.cfg.num_layers):
        attn_pattern = cache[f"attn_pattern_{layer_idx}"][0]  # [num_heads, seq, seq]
        v_act = cache[f"attn_v_{layer_idx}"][0]  # [num_heads, seq, d_head]
        block = model.blocks[layer_idx]
        d_head = model.cfg.d_model // model.cfg.num_heads

        for head_idx in range(model.cfg.num_heads):
            # Out proj weight for this head: [d_model, d_head]
            w_o_head = block.attn.out_proj.weight[:, head_idx * d_head : (head_idx + 1) * d_head]
            for src_idx in range(seq_len):
                weight = float(attn_pattern[head_idx, target_idx, src_idx].item())
                head_contrib = torch.matmul(w_o_head, v_act[head_idx, src_idx]) * weight

                if target_token_id is not None:
                    # Dot product with target unembedding direction
                    unembed_vec = model.unembed.weight[target_token_id]
                    score = float(torch.dot(head_contrib, unembed_vec).item())
                else:
                    score = float(torch.linalg.vector_norm(head_contrib).item())

                attributions.append(
                    AttentionAttribution(
                        layer=layer_idx,
                        head=head_idx,
                        source_idx=src_idx,
                        target_idx=target_idx,
                        source_token=str(input_ids[0, src_idx].item()),
                        target_token=str(input_ids[0, target_idx].item()),
                        attention_weight=round(weight, 4),
                        attribution_score=round(score, 4),
                    )
                )

    attributions.sort(key=lambda a: abs(a.attribution_score), reverse=True)
    return attributions


class SparseAutoencoder(nn.Module):
    def __init__(self, d_model: int, d_sae: int):
        super().__init__()
        self.encoder = nn.Linear(d_model, d_sae)
        self.decoder = nn.Linear(d_sae, d_model, bias=False)
        self.dec_bias = nn.Parameter(torch.zeros(d_model))

        with torch.no_grad():
            self.decoder.weight.data = F.normalize(self.decoder.weight.data, p=2, dim=0)

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        return F.relu(self.encoder(x - self.dec_bias))

    def decode(self, f: torch.Tensor) -> torch.Tensor:
        return self.decoder(f) + self.dec_bias

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        f = self.encode(x)
        x_rec = self.decode(f)
        return x_rec, f


def train_sae(
    sae: SparseAutoencoder,
    activations: torch.Tensor,
    steps: int = 40,
    lr: float = 1e-3,
    l1_coeff: float = 1e-3,
) -> List[float]:
    optimizer = torch.optim.Adam(sae.parameters(), lr=lr)
    losses = []
    x = activations.reshape(-1, activations.size(-1)).detach()

    for _ in range(steps):
        optimizer.zero_grad()
        x_rec, f = sae(x)
        mse_loss = F.mse_loss(x_rec, x)
        l1_loss = l1_coeff * f.sum(dim=-1).mean()
        loss = mse_loss + l1_loss
        loss.backward()
        optimizer.step()

        # Keep decoder columns normalized
        with torch.no_grad():
            sae.decoder.weight.data = F.normalize(sae.decoder.weight.data, p=2, dim=0)
        losses.append(float(loss.item()))

    return losses


def decompose_features(
    sae: SparseAutoencoder, activations: torch.Tensor, top_k: int = 5
) -> SAEDecompositionResult:
    x = activations.reshape(-1, activations.size(-1)).detach()
    x_rec, f = sae(x)

    mse = float(F.mse_loss(x_rec, x).item())
    total_variance = float(torch.var(x).item()) + 1e-9
    residual_variance = float(torch.var(x - x_rec).item())
    explained_variance = max(0.0, 1.0 - (residual_variance / total_variance))

    active_mask = (f > 1e-4).float()
    l0_sparsity = float(active_mask.sum(dim=-1).mean().item())

    mean_activations = f.mean(dim=0)
    top_vals, top_indices = torch.topk(mean_activations, k=min(top_k, f.size(-1)))

    return SAEDecompositionResult(
        l0_sparsity=round(l0_sparsity, 2),
        reconstruction_mse=round(mse, 6),
        explained_variance=round(explained_variance, 4),
        top_feature_indices=[int(idx) for idx in top_indices.tolist()],
        top_feature_activations=[round(float(v), 4) for v in top_vals.tolist()],
    )


def run_activation_patching(
    model: SimpleTransformer,
    clean_tokens: torch.Tensor,
    corrupted_tokens: torch.Tensor,
    target_token_id: int,
    distractor_token_id: int,
    components: Optional[List[str]] = None,
    positions: Optional[List[int]] = None,
) -> List[PatchingResult]:
    if components is None:
        components = ["resid_pre", "attn_out", "mlp_out", "resid_post"]

    clean_logits, clean_cache = run_with_cache(model, clean_tokens)
    corrupted_logits, _ = run_with_cache(model, corrupted_tokens)

    def logit_diff(logits: torch.Tensor) -> float:
        return float(
            (logits[0, -1, target_token_id] - logits[0, -1, distractor_token_id]).item()
        )

    clean_metric = logit_diff(clean_logits)
    corrupted_metric = logit_diff(corrupted_logits)
    denom = clean_metric - corrupted_metric
    if abs(denom) < 1e-6:
        denom = 1e-6

    if positions is None:
        positions = [None] + list(range(clean_tokens.size(1)))

    results = []
    for layer in range(model.cfg.num_layers):
        for comp in components:
            for pos in positions:
                cache_key = f"{comp}_{layer}"
                if cache_key not in clean_cache:
                    continue
                patch_dict = {(comp, layer, pos): clean_cache[cache_key]}
                patched_logits, _ = run_with_cache(
                    model, corrupted_tokens, patch_dict=patch_dict
                )
                patched_metric = logit_diff(patched_logits)
                recovery = (patched_metric - corrupted_metric) / denom

                results.append(
                    PatchingResult(
                        layer=layer,
                        component=comp,
                        position=pos,
                        clean_metric=round(clean_metric, 4),
                        corrupted_metric=round(corrupted_metric, 4),
                        patched_metric=round(patched_metric, 4),
                        recovery_rate=round(recovery, 4),
                    )
                )

    results.sort(key=lambda r: abs(r.recovery_rate), reverse=True)
    return results


def run_mechanistic_suite(
    model_cfg: Optional[TransformerConfig] = None,
    sae_cfg: Optional[SAEConfig] = None,
) -> SuiteReport:
    start_time = time.perf_counter()
    if model_cfg is None:
        model_cfg = TransformerConfig(vocab_size=50, d_model=32, num_layers=2, num_heads=4)
    if sae_cfg is None:
        sae_cfg = SAEConfig(d_model=model_cfg.d_model, d_sae=128)

    torch.manual_seed(42)
    model = SimpleTransformer(model_cfg)
    model.eval()

    clean_tokens = torch.tensor([[5, 12, 19, 23]], dtype=torch.long)
    corrupted_tokens = torch.tensor([[5, 12, 31, 23]], dtype=torch.long)
    target_tok = 40
    distractor_tok = 41

    _, cache = run_with_cache(model, clean_tokens)
    attributions = compute_attention_attribution(model, clean_tokens, target_token_id=target_tok)

    resid_acts = cache["resid_post_0"]
    sae = SparseAutoencoder(sae_cfg.d_model, sae_cfg.d_sae)
    train_sae(sae, resid_acts, steps=25, lr=sae_cfg.lr, l1_coeff=sae_cfg.l1_coeff)
    sae_summary = decompose_features(sae, resid_acts, top_k=5)

    patch_results = run_activation_patching(
        model,
        clean_tokens,
        corrupted_tokens,
        target_token_id=target_tok,
        distractor_token_id=distractor_tok,
        components=["resid_pre", "attn_out", "resid_post"],
        positions=[None, 2],
    )

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    return SuiteReport(
        transformer_config=model_cfg,
        cached_layers=model_cfg.num_layers,
        top_attention_attributions=attributions[:5],
        sae_summary=sae_summary,
        causal_patch_results=patch_results[:5],
        latency_ms=round(elapsed_ms, 2),
    )
