# MDP Transition Dataset Review

- Generated at: `2026-05-18T14:06:40`
- Environment: `CowReplacementEnv`
- Snapshot input: `data/processed/training/inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv`
- Risk score source: `model_artifact:Model/baseline_risk/payload_enriched_health_ablation/all_health_aux_catboost_cull_within_90d.joblib`

## Outputs

- State table: `data/processed/rl/mdp_state_table.csv`
- Transition dataset: `data/processed/rl/mdp_transition_dataset.csv`
- Transition summary: `data/processed/rl/mdp_transition_summary.csv`
- State bucket summary: `data/processed/rl/mdp_state_bucket_summary.csv`

## Size

- State rows: `14070`
- Animals: `332`
- Transition rows: `28140`
- Keep transition rows: `14070`
- Keep terminal rate: `0.0237`
- Observed cull terminal rows: `321`

## Transition Terminal Summary

| Action | Terminal reason | Rows | Terminal rate | Observed cull terminals |
|---|---|---:|---:|---:|
| `cull` | `agent_cull` | 14070 | 1.0000 | 0 |
| `keep` | `end_of_observation` | 12 | 1.0000 | 0 |
| `keep` | `non_terminal` | 13737 | 0.0000 | 0 |
| `keep` | `observed_cull_within_30d` | 321 | 1.0000 | 321 |

## State Bucket Summary

| Bucket | Unique | Max rows | Median rows | Singleton buckets |
|---|---:|---:|---:|---:|
| `state_bucket_exact` | 162 | 1385 | 7.50 | 38 |
| `state_bucket_no_risk` | 53 | 3476 | 4.00 | 13 |
| `state_bucket_stage_parity` | 4 | 7130 | 3069.00 | 0 |

## Leakage Guard

- `source_code`, IDs, dates, culling labels and culling reason fields are metadata, not observation features.
- Risk scores are produced by the selected source-agnostic CatBoost artifact; `source_code` is not a model feature.
- `action=1` cull transitions are deterministic synthetic action rows; observed data only informs `action=0` keep transitions.
- Reward is not calculated in this script. Reward parameters are referenced through config for the next environment simulation step.

## Next Step

`scripts/29_build_empirical_transition_model.py` should aggregate this dataset into transition probability tables using the configured fallback order.
