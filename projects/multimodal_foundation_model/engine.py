import math
import time
from typing import Any, Dict, List, Optional, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    from .models import EvaluationResult, InferenceOutput, ModelConfig, VisualReasoningSample
except ImportError:
    from models import EvaluationResult, InferenceOutput, ModelConfig, VisualReasoningSample


class SimpleTokenizer:
    """Character/byte level tokenizer for self-contained execution."""

    def __init__(self, vocab_size: int = 256):
        self.pad_token = "<pad>"
        self.bos_token = "<bos>"
        self.eos_token = "<eos>"
        self.unk_token = "<unk>"

        self.special_tokens = [self.pad_token, self.bos_token, self.eos_token, self.unk_token]
        self.pad_id = 0
        self.bos_id = 1
        self.eos_id = 2
        self.unk_id = 3

        # Populate basic printable ascii
        chars = [chr(i) for i in range(32, 127)]
        self.vocab = list(self.special_tokens) + chars
        if len(self.vocab) > vocab_size:
            self.vocab = self.vocab[:vocab_size]
        else:
            # Pad vocabulary if needed
            while len(self.vocab) < vocab_size:
                self.vocab.append(f"<extra_{len(self.vocab)}>")

        self.token_to_id = {tok: idx for idx, tok in enumerate(self.vocab)}
        self.id_to_token = {idx: tok for idx, tok in enumerate(self.vocab)}

    def encode(self, text: str, add_bos: bool = True, add_eos: bool = False) -> List[int]:
        ids = []
        if add_bos:
            ids.append(self.bos_id)
        for ch in text:
            ids.append(self.token_to_id.get(ch, self.unk_id))
        if add_eos:
            ids.append(self.eos_id)
        return ids

    def decode(self, token_ids: List[int], skip_special: bool = True) -> str:
        chars = []
        for tid in token_ids:
            if skip_special and tid in (self.pad_id, self.bos_id, self.eos_id, self.unk_id):
                continue
            chars.append(self.id_to_token.get(tid, ""))
        return "".join(chars)


class PatchEmbedding(nn.Module):
    """Vision Transformer patch projection."""

    def __init__(self, image_size: int = 32, patch_size: int = 8, in_channels: int = 3, embed_dim: int = 64):
        super().__init__()
        self.image_size = image_size
        self.patch_size = patch_size
        self.num_patches = (image_size // patch_size) ** 2
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
        self.pos_embed = nn.Parameter(torch.zeros(1, self.num_patches, embed_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, 3, H, W)
        x = self.proj(x)  # (B, embed_dim, H/P, W/P)
        x = x.flatten(2).transpose(1, 2)  # (B, num_patches, embed_dim)
        x = x + self.pos_embed
        return x


class TransformerBlock(nn.Module):
    """Standard pre-LayerNorm Transformer Block."""

    def __init__(self, dim: int, num_heads: int, mlp_dim: int, dropout: float = 0.0):
        super().__init__()
        self.ln1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(embed_dim=dim, num_heads=num_heads, batch_first=True, dropout=dropout)
        self.ln2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, mlp_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_dim, dim),
            nn.Dropout(dropout),
        )

    def forward(self, x: torch.Tensor, attn_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        norm_x = self.ln1(x)
        attn_out, _ = self.attn(norm_x, norm_x, norm_x, attn_mask=attn_mask)
        x = x + attn_out
        x = x + self.mlp(self.ln2(x))
        return x


class VisionEncoder(nn.Module):
    """ViT visual encoder."""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.patch_embed = PatchEmbedding(
            image_size=config.image_size,
            patch_size=config.patch_size,
            in_channels=3,
            embed_dim=config.vision_dim,
        )
        self.blocks = nn.ModuleList([
            TransformerBlock(config.vision_dim, config.vision_heads, config.mlp_dim, config.dropout)
            for _ in range(config.vision_layers)
        ])
        self.ln = nn.LayerNorm(config.vision_dim)

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        x = self.patch_embed(images)
        for block in self.blocks:
            x = block(x)
        return self.ln(x)


class CrossModalProjector(nn.Module):
    """2-layer MLP projection mapping visual tokens to language decoder space."""

    def __init__(self, vision_dim: int, text_dim: int, mlp_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(vision_dim, mlp_dim),
            nn.GELU(),
            nn.Linear(mlp_dim, text_dim),
        )

    def forward(self, visual_tokens: torch.Tensor) -> torch.Tensor:
        return self.net(visual_tokens)


class CausalDecoder(nn.Module):
    """Causal Transformer Language Decoder."""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config
        self.token_embed = nn.Embedding(config.vocab_size, config.text_dim)
        self.pos_embed = nn.Embedding(config.max_seq_len, config.text_dim)
        self.blocks = nn.ModuleList([
            TransformerBlock(config.text_dim, config.text_heads, config.mlp_dim, config.dropout)
            for _ in range(config.text_layers)
        ])
        self.ln_f = nn.LayerNorm(config.text_dim)
        self.lm_head = nn.Linear(config.text_dim, config.vocab_size, bias=False)

    def forward(self, full_embeddings: torch.Tensor, attn_mask: torch.Tensor) -> torch.Tensor:
        x = full_embeddings
        for block in self.blocks:
            x = block(x, attn_mask=attn_mask)
        x = self.ln_f(x)
        return self.lm_head(x)


class MultimodalFoundationModel(nn.Module):
    """End-to-end Vision-Language Foundation Model."""

    def __init__(self, config: Optional[ModelConfig] = None):
        super().__init__()
        self.config = config or ModelConfig()
        self.vision_encoder = VisionEncoder(self.config)
        self.projector = CrossModalProjector(self.config.vision_dim, self.config.text_dim, self.config.mlp_dim)
        self.decoder = CausalDecoder(self.config)

    def _build_prefix_causal_mask(self, num_vision: int, num_text: int, device: torch.device) -> torch.Tensor:
        seq_len = num_vision + num_text
        mask = torch.triu(torch.full((seq_len, seq_len), float("-inf"), device=device), diagonal=1)
        # Visual tokens can attend to each other bidirectionally
        mask[:num_vision, :num_vision] = 0.0
        return mask

    def forward(
        self,
        images: torch.Tensor,
        input_ids: torch.Tensor,
        targets: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        batch_size = images.shape[0]
        device = images.device

        # 1. Vision encode & project
        v_tokens = self.vision_encoder(images)  # (B, N_v, vision_dim)
        v_tokens = self.projector(v_tokens)     # (B, N_v, text_dim)
        n_v = v_tokens.shape[1]

        # 2. Text embeddings
        n_t = input_ids.shape[1]
        t_tokens = self.decoder.token_embed(input_ids)  # (B, N_t, text_dim)

        # 3. Concatenate multimodal sequence
        combined = torch.cat([v_tokens, t_tokens], dim=1)  # (B, N_v + N_t, text_dim)
        seq_len = combined.shape[1]
        if seq_len > self.config.max_seq_len:
            raise ValueError(
                f"Combined sequence length {seq_len} exceeds max_seq_len {self.config.max_seq_len}"
            )

        pos_ids = torch.arange(seq_len, device=device).unsqueeze(0).expand(batch_size, -1)
        combined = combined + self.decoder.pos_embed(pos_ids)

        # 4. Decoder attention mask
        mask = self._build_prefix_causal_mask(n_v, n_t, device)

        # 5. Decode
        logits = self.decoder(combined, attn_mask=mask)

        # We take logits corresponding to text tokens
        text_logits = logits[:, n_v:, :]  # (B, N_t, vocab_size)

        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                text_logits.reshape(-1, self.config.vocab_size),
                targets.reshape(-1),
                ignore_index=-100,
            )

        return text_logits, loss

    @torch.no_grad()
    def generate(
        self,
        images: torch.Tensor,
        prompt_ids: List[int],
        tokenizer: SimpleTokenizer,
        max_new_tokens: int = 16,
        temperature: float = 1.0,
    ) -> InferenceOutput:
        self.eval()
        start_time = time.perf_counter()
        device = images.device

        curr_ids = list(prompt_ids)
        generated_ids = []

        for _ in range(max_new_tokens):
            input_tensor = torch.tensor([curr_ids], dtype=torch.long, device=device)
            logits, _ = self.forward(images, input_tensor)
            next_token_logits = logits[0, -1, :]

            if temperature <= 0.0 or temperature == 1.0:
                next_token = int(torch.argmax(next_token_logits).item())
            else:
                probs = F.softmax(next_token_logits / temperature, dim=-1)
                next_token = int(torch.multinomial(probs, num_samples=1).item())

            if next_token == tokenizer.eos_id:
                break

            curr_ids.append(next_token)
            generated_ids.append(next_token)

        latency = (time.perf_counter() - start_time) * 1000.0
        text = tokenizer.decode(generated_ids)
        return InferenceOutput(
            generated_text=text,
            generated_token_ids=generated_ids,
            latency_ms=latency,
        )

    @torch.no_grad()
    def score_option(
        self,
        image: torch.Tensor,
        prompt_ids: List[int],
        option_ids: List[int],
    ) -> float:
        """Compute average log likelihood score for option continuation."""
        self.eval()
        device = image.device
        if image.dim() == 3:
            image = image.unsqueeze(0)

        full_ids = prompt_ids + option_ids
        input_tensor = torch.tensor([full_ids], dtype=torch.long, device=device)
        logits, _ = self.forward(image, input_tensor)

        # Log probabilities of the option tokens given the preceding context
        opt_len = len(option_ids)
        target_logits = logits[0, len(prompt_ids) - 1 : len(full_ids) - 1, :]
        target_tokens = torch.tensor(option_ids, dtype=torch.long, device=device)

        log_probs = F.log_softmax(target_logits, dim=-1)
        token_log_probs = log_probs.gather(1, target_tokens.unsqueeze(1)).squeeze(1)
        return float(token_log_probs.mean().item())

    def evaluate_reasoning(
        self,
        samples: List[VisualReasoningSample],
        images: torch.Tensor,
        tokenizer: SimpleTokenizer,
    ) -> EvaluationResult:
        """Evaluate multimodal reasoning accuracy over samples."""
        self.eval()
        correct = 0
        predictions = []
        latencies = []

        for idx, sample in enumerate(samples):
            img = images[idx : idx + 1]
            prompt = f"Question: {sample.question}\nAnswer:"
            prompt_ids = tokenizer.encode(prompt, add_bos=True, add_eos=False)

            t0 = time.perf_counter()
            if sample.options:
                # Multiple choice scoring
                scores = []
                for opt in sample.options:
                    opt_ids = tokenizer.encode(" " + opt, add_bos=False, add_eos=False)
                    score = self.score_option(img, prompt_ids, opt_ids)
                    scores.append((score, opt))
                scores.sort(key=lambda x: x[0], reverse=True)
                predicted = scores[0][1]
            else:
                out = self.generate(img, prompt_ids, tokenizer, max_new_tokens=10)
                predicted = out.generated_text.strip()

            latency_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(latency_ms)

            is_correct = (predicted.strip().lower() == sample.ground_truth.strip().lower())
            if is_correct:
                correct += 1

            predictions.append({
                "id": sample.id,
                "question": sample.question,
                "ground_truth": sample.ground_truth,
                "predicted": predicted,
                "correct": is_correct,
                "latency_ms": latency_ms,
            })

        total = len(samples)
        acc = (correct / total) if total > 0 else 0.0
        avg_lat = (sum(latencies) / len(latencies)) if latencies else 0.0

        return EvaluationResult(
            total_samples=total,
            correct_count=correct,
            accuracy=acc,
            avg_latency_ms=avg_lat,
            predictions=predictions,
        )


def create_synthetic_data(num_samples: int = 12, image_size: int = 32) -> Tuple[torch.Tensor, List[VisualReasoningSample]]:
    """Generate synthetic visual reasoning pairs (geometric color/count reasoning)."""
    torch.manual_seed(42)
    images = torch.zeros((num_samples, 3, image_size, image_size), dtype=torch.float32)
    samples: List[VisualReasoningSample] = []

    color_names = ["red", "green", "blue", "yellow"]
    color_rgb = {
        "red": (1.0, 0.0, 0.0),
        "green": (0.0, 1.0, 0.0),
        "blue": (0.0, 0.0, 1.0),
        "yellow": (1.0, 1.0, 0.0),
    }

    for i in range(num_samples):
        # Choose primary color for center patch
        c_idx = i % len(color_names)
        c_name = color_names[c_idx]
        rgb = color_rgb[c_name]

        # Draw background slight noise
        images[i] = torch.rand((3, image_size, image_size)) * 0.1

        # Draw a colored square in the center (12x12)
        start = (image_size - 12) // 2
        end = start + 12
        for c in range(3):
            images[i, c, start:end, start:end] = rgb[c]

        # Shape count: 1 center block, or if i is odd, add another corner block
        extra_block = (i % 2 == 1)
        if extra_block:
            images[i, :, 2:8, 2:8] = 0.8
            count_str = "two"
        else:
            count_str = "one"

        # Create two types of questions: color identification & shape count
        if i % 2 == 0:
            question = "What color is the center patch?"
            options = ["red", "green", "blue", "yellow"]
            gt = c_name
        else:
            question = "How many patches are present?"
            options = ["one", "two", "three"]
            gt = count_str

        samples.append(VisualReasoningSample(
            id=f"sample_{i:03d}",
            question=question,
            options=options,
            ground_truth=gt,
            image_meta={"color": c_name, "extra_block": extra_block},
        ))

    return images, samples


def train_step(
    model: MultimodalFoundationModel,
    optimizer: torch.optim.Optimizer,
    images: torch.Tensor,
    input_ids: torch.Tensor,
    target_ids: torch.Tensor,
) -> float:
    """Execute a single multimodal training step."""
    model.train()
    optimizer.zero_grad()
    _, loss = model(images, input_ids, targets=target_ids)
    if loss is not None:
        loss.backward()
        optimizer.step()
        return float(loss.item())
    return 0.0
