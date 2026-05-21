# MDP Reward Table Review

- Generated at: `2026-05-21T00:31:09`
- Output: `data/processed/rl/mdp_reward_table.csv`
- Scenario: `baseline_us_2025_mixed_source_v1`

## Size

- State-action rows: `324`
- States: `162`

## Immediate Reward Summary

| Metric | Keep | Cull | Cull - Keep margin |
|---|---:|---:|---:|
| Mean | -7.52 | -1300.00 | -1292.48 |
| Median | 3.56 | -1300.00 | -1303.56 |
| Min | -507.85 | -1300.00 | -1586.19 |
| Max | 286.19 | -1300.00 | -792.15 |

## Mean Keep Reward Components

| Component | Mean |
|---|---:|
| `milk_revenue_month` | 337.12 |
| `maintenance_cost_month` | 259.74 |
| `health_risk_cost_month` | 5.00 |
| `reproduction_risk_cost_month` | 16.74 |
| `expected_culling_risk_cost_month` | 63.16 |

## Notes

- Reward is state-action immediate reward; future value is handled by value iteration.
- Cull reward is constant in this first prototype because replacement and cull sale values are scenario parameters.
- Economics are prototype assumptions, not production-grade farm economics.
