# MDP Reward Table Review

- Generated at: `2026-06-01T13:53:49`
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

## Notes

- Reward is state-action immediate reward; future value is handled by value iteration.
- Cull reward is constant in this first prototype because replacement and cull sale values are scenario parameters.
