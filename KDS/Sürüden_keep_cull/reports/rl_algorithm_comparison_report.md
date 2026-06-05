# RL Algorithm Comparison Report

- Generated at: `2026-06-01T13:55:02`
- Results: `data/processed/rl/rl_algorithm_comparison_results.csv`
- Policy table: `data/processed/rl/rl_algorithm_policy_table.csv`

## Completed Benchmark Results

| Algorithm | Type | Mean initial V | Mean state V | Cull state rate | Changed vs MDP | Eval converged | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| `model_based_mdp_value_iteration` | `model_based_exact` | -30.30 | -550.68 | 0.1111 | 0 | True | Reference policy from direct value iteration model. |
| `keep_all` | `heuristic` | -70.99 | -618.00 | 0.0000 | 18 | True | Deterministic heuristic baseline. |
| `dqn_style_fqi_mlp` | `simulator_rl_approximate` | -70.99 | -618.00 | 0.0000 | 18 | True | Direct DQN-style fitted Q iteration with sklearn MLP; iterations=10. |
| `milk_margin_threshold` | `heuristic` | -74.67 | -624.30 | 0.1235 | 20 | True | Deterministic heuristic baseline. |
| `tabular_q_learning` | `simulator_rl` | -93.10 | -739.24 | 0.1605 | 36 | True | Direct tabular Q-learning; episodes=4000, final_epsilon=0.0300. |
| `risk_threshold` | `heuristic` | -164.90 | -732.55 | 0.2346 | 36 | True | Deterministic heuristic baseline. |
| `random_policy` | `heuristic_stochastic` | -622.02 | -909.79 | 0.0500 | 18 | True | Stochastic baseline with fixed cull probability. |
| `tabular_ppo_smoke` | `simulator_rl` | -1052.95 | -1195.45 | 0.4905 | 47 | True | Direct tabular PPO-style smoke test; iterations=140. |
| `cull_all_now` | `heuristic` | -1300.00 | -1300.00 | 1.0000 | 144 | True | Deterministic heuristic baseline. |

## Not Run / Not Eligible

| Algorithm | Type | Status | Reason |
|---|---|---|---|
| `iql` | `offline_rl` | `not_run` | not eligible until real logged keep/cull actions and behavior-policy support exist |
| `bcq` | `offline_rl` | `not_run` | not eligible until real logged keep/cull actions and behavior-policy support exist |
| `td3` | `continuous_action_rl` | `not_run` | current action space is discrete keep/cull |
| `sac` | `continuous_action_rl` | `not_run` | current action space is discrete keep/cull |
| `cql` | `offline_rl` | `not_run` | not eligible until real logged keep/cull actions and behavior-policy support exist |

## Learned/Derived Policy Counts

| Algorithm | Keep states | Cull states |
|---|---:|---:|
| `cull_all_now` | 0 | 162 |
| `dqn_style_fqi_mlp` | 162 | 0 |
| `keep_all` | 162 | 0 |
| `milk_margin_threshold` | 142 | 20 |
| `model_based_mdp_value_iteration` | 144 | 18 |
| `random_policy` | 162 | 0 |
| `risk_threshold` | 124 | 38 |
| `tabular_ppo_smoke` | 127 | 35 |
| `tabular_q_learning` | 136 | 26 |

## Interpretation

- `model_based_mdp_value_iteration` remains the reference solution for this phase.
- Simulator RL rows are benchmark smoke tests over the empirical MDP, not production policies.
- Offline RL algorithms are intentionally not run because real logged actions are missing.
