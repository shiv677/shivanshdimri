import argparse
import time

try:
    from .models import EnvConfig, PPOConfig, RewardShapingConfig
    from .engine import PPODecisionEngine
except ImportError:
    from models import EnvConfig, PPOConfig, RewardShapingConfig
    from engine import PPODecisionEngine


def run_benchmark(iterations: int = 5, rollout_steps: int = 256, eval_episodes: int = 5, lr: float = 3e-4, clip_eps: float = 0.2):
    print("=" * 80)
    print("Autonomous Decision System // Reinforcement Learning Engine (PPO)")
    print("=" * 80)
    print(f"Configurations:")
    print(f"  - Rollout Steps/Iteration: {rollout_steps}")
    print(f"  - Total PPO Iterations:    {iterations}")
    print(f"  - Learning Rate:           {lr}")
    print(f"  - Clip Epsilon:            {clip_eps}")
    print(f"  - Evaluation Episodes:     {eval_episodes}")
    print("-" * 80)

    env_cfg = EnvConfig(max_steps=200)
    ppo_cfg = PPOConfig(learning_rate=lr, clip_epsilon=clip_eps, ppo_epochs=4, batch_size=64)
    reward_cfg = RewardShapingConfig(enable_potential=True)

    engine = PPODecisionEngine(env_config=env_cfg, ppo_config=ppo_cfg, reward_config=reward_cfg)

    # Initial baseline evaluation
    print("[*] Running Baseline Zero-Shot Evaluation...")
    baseline_eval = engine.evaluate(episodes=eval_episodes, deterministic=True)
    print(f"    Baseline Return:   {baseline_eval.mean_return:.2f} +/- {baseline_eval.std_return:.2f}")
    print(f"    SLA Violations:    {baseline_eval.sla_violations} / {eval_episodes * env_cfg.max_steps} max steps")
    print(f"    Throughput:        {baseline_eval.throughput_steps_per_sec:.1f} steps/sec")
    print("-" * 80)

    print(f"{'Iter':<6} {'Timesteps':<10} {'Raw Rwd':<10} {'Shaped Rwd':<12} {'Approx KL':<11} {'Clip Frac':<11} {'Exp Var':<9} {'Status'}")
    print("-" * 80)

    t_start = time.perf_counter()
    for it in range(1, iterations + 1):
        stats = engine.train_iteration(rollout_steps=rollout_steps, epoch_idx=it)
        s = stats.stability
        print(
            f"{it:<6} "
            f"{stats.total_timesteps:<10} "
            f"{stats.mean_raw_reward:<10.3f} "
            f"{stats.mean_shaped_reward:<12.3f} "
            f"{s.approx_kl:<11.4f} "
            f"{s.clip_fraction:<11.3f} "
            f"{s.explained_variance:<9.2f} "
            f"{s.status}"
        )

    train_duration = max(time.perf_counter() - t_start, 1e-6)
    print("-" * 80)
    print(f"Training completed in {train_duration:.2f}s ({engine.total_timesteps / train_duration:.1f} train steps/sec)")
    print("-" * 80)

    # Final policy evaluation
    print("[*] Running Post-Training Policy Evaluation...")
    post_eval = engine.evaluate(episodes=eval_episodes, deterministic=True)
    print(f"    Post-Train Return: {post_eval.mean_return:.2f} +/- {post_eval.std_return:.2f}")
    print(f"    SLA Violations:    {post_eval.sla_violations} / {eval_episodes * env_cfg.max_steps} max steps")
    print(f"    Inference Rate:    {post_eval.throughput_steps_per_sec:.1f} decisions/sec")
    print("=" * 80)

    return {
        "baseline": baseline_eval,
        "post_train": post_eval,
        "stability_history": engine.stability_history,
    }


def main():
    parser = argparse.ArgumentParser(description="Autonomous RL Decision System.")
    parser.add_argument("--iterations", type=int, default=5, help="Number of training iterations")
    parser.add_argument("--rollout-steps", type=int, default=256, help="Rollout steps per iteration")
    parser.add_argument("--eval-episodes", type=int, default=5, help="Number of evaluation episodes")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--clip-eps", type=float, default=0.2, help="PPO clip epsilon")
    args = parser.parse_args()

    run_benchmark(
        iterations=args.iterations,
        rollout_steps=args.rollout_steps,
        eval_episodes=args.eval_episodes,
        lr=args.lr,
        clip_eps=args.clip_eps,
    )


if __name__ == "__main__":
    main()
