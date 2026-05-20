# CowReplacementEnv Smoke-Test Report

- Generated at: `2026-05-18T18:32:27`
- Environment: `CowReplacementEnv`
- State table: `data/processed/rl/mdp_state_table.csv`
- Transition model: `data/processed/rl/empirical_transition_model.csv`
- Reward scenario: `baseline_us_2025_mixed_source_v1`

## Policy Summary

| Policy | Episodes | Mean reward | Median reward | Mean steps | Cull action rate | Agent cull | Observed cull | End obs | Max len | Other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `risk_threshold` | 332 | -353.36 | -723.44 | 27.85 | 0.1834 | 307 | 15 | 4 | 6 | 0 |
| `milk_margin_threshold` | 332 | -417.26 | -416.46 | 40.84 | 0.0051 | 33 | 277 | 9 | 13 | 0 |
| `keep_all` | 332 | -603.41 | -366.98 | 40.77 | 0.0000 | 0 | 308 | 18 | 6 | 0 |
| `random_policy` | 332 | -885.96 | -918.03 | 15.65 | 0.1506 | 246 | 84 | 2 | 0 | 0 |
| `cull_all_now` | 332 | -1300.00 | -1300.00 | 1.00 | 1.0000 | 332 | 0 | 0 | 0 | 0 |

## Average Step Reward Components

| Policy | milk_revenue_month | maintenance_cost_month | health_risk_cost_month | reproduction_risk_cost_month | expected_culling_risk_cost_month |
|---|---:|---:|---:|---:|---:|
| `cull_all_now` | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| `keep_all` | 325.45 | 259.74 | 2.76 | 21.51 | 56.24 |
| `milk_margin_threshold` | 326.41 | 259.11 | 2.55 | 21.66 | 50.14 |
| `random_policy` | 311.19 | 247.45 | 1.70 | 17.27 | 39.82 |
| `risk_threshold` | 315.46 | 251.12 | 2.38 | 20.03 | 11.46 |

## Notes

- This is a stochastic smoke-test, not a learned RL policy.
- `action=1` is deterministic terminal culling.
- `action=0` samples from empirical transition probabilities with configured fallback.
- Episodes keep a stable `canonical_animal_id`; sampled model states expose `state_source_canonical_animal_id` for audit.
- Reward values use the current prototype scenario. Replacement/cull-sale/treatment assumptions are not production-grade economics.
- Policy ranking is sensitive to reward assumptions and should be treated as a pipeline sanity check.
