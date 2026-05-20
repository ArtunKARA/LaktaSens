# Stable-Baselines3 PPO/DQN Training Report

- Generated at: `2026-05-21T00:19:54`
- Results: `data/processed/rl/sb3_training_results.csv`
- Policy table: `data/processed/rl/sb3_policy_table.csv`
- Eval episodes: `data/processed/rl/sb3_eval_episodes.csv`

## Results

| Algorithm | Status | Timesteps | Eval episodes | Mean reward | Median reward | Mean steps | Cull state rate | Changed vs MDP | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| `PPO` | `completed` | 5000 | 100 | -145.58 | -438.45 | 32.02 | 0.1481 | 28 | Saved model: Model/rl/sb3/ppo_cow_replacement.zip |
| `DQN` | `completed` | 5000 | 100 | -401.86 | -248.34 | 33.48 | 0.0000 | 18 | Saved model: Model/rl/sb3/dqn_cow_replacement.zip |

## Interpretation

- This is real Stable-Baselines3 training on the empirical Gymnasium simulator.
- It is still not a production policy because the simulator itself is prototype empirical MDP data.
- Compare against `model_based_mdp_value_iteration`; beating heuristics is useful, matching MDP is the sanity target.
