# Culling-Observable Training Dataset Review

- Model-ready rows: `14070`
- Date range: `1999-11-30` - `2016-05-31`

## Label Distribution

| Label | 0 | 1 |
|---|---:|---:|
| `cull_within_30d` | 13749 | 321 |
| `cull_within_60d` | 13427 | 643 |
| `cull_within_90d` | 13110 | 960 |

## Source Distribution

| Source | Rows | 90d positives |
|---|---:|---:|
| `marcenat_inrae` | 12376 | 858 |
| `primiparous_social_env` | 1694 | 102 |

## Split Distribution

| Split | Rows | 90d positives |
|---|---:|---:|
| `test` | 2814 | 309 |
| `train` | 11256 | 651 |

## Notes

- This dataset excludes source-level unlabeled negatives from supervised culling-risk training.
- It does not solve cross-source generalization by itself; it removes the most obvious false-negative label shortcut.
