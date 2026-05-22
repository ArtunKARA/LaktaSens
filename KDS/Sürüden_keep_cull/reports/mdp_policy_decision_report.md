# MDP Policy Decision Report

- Generated at: `2026-05-21T14:22:25`
- Method: `value_iteration`
- Discount factor: `0.97`
- Iterations: `214`
- Final delta: `0.00009923`
- Converged: `True`

## Outputs

- Value/action table: `data/processed/rl/mdp_value_iteration_result.csv`
- Optimal policy table: `data/processed/rl/optimal_policy_table.csv`

## Policy Counts

- Keep states: `144`
- Cull states: `18`
- Total states: `162`

## Transition Fallback Usage

| Fallback | States |
|---|---:|
| `state_bucket_exact` | 94 |
| `state_bucket_no_risk` | 68 |

## Strongest Cull States

| State | Margin cull-keep | Q keep | Q cull | Support | Risk band | Milk band | Health band |
|---|---:|---:|---:|---:|---|---|---|
| `late|unknown|late_151_305|low|declining|none|10_20` | 234.23 | -1534.23 | -1300.00 | 1 | `10_20` | `low` | `none` |
| `late|unknown|late_151_305|medium|rising|none|50_100` | 188.39 | -1488.39 | -1300.00 | 1 | `50_100` | `medium` | `none` |
| `late|unknown|late_151_305|low|stable|none|0_5` | 128.87 | -1428.87 | -1300.00 | 9 | `0_5` | `low` | `none` |
| `early|unknown|mid_61_150|medium|stable|moderate|50_100` | 115.48 | -1415.48 | -1300.00 | 13 | `50_100` | `medium` | `moderate` |
| `late|unknown|late_151_305|low|rising|none|5_10` | 94.85 | -1394.85 | -1300.00 | 1 | `5_10` | `low` | `none` |
| `mid|unknown|mid_61_150|low|stable|none|0_5` | 91.13 | -1391.13 | -1300.00 | 2 | `0_5` | `low` | `none` |
| `mid|unknown|late_151_305|medium|stable|moderate|50_100` | 84.57 | -1384.57 | -1300.00 | 52 | `50_100` | `medium` | `moderate` |
| `early|unknown|fresh_0_60|low|stable|none|50_100` | 74.37 | -1374.37 | -1300.00 | 14 | `50_100` | `low` | `none` |
| `mid|unknown|late_151_305|medium|stable|none|50_100` | 70.07 | -1370.07 | -1300.00 | 195 | `50_100` | `medium` | `none` |
| `late|unknown|late_151_305|low|stable|none|5_10` | 68.78 | -1368.78 | -1300.00 | 9 | `5_10` | `low` | `none` |

## Strongest Keep States

| State | Margin cull-keep | Q keep | Q cull | Support | Risk band | Milk band | Health band |
|---|---:|---:|---:|---:|---|---|---|
| `early|unknown|fresh_0_60|very_high|stable|none|0_5` | -2205.52 | 905.52 | -1300.00 | 5 | `0_5` | `very_high` | `none` |
| `early|unknown|fresh_0_60|very_high|stable|none|5_10` | -2183.47 | 883.47 | -1300.00 | 5 | `5_10` | `very_high` | `none` |
| `early|unknown|fresh_0_60|high|rising|none|5_10` | -2063.34 | 763.34 | -1300.00 | 6 | `5_10` | `high` | `none` |
| `early|unknown|mid_61_150|very_high|declining|none|5_10` | -2046.08 | 746.08 | -1300.00 | 2 | `5_10` | `very_high` | `none` |
| `early|unknown|mid_61_150|very_high|declining|none|0_5` | -2043.58 | 743.58 | -1300.00 | 2 | `0_5` | `very_high` | `none` |
| `early|unknown|fresh_0_60|high|rising|none|10_20` | -2030.28 | 730.28 | -1300.00 | 6 | `10_20` | `high` | `none` |
| `early|unknown|fresh_0_60|high|rising|none|20_35` | -1983.96 | 683.96 | -1300.00 | 6 | `20_35` | `high` | `none` |
| `early|unknown|mid_61_150|very_high|stable|none|0_5` | -1952.93 | 652.93 | -1300.00 | 2 | `0_5` | `very_high` | `none` |
| `mid|unknown|mid_61_150|very_high|rising|none|5_10` | -1903.53 | 603.53 | -1300.00 | 2 | `5_10` | `very_high` | `none` |
| `early|unknown|mid_61_150|very_high|rising|none|0_5` | -1852.59 | 552.59 | -1300.00 | 3 | `0_5` | `very_high` | `none` |

## Notes

- Keep action future value uses empirical transition probabilities and configured fallback.
