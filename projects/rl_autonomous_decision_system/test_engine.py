import numpy as np
import pytest
import torch

try:
    from .models import (
        EnvConfig,
        RewardShapingConfig,
        PPOConfig,
        PolicyStabilityMetric,
        EvaluationResult,
    )
    from .engine import (
        AutonomousDecisionEnv,
        RewardShaper,
        RolloutBuffer,
        ActorCritic,
        PPODecisionEngine,
    )
except ImportError:
    from models import (
        EnvConfig,
        RewardShapingConfig,
        PPOConfig,
        PolicyStabilityMetric,
        EvaluationResult,
    )
    from engine import (
        AutonomousDecisionEnv,
        RewardShaper,
        RolloutBuffer,
        ActorCritic,
        PPODecisionEngine,
    )


def test_environment_reset_and_state_bounds():
    config = EnvConfig(state_dim=6, action_dim=5, max_steps=50, seed=123)
    env = AutonomousDecisionEnv(config)

    obs, info = env.reset(seed=123)
    assert obs.shape == (6,), f"Expected observation shape (6,), got {obs.shape}"
    assert isinstance(info, dict)
    assert "instances" in info
    assert info["instances"] == 5

    # Check state bounds
    workload, cpu_util, memory, latency, error_rate, capacity = obs
    assert 0.0 <= workload <= 1.0
    assert 0.0 <= cpu_util <= 1.0
    assert 0.0 <= memory <= 1.0
    assert 0.0 <= latency <= 1.0
    assert 0.0 <= error_rate <= 1.0
    assert 0.0 <= capacity <= 1.0


def test_environment_action_dynamics_and_clamping():
    env = AutonomousDecisionEnv(EnvConfig(max_steps=20, noise_level=0.0))
    env.reset(seed=42)

    # Action 1: SCALE_OUT
    initial_instances = env.instances
    _, _, _, _, info = env.step(1)
    assert env.instances == initial_instances + 1
    assert info["action_name"] == "SCALE_OUT"

    # Action 2: SCALE_IN twice
    env.step(2)
    env.step(2)
    assert env.instances == initial_instances - 1

    # Action 4: PURGE_CACHE sets memory to 0.2
    env.memory = 0.85
    env.step(4)
    assert env.memory == 0.2

    # Test max step truncation
    env.current_step = 19
    _, _, terminated, truncated, _ = env.step(0)
    assert truncated is True


def test_reward_shaping_potential_and_invariance():
    reward_cfg = RewardShapingConfig(
        enable_potential=True,
        potential_gamma=0.99,
        target_load_weight=2.0,
    )
    shaper = RewardShaper(reward_cfg)

    optimal_state = np.array([0.5, 0.5, 0.2, 0.1, 0.0, 0.5], dtype=np.float32)
    degraded_state = np.array([0.9, 0.95, 0.8, 0.9, 0.3, 0.2], dtype=np.float32)

    phi_optimal = shaper.potential(optimal_state)
    phi_degraded = shaper.potential(degraded_state)
    assert phi_optimal > phi_degraded, "Optimal state must have higher potential than degraded state"

    # Verify shaped reward computation
    raw_reward = 1.0
    shaped = shaper.shape(degraded_state, raw_reward, optimal_state, done=False)
    # Moving from degraded to optimal state provides positive shaping bonus
    assert shaped > raw_reward

    # Verify when potential is disabled
    disabled_shaper = RewardShaper(RewardShapingConfig(enable_potential=False))
    assert disabled_shaper.shape(degraded_state, raw_reward, optimal_state, done=False) == raw_reward


def test_rollout_buffer_gae_and_batch_generation():
    buffer = RolloutBuffer(capacity=10, state_dim=4)
    state = np.ones(4, dtype=np.float32)

    # Populate buffer
    for i in range(10):
        buffer.add(
            state=state * i,
            action=i % 3,
            reward=1.0,
            value=0.5,
            log_prob=-0.5,
            done=(i == 9),
        )

    assert buffer.pos == 10
    with pytest.raises(IndexError):
        buffer.add(state, 0, 1.0, 0.5, -0.5, False)

    # Compute GAE
    buffer.compute_returns_and_advantages(last_value=0.0, last_done=True, gamma=0.99, gae_lambda=0.95)
    assert len(buffer.advantages) == 10
    assert len(buffer.returns) == 10

    # Returns should equal advantages + values
    np.testing.assert_allclose(buffer.returns, buffer.advantages + buffer.values, rtol=1e-5)

    # Test batch generation
    batches = list(buffer.get_batches(batch_size=4))
    assert len(batches) == 3  # 4 + 4 + 2
    b_obs, b_act, b_lp, b_adv, b_ret, b_val = batches[0]
    assert b_obs.shape == (4, 4)
    assert b_act.shape == (4,)
    assert b_lp.shape == (4,)

    buffer.clear()
    assert buffer.pos == 0


def test_actor_critic_network_shapes_and_probabilities():
    net = ActorCritic(state_dim=6, action_dim=5, hidden_dim=32)
    state_t = torch.randn(8, 6)

    # Value output shape
    values = net.get_value(state_t)
    assert values.shape == (8,)

    # Action sampling output shapes
    actions, log_probs, entropy, sampled_values = net.get_action_and_value(state_t)
    assert actions.shape == (8,)
    assert log_probs.shape == (8,)
    assert entropy.shape == (8,)
    assert sampled_values.shape == (8,)
    assert torch.all(entropy >= 0.0)

    # Probabilities sum to 1
    logits = net.actor(state_t)
    probs = torch.softmax(logits, dim=-1)
    np.testing.assert_allclose(probs.sum(dim=-1).detach().numpy(), np.ones(8), rtol=1e-5)


def test_ppo_clipped_objective_and_early_stopping():
    ppo_cfg = PPOConfig(ppo_epochs=2, batch_size=16, clip_epsilon=0.2, target_kl=0.01)
    engine = PPODecisionEngine(ppo_config=ppo_cfg)

    # Collect rollout
    buffer, _, _ = engine.collect_rollout(steps=32)
    assert buffer.pos == 32

    # Execute update
    metric = engine.update_policy(buffer, epoch_idx=1)
    assert isinstance(metric, PolicyStabilityMetric)
    assert metric.approx_kl >= 0.0
    assert 0.0 <= metric.clip_fraction <= 1.0
    assert metric.status in ["OPTIMAL", "STABLE", "HIGH_KL_EARLY_STOP", "HIGH_CLIP"]


def test_end_to_end_decision_engine_evaluation():
    engine = PPODecisionEngine(
        env_config=EnvConfig(max_steps=20),
        ppo_config=PPOConfig(ppo_epochs=1, batch_size=16),
    )

    stats = engine.train_iteration(rollout_steps=32, epoch_idx=1)
    assert stats.total_timesteps == 32
    assert isinstance(stats.mean_raw_reward, float)
    assert isinstance(stats.mean_shaped_reward, float)

    eval_result = engine.evaluate(episodes=3, deterministic=True)
    assert isinstance(eval_result, EvaluationResult)
    assert eval_result.episodes == 3
    assert eval_result.mean_episode_length > 0
    assert eval_result.throughput_steps_per_sec > 0.0
    assert eval_result.min_return <= eval_result.mean_return <= eval_result.max_return


def test_environment_deterministic_reproducibility():
    cfg = EnvConfig(seed=999)
    env1 = AutonomousDecisionEnv(cfg)
    env2 = AutonomousDecisionEnv(cfg)

    s1, _ = env1.reset(seed=999)
    s2, _ = env2.reset(seed=999)
    np.testing.assert_allclose(s1, s2)

    # Perform identical actions
    for act in [1, 0, 3, 2, 4]:
        o1, r1, d1, t1, _ = env1.step(act)
        o2, r2, d2, t2, _ = env2.step(act)
        np.testing.assert_allclose(o1, o2)
        assert r1 == pytest.approx(r2)
        assert d1 == d2
        assert t1 == t2


def test_buffer_gae_terminal_state_boundary():
    buffer = RolloutBuffer(capacity=4, state_dim=2)
    s = np.zeros(2, dtype=np.float32)

    # Step 0: normal
    buffer.add(state=s, action=0, reward=1.0, value=2.0, log_prob=-0.5, done=False)
    # Step 1: terminal (done = True)
    buffer.add(state=s, action=1, reward=2.0, value=1.0, log_prob=-0.3, done=True)
    # Step 2: new episode
    buffer.add(state=s, action=0, reward=0.5, value=0.5, log_prob=-0.2, done=False)
    # Step 3: normal
    buffer.add(state=s, action=1, reward=1.0, value=1.5, log_prob=-0.1, done=False)

    buffer.compute_returns_and_advantages(last_value=2.0, last_done=False, gamma=0.9, gae_lambda=0.95)

    # Step 1 is terminal, so next_non_terminal = 0 -> delta_1 = r_1 - V_1 = 2.0 - 1.0 = 1.0
    # Advantage at step 1 should be exactly delta_1 (no continuation from step 2)
    assert buffer.advantages[1] == pytest.approx(1.0, rel=1e-4)


def test_edge_case_single_step_and_zero_variance():
    ppo_cfg = PPOConfig(ppo_epochs=1, batch_size=4)
    engine = PPODecisionEngine(ppo_config=ppo_cfg)

    # Mini rollout with identical rewards (zero advantage variance guard)
    buffer = RolloutBuffer(capacity=4, state_dim=6)
    obs, _ = engine.env.reset()
    for _ in range(4):
        buffer.add(obs, 0, 1.0, 1.0, -0.5, False)
    buffer.compute_returns_and_advantages(last_value=1.0, last_done=False)

    # Policy update should execute smoothly without NaN
    metric = engine.update_policy(buffer, epoch_idx=1)
    assert not np.isnan(metric.policy_loss)
    assert not np.isnan(metric.value_loss)

