# RL Autonomous Decision System

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.13-green.svg)](https://docs.pydantic.dev/)
[![PyTorch 2.6](https://img.shields.io/badge/PyTorch-2.6-red.svg)](https://pytorch.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen.svg)](test_engine.py)

A reinforcement learning decision system with Markov Decision Process (MDP) gym environment simulation, potential-based reward shaping, PPO (Proximal Policy Optimization) actor-critic clipped surrogate objective, policy stability tracking, and GAE replay buffer.

---

## Architecture Overview

```
                      ┌─────────────────────────────────┐
                      │    Autonomous Cloud Workload    │
                      │  MDP Simulation Environment     │
                      │  [Load, CPU, Mem, Latency, Err] │
                      └────────────────┬────────────────┘
                                       │
                      Obs s_t          │  Action a_t
                                       ▼
                      ┌─────────────────────────────────┐
                      │     Actor-Critic Neural Net     │
                      │   π_θ(a|s) Policy & V_φ(s)      │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │  Potential-Based Reward Shaper  │
                      │  R' = R + γ Φ(s') - Φ(s)        │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │   Rollout Buffer (GAE-λ)        │
                      │   Advantage Estimation & Cache  │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │   PPO Clipped Objective Engine  │
                      │   L_CLIP(θ) + c1 L_VF - c2 S    │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │    Policy Stability Monitor     │
                      │  Approx KL, Clip Frac, Exp Var  │
                      │  Early Stopping / Drift Alerts  │
                      └─────────────────────────────────┘
```

---

## Sequence Flow

```
Agent / Environment Loop:
1. Environment generates state observation s_t ∈ R^6
2. Actor network computes action distribution π_θ(·|s_t) and samples action a_t
3. Environment transitions: s_{t+1}, raw reward r_t, termination/truncation flags
4. Reward shaper computes potential difference: F(s_t, s_{t+1}) = γ Φ(s_{t+1}) - Φ(s_t)
5. Transition (s_t, a_t, r_shaped, V(s_t), log π(a_t|s_t), done) stored in Rollout Buffer
6. Generalized Advantage Estimation (GAE-λ) calculates A_t and return targets R_t
7. PPO mini-batch updates optimize clipped surrogate loss with gradient clipping
8. Stability Monitor verifies Schulman approximate KL divergence and clipping fraction
```

---

## Mathematical Formulation

### 1. Markov Decision Process (MDP) Environment
- **State Space $\mathcal{S} \subset \mathbb{R}^6$**: Workload intensity, CPU utilization, memory pressure, p99 latency, error rate, capacity ratio.
- **Action Space $\mathcal{A}$**: 5 discrete control operations: `MAINTAIN`, `SCALE_OUT`, `SCALE_IN`, `THROTTLE_TRAFFIC`, `PURGE_CACHE`.
- **Dynamics**: Workload stochastic drift and sinusoidal demand variations combined with non-linear latency and error penalties.

### 2. Potential-Based Reward Shaping
Following Ng, Harada, and Russell (1999), reward shaping preserves optimal policy invariance:
$$F(s, s') = \gamma \Phi(s') - \Phi(s)$$
$$R_{\text{shaped}}(s, a, s') = R_{\text{raw}}(s, a, s') + F(s, s')$$
where $\Phi(s)$ rewards operating within target utilization while penalizing latency and error spikes.

### 3. Generalized Advantage Estimation (GAE-$\lambda$)
$$\delta_t^V = r_t + \gamma V(s_{t+1})(1 - d_t) - V(s_t)$$
$$\hat{A}_t^{\text{GAE}(\gamma, \lambda)} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}^V$$

### 4. PPO Clipped Surrogate Objective
$$L^{\text{CLIP}}(\theta) = \hat{\mathbb{E}}_t \left[ \min\left( r_t(\theta)\hat{A}_t, \, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t \right) \right]$$
where probability ratio:
$$r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{\text{old}}}(a_t|s_t)}$$

### 5. Policy Stability Tracking & Early Stopping
- **Approximate KL Divergence**:
  $$D_{\text{KL}}(\pi_{\text{old}} \parallel \pi_\theta) \approx \frac{1}{N} \sum (r_t(\theta) - 1) - \log r_t(\theta)$$
- **Clip Fraction**: Fraction of mini-batch transitions where $|r_t(\theta) - 1| > \epsilon$.
- **Explained Variance**:
  $$\text{Var}_{\text{explained}} = 1 - \frac{\text{Var}(y_{\text{true}} - y_{\text{pred}})}{\text{Var}(y_{\text{true}})}$$
- **Early Stopping**: Halts epoch optimization if $D_{\text{KL}} > 1.5 \times \text{target\_kl}$ to prevent catastrophic policy collapse.

---

## Pydantic v2 Models & Schemas

- `EnvConfig`: Environment parameters (state dimension, action dimension, max steps, noise level, seed).
- `RewardShapingConfig`: Potential discount factor, target load weights, latency and cost penalty weights.
- `PPOConfig`: Hyperparameters for PPO optimization (learning rate, discount $\gamma$, $\text{GAE}-\lambda$, clip $\epsilon$, entropy coefficient).
- `TransitionRecord`: Typed transition records.
- `PolicyStabilityMetric`: Real-time stability tracking metrics (`approx_kl`, `clip_fraction`, `explained_variance`, `status`).
- `EvaluationResult`: Multi-episode benchmark results with SLA violations and decision throughput.

---

## CLI Usage

Run default training and evaluation benchmark:

```bash
python projects/rl_autonomous_decision_system/main.py --iterations 5 --rollout-steps 256 --eval-episodes 5
```

Custom hyperparameters:

```bash
python projects/rl_autonomous_decision_system/main.py --iterations 10 --rollout-steps 512 --lr 0.0003 --clip-eps 0.2
```

---

## Running Test Suite

Execute the pytest suite:

```bash
pytest projects/rl_autonomous_decision_system/test_engine.py -v
```
