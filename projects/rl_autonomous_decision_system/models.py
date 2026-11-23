from typing import Any
from pydantic import BaseModel, Field


class EnvConfig(BaseModel):
    """Configuration for autonomous decision MDP environment."""
    state_dim: int = Field(default=6, ge=1, description="Dimension of state space")
    action_dim: int = Field(default=5, ge=2, description="Number of discrete actions")
    max_steps: int = Field(default=200, ge=10, description="Maximum steps per episode")
    target_load: float = Field(default=0.5, ge=0.0, le=1.0, description="Target optimal load")
    noise_level: float = Field(default=0.05, ge=0.0, description="Stochastic environment noise std")
    seed: int | None = Field(default=42, description="Random seed")


class RewardShapingConfig(BaseModel):
    """Configuration for potential-based and constraint reward shaping."""
    enable_potential: bool = Field(default=True, description="Enable potential-based reward shaping")
    potential_gamma: float = Field(default=0.99, ge=0.0, le=1.0, description="Discount factor for potential shaping")
    target_load_weight: float = Field(default=2.0, ge=0.0, description="Weight for maintaining optimal load")
    latency_penalty_weight: float = Field(default=1.5, ge=0.0, description="Penalty weight for high latency")
    cost_penalty_weight: float = Field(default=0.8, ge=0.0, description="Penalty weight for operational cost")
    stability_bonus: float = Field(default=0.5, ge=0.0, description="Bonus for action stability")


class PPOConfig(BaseModel):
    """Hyperparameters for Proximal Policy Optimization (PPO) clipped objective."""
    learning_rate: float = Field(default=3e-4, gt=0.0, description="Adam optimizer learning rate")
    gamma: float = Field(default=0.99, ge=0.0, le=1.0, description="Reward discount factor")
    gae_lambda: float = Field(default=0.95, ge=0.0, le=1.0, description="GAE smoothing parameter")
    clip_epsilon: float = Field(default=0.2, gt=0.0, le=1.0, description="PPO surrogate clip ratio epsilon")
    value_coef: float = Field(default=0.5, ge=0.0, description="Value function loss coefficient")
    entropy_coef: float = Field(default=0.01, ge=0.0, description="Entropy regularization bonus coefficient")
    max_grad_norm: float = Field(default=0.5, ge=0.0, description="Gradient clipping norm")
    ppo_epochs: int = Field(default=4, ge=1, description="Optimization epochs per rollout")
    batch_size: int = Field(default=64, ge=4, description="Minibatch size for policy updates")
    target_kl: float = Field(default=0.015, gt=0.0, description="KL divergence threshold for early stopping")
    hidden_dim: int = Field(default=64, ge=8, description="Hidden layer dimension for actor-critic")


class TransitionRecord(BaseModel):
    """Single MDP transition record."""
    state: list[float]
    action: int
    reward: float
    shaped_reward: float
    next_state: list[float]
    value: float
    log_prob: float
    done: bool
    info: dict[str, Any] = Field(default_factory=dict)


class PolicyStabilityMetric(BaseModel):
    """Metrics tracking policy update stability, KL divergence, and clipping."""
    epoch: int = Field(ge=0)
    approx_kl: float = Field(ge=0.0, description="Approximate KL divergence")
    clip_fraction: float = Field(ge=0.0, le=1.0, description="Fraction of updates where ratio was clipped")
    explained_variance: float = Field(description="Explained variance of value function predictions")
    entropy: float = Field(description="Policy distribution entropy")
    policy_loss: float = Field(description="PPO clipped surrogate loss")
    value_loss: float = Field(description="Critic value MSE loss")
    is_stable: bool = Field(description="Whether update remained within stability bounds")
    status: str = Field(default="STABLE", description="Status code: OPTIMAL, STABLE, HIGH_KL_WARNING, HIGH_CLIP")


class TrainingBatchStats(BaseModel):
    """Summary of a training iteration."""
    total_timesteps: int
    mean_raw_reward: float
    mean_shaped_reward: float
    stability: PolicyStabilityMetric


class EvaluationResult(BaseModel):
    """Evaluation benchmark metrics over multiple rollout episodes."""
    episodes: int = Field(ge=1)
    mean_return: float
    std_return: float
    min_return: float
    max_return: float
    mean_episode_length: float
    sla_violations: int = Field(ge=0)
    throughput_steps_per_sec: float = Field(ge=0.0)
