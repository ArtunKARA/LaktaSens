# Empirical Transition Model Review

- Generated at: `2026-05-18T18:27:01`
- Input: `data/processed/rl/mdp_transition_dataset.csv`
- Model output: `data/processed/rl/empirical_transition_model.csv`
- Fallback output: `data/processed/rl/transition_fallback_model.csv`

## Size

- Transition input rows: `28140`
- Probability rows: `1592`
- Fallback states: `220`

## Bucket-Level Coverage

| Bucket level | Current buckets | Probability rows | Median support | Singleton buckets | Mean terminal probability |
|---|---:|---:|---:|---:|---:|
| `exact` | 162 | 804 | 7.50 | 38 | 0.0191 |
| `global` | 1 | 164 | 14070.00 | 0 | 0.0237 |
| `no_risk` | 53 | 401 | 4.00 | 13 | 0.0073 |
| `stage_parity` | 4 | 222 | 3069.00 | 0 | 0.0169 |

## Deterministic Cull Action

- `action=1` is represented as a global deterministic terminal transition with `terminal_reason=agent_cull`.
- Observed data only estimates `action=0` keep transitions.

## Fallback Order

1. `state_bucket_exact`
2. `state_bucket_no_risk`
3. `state_bucket_stage_parity`
4. `global`

## Next Step

`scripts/30_simulate_cow_replacement_env.py` uses this transition model to run baseline policy smoke-tests with reward decomposition.
