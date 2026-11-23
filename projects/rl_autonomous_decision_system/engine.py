import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions.categorical import Categorical

try:
    from .models import (
        EnvConfig,
        RewardShapingConfig,
        PPOConfig,
        PolicyStabilityMetric,
        EvaluationResult,
        TrainingBatchStats,
        TransitionRecord,
    )
except ImportError:
    from models import (
        EnvConfig,
        RewardShapingConfig,
        PPOConfig,
        PolicyStabilityMetric,
        EvaluationResult,
        TrainingBatchStats,
        TransitionRecord,
    )


class AutonomousDecisionEnv:
    """Gym-style MDP simulator for autonomous cloud resource allocation."""

    ACTION_NAMES = {
        0: "MAINTAIN",
        1: "SCALE_OUT",
        2: "SCALE_IN",
        3: "THROTTLE_TRAFFIC",
        4: "PURGE_CACHE",
    }

    def __init__(self, config: EnvConfig | None = None):
        self.config = config or EnvConfig()
        self.rng = np.random.default_rng(self.config.seed)
        self.current_step = 0
        self.instances = 5
        self.min_instances = 1
        self.max_instances = 10
        self.workload = 0.5
        self.memory = 0.3
        self.state = np.zeros(self.config.state_dim, dtype=np.float32)

    def reset(self, seed: int | None = None) -> tuple[np.ndarray, dict]:
        """Reset environment to initial state."""
        if seed is not None:
            self.rng = np.random.default_rng(seed)
        self.current_step = 0
        self.instances = 5
        self.workload = float(self.rng.uniform(0.3, 0.7))
        self.memory = float(self.rng.uniform(0.2, 0.4))
        self.state = self._build_state()
        return self.state.copy(), {"instances": self.instances}

    def _build_state(self) -> np.ndarray:
        """Construct normalized observation vector."""
        capacity_ratio = self.instances / self.max_instances
        load_factor = self.workload / max(capacity_ratio, 0.1)

        cpu_util = float(np.clip(0.1 + 0.8 * load_factor, 0.0, 1.0))
        p99_latency = float(np.clip(0.15 + 0.7 * (load_factor ** 2), 0.0, 1.0))
        error_rate = float(np.clip(max(0.0, (load_factor - 1.1) * 2.0), 0.0, 1.0))

        obs = np.array(
            [
                self.workload,
                cpu_util,
                self.memory,
                p99_latency,
                error_rate,
                capacity_ratio,
            ],
            dtype=np.float32,
        )
        return obs

    def step(self, action: int) -> tuple[np.ndarray, float, bool, bool, dict]:
        """Execute one MDP action transition."""
        self.current_step += 1

        # Stochastic workload drift
        noise = float(self.rng.normal(0.0, self.config.noise_level))
        drift = 0.05 * np.sin(self.current_step * 0.2)
        self.workload = float(np.clip(self.workload + drift + noise, 0.1, 1.0))

        # Memory leak simulation
        self.memory = float(np.clip(self.memory + 0.01 + 0.02 * self.workload, 0.0, 1.0))

        # Apply action dynamics
        if action == 1:  # SCALE_OUT
            self.instances = min(self.max_instances, self.instances + 1)
        elif action == 2:  # SCALE_IN
            self.instances = max(self.min_instances, self.instances - 1)
        elif action == 3:  # THROTTLE_TRAFFIC
            self.workload = max(0.1, self.workload * 0.75)
        elif action == 4:  # PURGE_CACHE
            self.memory = 0.2

        self.state = self._build_state()
        cpu_util = self.state[1]
        latency = self.state[3]
        error_rate = self.state[4]
        capacity_ratio = self.state[5]

        # Raw operational reward
        throughput_reward = 1.0 * (1.0 - error_rate)
        latency_penalty = -1.5 * latency
        cost_penalty = -0.5 * capacity_ratio
        outage_penalty = -5.0 if error_rate > 0.2 else 0.0

        raw_reward = float(throughput_reward + latency_penalty + cost_penalty + outage_penalty)

        sla_violation = (latency > 0.75) or (error_rate > 0.05)
        terminated = bool(error_rate >= 0.5)  # Severe system failure
        truncated = bool(self.current_step >= self.config.max_steps)

        info = {
            "instances": self.instances,
            "sla_violation": sla_violation,
            "raw_reward": raw_reward,
            "action_name": self.ACTION_NAMES.get(action, "UNKNOWN"),
        }
        return self.state.copy(), raw_reward, terminated, truncated, info


class RewardShaper:
    """Potential-based reward shaping to guarantee policy invariance with fast convergence."""

    def __init__(self, config: RewardShapingConfig | None = None):
        self.config = config or RewardShapingConfig()

    def potential(self, state: np.ndarray) -> float:
        """Potential function Phi(s) over state features."""
        if not self.config.enable_potential:
            return 0.0
        cpu_util = state[1]
        latency = state[3]
        error_rate = state[4]
        capacity = state[5]

        phi = (
            - self.config.target_load_weight * ((cpu_util - 0.5) ** 2)
            - self.config.latency_penalty_weight * latency
            - 3.0 * error_rate
            - self.config.cost_penalty_weight * capacity
        )
        return float(phi)

    def shape(self, state: np.ndarray, raw_reward: float, next_state: np.ndarray, done: bool) -> float:
        """Compute shaped reward R_shaped = R_raw + gamma * Phi(s') - Phi(s)."""
        if not self.config.enable_potential:
            return raw_reward

        phi_curr = self.potential(state)
        phi_next = 0.0 if done else self.potential(next_state)
        f_shaping = (self.config.potential_gamma * phi_next) - phi_curr
        return float(raw_reward + f_shaping)


class RolloutBuffer:
    """Experience rollout buffer for on-policy PPO training with GAE calculation."""

    def __init__(self, capacity: int, state_dim: int):
        self.capacity = capacity
        self.state_dim = state_dim
        self.states = np.zeros((capacity, state_dim), dtype=np.float32)
        self.actions = np.zeros(capacity, dtype=np.int64)
        self.rewards = np.zeros(capacity, dtype=np.float32)
        self.values = np.zeros(capacity, dtype=np.float32)
        self.log_probs = np.zeros(capacity, dtype=np.float32)
        self.dones = np.zeros(capacity, dtype=np.bool_)
        self.advantages = np.zeros(capacity, dtype=np.float32)
        self.returns = np.zeros(capacity, dtype=np.float32)
        self.pos = 0

    def add(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        value: float,
        log_prob: float,
        done: bool,
    ) -> None:
        """Insert transition record into buffer."""
        if self.pos >= self.capacity:
            raise IndexError("RolloutBuffer is full.")
        self.states[self.pos] = state
        self.actions[self.pos] = action
        self.rewards[self.pos] = reward
        self.values[self.pos] = value
        self.log_probs[self.pos] = log_prob
        self.dones[self.pos] = done
        self.pos += 1

    def compute_returns_and_advantages(
        self,
        last_value: float,
        last_done: bool = False,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
    ) -> None:
        """Compute Generalized Advantage Estimation (GAE) and target returns."""
        last_gae = 0.0
        for t in reversed(range(self.pos)):
            next_non_terminal = 1.0 - float(self.dones[t])
            if t == self.pos - 1:
                next_val = last_value
            else:
                next_val = self.values[t + 1]

            delta = self.rewards[t] + gamma * next_val * next_non_terminal - self.values[t]
            last_gae = delta + gamma * gae_lambda * next_non_terminal * last_gae
            self.advantages[t] = last_gae

        self.returns[: self.pos] = self.advantages[: self.pos] + self.values[: self.pos]

    def get_batches(self, batch_size: int):
        """Yield randomized mini-batches over collected rollout transitions."""
        indices = np.random.permutation(self.pos)
        for start_idx in range(0, self.pos, batch_size):
            batch_idx = indices[start_idx : start_idx + batch_size]
            yield (
                torch.from_numpy(self.states[batch_idx]),
                torch.from_numpy(self.actions[batch_idx]),
                torch.from_numpy(self.log_probs[batch_idx]),
                torch.from_numpy(self.advantages[batch_idx]),
                torch.from_numpy(self.returns[batch_idx]),
                torch.from_numpy(self.values[batch_idx]),
            )

    def clear(self) -> None:
        """Reset buffer pointer."""
        self.pos = 0


class ActorCritic(nn.Module):
    """Clean multi-layer perceptron Actor-Critic network."""

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 64):
        super().__init__()
        self.actor = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, action_dim),
        )
        self.critic = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1),
        )

    def get_value(self, state: torch.Tensor) -> torch.Tensor:
        """Estimate state value V(s)."""
        return self.critic(state).squeeze(-1)

    def get_action_and_value(
        self, state: torch.Tensor, action: torch.Tensor | None = None
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        """Compute action, log_prob, distribution entropy, and value estimate."""
        logits = self.actor(state)
        dist = Categorical(logits=logits)
        if action is None:
            action = dist.sample()
        return action, dist.log_prob(action), dist.entropy(), self.critic(state).squeeze(-1)


class PPODecisionEngine:
    """Complete PPO reinforcement learning decision system with stability tracking."""

    def __init__(
        self,
        env_config: EnvConfig | None = None,
        ppo_config: PPOConfig | None = None,
        reward_config: RewardShapingConfig | None = None,
        device: str = "cpu",
    ):
        self.env_config = env_config or EnvConfig()
        self.ppo_config = ppo_config or PPOConfig()
        self.reward_config = reward_config or RewardShapingConfig()
        self.device = torch.device(device)

        self.env = AutonomousDecisionEnv(self.env_config)
        self.reward_shaper = RewardShaper(self.reward_config)
        self.policy = ActorCritic(
            state_dim=self.env_config.state_dim,
            action_dim=self.env_config.action_dim,
            hidden_dim=self.ppo_config.hidden_dim,
        ).to(self.device)

        self.optimizer = optim.Adam(self.policy.parameters(), lr=self.ppo_config.learning_rate)
        self.total_timesteps = 0
        self.stability_history: list[PolicyStabilityMetric] = []

    def select_action(self, state: np.ndarray, deterministic: bool = False) -> tuple[int, float, float]:
        """Select action given observation."""
        with torch.no_grad():
            state_t = torch.from_numpy(state).float().unsqueeze(0).to(self.device)
            logits = self.policy.actor(state_t)
            if deterministic:
                action = int(torch.argmax(logits, dim=-1).item())
                dist = Categorical(logits=logits)
                log_prob = float(dist.log_prob(torch.tensor(action, device=self.device)).item())
            else:
                dist = Categorical(logits=logits)
                action_t = dist.sample()
                action = int(action_t.item())
                log_prob = float(dist.log_prob(action_t).item())
            value = float(self.policy.get_value(state_t).item())
        return action, log_prob, value

    def collect_rollout(self, steps: int) -> tuple[RolloutBuffer, float, float]:
        """Collect steps in environment, shape rewards, and compute GAE advantages."""
        buffer = RolloutBuffer(capacity=steps, state_dim=self.env_config.state_dim)
        obs, _ = self.env.reset()
        raw_rewards: list[float] = []
        shaped_rewards: list[float] = []

        for _ in range(steps):
            action, log_prob, value = self.select_action(obs, deterministic=False)
            next_obs, raw_reward, terminated, truncated, _ = self.env.step(action)
            done = terminated or truncated

            shaped_reward = self.reward_shaper.shape(obs, raw_reward, next_obs, done)
            raw_rewards.append(raw_reward)
            shaped_rewards.append(shaped_reward)

            buffer.add(obs, action, shaped_reward, value, log_prob, done)
            self.total_timesteps += 1

            if done:
                obs, _ = self.env.reset()
            else:
                obs = next_obs

        # Bootstrap value for last state
        with torch.no_grad():
            last_state_t = torch.from_numpy(obs).float().unsqueeze(0).to(self.device)
            last_value = float(self.policy.get_value(last_state_t).item())

        buffer.compute_returns_and_advantages(
            last_value=last_value,
            last_done=done,
            gamma=self.ppo_config.gamma,
            gae_lambda=self.ppo_config.gae_lambda,
        )

        mean_raw = float(np.mean(raw_rewards)) if raw_rewards else 0.0
        mean_shaped = float(np.mean(shaped_rewards)) if shaped_rewards else 0.0
        return buffer, mean_raw, mean_shaped

    def update_policy(self, buffer: RolloutBuffer, epoch_idx: int = 0) -> PolicyStabilityMetric:
        """Train policy with PPO clipped objective and track stability metrics."""
        b_advantages = buffer.advantages[: buffer.pos]
        adv_mean = np.mean(b_advantages)
        adv_std = np.std(b_advantages) + 1e-8

        # Tracked metrics across mini-batches
        approx_kls: list[float] = []
        clip_fractions: list[float] = []
        policy_losses: list[float] = []
        value_losses: list[float] = []
        entropies: list[float] = []

        early_stopped = False

        for _ in range(self.ppo_config.ppo_epochs):
            if early_stopped:
                break
            for b_obs, b_act, b_old_log_probs, b_adv, b_ret, b_old_values in buffer.get_batches(
                self.ppo_config.batch_size
            ):
                b_obs = b_obs.to(self.device)
                b_act = b_act.to(self.device)
                b_old_log_probs = b_old_log_probs.to(self.device)
                b_adv = b_adv.to(self.device)
                b_ret = b_ret.to(self.device)

                # Normalized advantages for mini-batch
                norm_adv = (b_adv - adv_mean) / adv_std

                _, new_log_probs, entropy, new_values = self.policy.get_action_and_value(
                    b_obs, b_act
                )

                log_ratio = new_log_probs - b_old_log_probs
                ratio = torch.exp(log_ratio)

                # PPO Clipped Surrogate Loss
                pg_loss1 = -norm_adv * ratio
                pg_loss2 = -norm_adv * torch.clamp(
                    ratio, 1.0 - self.ppo_config.clip_epsilon, 1.0 + self.ppo_config.clip_epsilon
                )
                policy_loss = torch.max(pg_loss1, pg_loss2).mean()

                # Value loss (Mean Squared Error)
                value_loss = 0.5 * ((new_values - b_ret) ** 2).mean()

                # Entropy bonus
                entropy_bonus = entropy.mean()

                # Total loss
                total_loss = (
                    policy_loss
                    + self.ppo_config.value_coef * value_loss
                    - self.ppo_config.entropy_coef * entropy_bonus
                )

                self.optimizer.zero_grad()
                total_loss.backward()
                nn.utils.clip_grad_norm_(self.policy.parameters(), self.ppo_config.max_grad_norm)
                self.optimizer.step()

                # Approximate KL divergence (Schulman formula)
                approx_kl = float(((ratio - 1.0) - log_ratio).mean().item())
                approx_kls.append(max(0.0, approx_kl))

                # Ratio clipping fraction
                clipped = (ratio < 1.0 - self.ppo_config.clip_epsilon) | (
                    ratio > 1.0 + self.ppo_config.clip_epsilon
                )
                clip_fractions.append(float(clipped.float().mean().item()))

                policy_losses.append(float(policy_loss.item()))
                value_losses.append(float(value_loss.item()))
                entropies.append(float(entropy_bonus.item()))

                # Early stopping check on KL divergence to maintain policy stability
                if approx_kl > 1.5 * self.ppo_config.target_kl:
                    early_stopped = True
                    break

        # Explained variance
        y_true = buffer.returns[: buffer.pos]
        y_pred = buffer.values[: buffer.pos]
        var_y = float(np.var(y_true))
        explained_var = 0.0 if var_y < 1e-8 else float(1.0 - (np.var(y_true - y_pred) / var_y))

        mean_kl = float(np.mean(approx_kls)) if approx_kls else 0.0
        mean_clip = float(np.mean(clip_fractions)) if clip_fractions else 0.0
        mean_pol_loss = float(np.mean(policy_losses)) if policy_losses else 0.0
        mean_val_loss = float(np.mean(value_losses)) if value_losses else 0.0
        mean_entropy = float(np.mean(entropies)) if entropies else 0.0

        # Stability status classification
        if early_stopped:
            status = "HIGH_KL_EARLY_STOP"
            is_stable = False
        elif mean_clip > 0.4:
            status = "HIGH_CLIP"
            is_stable = False
        elif mean_kl <= self.ppo_config.target_kl and mean_clip <= 0.25:
            status = "OPTIMAL"
            is_stable = True
        else:
            status = "STABLE"
            is_stable = True

        stability_metric = PolicyStabilityMetric(
            epoch=epoch_idx,
            approx_kl=mean_kl,
            clip_fraction=mean_clip,
            explained_variance=explained_var,
            entropy=mean_entropy,
            policy_loss=mean_pol_loss,
            value_loss=mean_val_loss,
            is_stable=is_stable,
            status=status,
        )
        self.stability_history.append(stability_metric)
        return stability_metric

    def train_iteration(self, rollout_steps: int, epoch_idx: int) -> TrainingBatchStats:
        """Run single PPO iteration: rollout collection, GAE, and policy update."""
        buffer, mean_raw, mean_shaped = self.collect_rollout(rollout_steps)
        stability = self.update_policy(buffer, epoch_idx)
        return TrainingBatchStats(
            total_timesteps=self.total_timesteps,
            mean_raw_reward=mean_raw,
            mean_shaped_reward=mean_shaped,
            stability=stability,
        )

    def evaluate(self, episodes: int = 5, deterministic: bool = True) -> EvaluationResult:
        """Evaluate current policy on MDP environment over multiple full episodes."""
        episode_returns: list[float] = []
        episode_lengths: list[int] = []
        total_sla_violations = 0
        total_steps = 0

        t0 = time.perf_counter()
        for ep in range(episodes):
            obs, _ = self.env.reset(seed=ep + 1000)
            ep_return = 0.0
            steps = 0
            done = False
            while not done:
                action, _, _ = self.select_action(obs, deterministic=deterministic)
                next_obs, reward, terminated, truncated, info = self.env.step(action)
                done = terminated or truncated
                ep_return += reward
                steps += 1
                total_steps += 1
                if info.get("sla_violation", False):
                    total_sla_violations += 1
                obs = next_obs
            episode_returns.append(ep_return)
            episode_lengths.append(steps)

        duration = max(time.perf_counter() - t0, 1e-6)
        throughput = float(total_steps / duration)

        return EvaluationResult(
            episodes=episodes,
            mean_return=float(np.mean(episode_returns)),
            std_return=float(np.std(episode_returns)),
            min_return=float(np.min(episode_returns)),
            max_return=float(np.max(episode_returns)),
            mean_episode_length=float(np.mean(episode_lengths)),
            sla_violations=total_sla_violations,
            throughput_steps_per_sec=throughput,
        )
