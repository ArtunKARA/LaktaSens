# RL Algorithm Readiness Report

- Generated at: `2026-05-21T00:32:22`
- Output: `data/processed/rl/rl_algorithm_readiness.csv`

## Data Context

- State rows: `14070`
- Transition rows: `28140`
- Empirical transition rows: `1592`
- Policy rows: `162`
- Keep transition rows: `14070`
- Generated cull rows: `14070`
- Observed cull terminal rows: `321`
- Real logged action rows: `0`

## Algorithm Eligibility

| Algorithm | Family | Eligible now | Status | Production valid | Recommended use | Reason |
|---|---|---:|---|---:|---|---|
| `model_based_mdp_value_iteration` | `model_based_mdp` | True | `ready` | False | Primary current benchmark. | Empirical transition model and reward table exist; output remains prototype policy. |
| `tabular_q_learning` | `online_rl_on_simulator` | True | `ready` | False | Simulator benchmark. | Can train on the empirical simulator; useful as sanity benchmark, not as farm policy. |
| `tabular_ppo_smoke` | `policy_gradient_on_simulator` | True | `ready` | False | Simulator benchmark only. | Can run a tabular PPO-style smoke test on the simulator without external RL dependencies. |
| `dqn_style_fitted_q_mlp` | `value_rl_on_simulator` | True | `ready` | False | Approximate simulator benchmark. | Uses sklearn MLP fitted Q-iteration as a DQN-style approximation; not a full replay-buffer DQN. |
| `ppo_stable_baselines` | `policy_gradient_on_simulator` | False | `deferred` | False | Later, after simulator API stabilizes. | Needs a stable Gymnasium wrapper and dependency decision; current tabular PPO smoke covers this phase. |
| `cql` | `offline_rl` | False | `not_eligible` | False | Eligibility-only until logged action data exists. | Real logged keep/cull actions and behavior-policy support are missing; generated cull rows are not logged actions. |
| `iql` | `offline_rl` | False | `not_eligible` | False | Eligibility-only until logged action data exists. | Offline trajectory data with real actions is missing. |
| `bcq` | `offline_rl` | False | `not_eligible` | False | Eligibility-only until logged action data exists. | Behavior policy/action support cannot be estimated without real logged actions. |
| `td3` | `continuous_action_rl` | False | `not_applicable` | False | Only relevant if future action space becomes continuous. | Current action space is discrete: 0=keep, 1=cull. |
| `sac` | `continuous_action_rl` | False | `not_applicable` | False | Only relevant if future action space becomes continuous. | Current action space is discrete: 0=keep, 1=cull. |

## Decision

- Current valid core remains model-based MDP value iteration.
- Q-learning, tabular PPO smoke, and DQN-style fitted Q can be used as simulator benchmarks.
- CQL/IQL/BCQ are not valid yet because real logged actions are absent.
- TD3/SAC are not applicable while action space is discrete keep/cull.
