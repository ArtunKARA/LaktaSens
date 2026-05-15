# Baseline Robustness Report

- Generated at: `2026-05-15T10:11:06`
- Purpose: check whether baseline performance depends on `source_code` shortcut signal.
- Feature variant: `no_source_code`
- Primary target: `cull_within_90d`

## Best No-Source Time Baseline

- Model: `xgboost`
- PR-AUC: `0.371075`
- ROC-AUC: `0.789269`
- F1: `0.386895`
- Recall: `0.401294`
- Precision: `0.373494`

## With vs Without Source Code

- Previous with-source Logistic Regression PR-AUC: `0.326775`
- Current no-source best PR-AUC: `0.371075`
- Delta: `0.044300`

## Metrics

| Validation | Target | Model | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `phase_3_split` | `cull_within_30d` | `xgboost` | `-` | 216 | 105 | 0.7731 | 0.1546 | 0.1961 | 0.2857 | 0.1493 | 0.1765 | 0.2697 |
| `phase_3_split` | `cull_within_30d` | `logistic_regression` | `-` | 216 | 105 | 0.8101 | 0.1430 | 0.1985 | 0.7333 | 0.1148 | 0.3359 | 0.4263 |
| `phase_3_split` | `cull_within_30d` | `random_forest` | `-` | 216 | 105 | 0.7503 | 0.1263 | 0.1758 | 0.1524 | 0.2078 | 0.1440 | 0.3005 |
| `phase_3_split` | `cull_within_30d` | `lightgbm` | `-` | 216 | 105 | 0.7791 | 0.1169 | 0.1538 | 0.1238 | 0.2031 | 0.1259 | 0.1706 |
| `phase_3_split` | `cull_within_60d` | `lightgbm` | `-` | 434 | 209 | 0.7735 | 0.2658 | 0.3005 | 0.2775 | 0.3277 | 0.1338 | 0.1542 |
| `phase_3_split` | `cull_within_60d` | `xgboost` | `-` | 434 | 209 | 0.7754 | 0.2603 | 0.2979 | 0.2679 | 0.3353 | 0.1694 | 0.2313 |
| `phase_3_split` | `cull_within_60d` | `logistic_regression` | `-` | 434 | 209 | 0.8104 | 0.2547 | 0.3108 | 0.7273 | 0.1977 | 0.2765 | 0.3489 |
| `phase_3_split` | `cull_within_60d` | `random_forest` | `-` | 434 | 209 | 0.7574 | 0.2346 | 0.2257 | 0.1722 | 0.3273 | 0.1716 | 0.3041 |
| `phase_3_split` | `cull_within_90d` | `xgboost` | `-` | 651 | 309 | 0.7893 | 0.3711 | 0.3869 | 0.4013 | 0.3735 | 0.1704 | 0.2108 |
| `phase_3_split` | `cull_within_90d` | `random_forest` | `-` | 651 | 309 | 0.7841 | 0.3488 | 0.2041 | 0.1294 | 0.4819 | 0.1759 | 0.2848 |
| `phase_3_split` | `cull_within_90d` | `logistic_regression` | `-` | 651 | 309 | 0.7970 | 0.3269 | 0.4080 | 0.6246 | 0.3030 | 0.2244 | 0.2689 |
| `phase_3_split` | `cull_within_90d` | `lightgbm` | `-` | 651 | 309 | 0.7853 | 0.3198 | 0.3121 | 0.2621 | 0.3857 | 0.1403 | 0.1434 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `logistic_regression` | `-` | 36 | 285 | 0.6507 | 0.0457 | 0.0681 | 0.6561 | 0.0359 | 0.4610 | 0.5361 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `random_forest` | `-` | 36 | 285 | 0.6321 | 0.0433 | 0.0000 | 0.0000 | 0.0000 | 0.1365 | 0.3347 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `lightgbm` | `-` | 36 | 285 | 0.5833 | 0.0331 | 0.0000 | 0.0000 | 0.0000 | 0.0288 | 0.0304 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `xgboost` | `-` | 36 | 285 | 0.6267 | 0.0309 | 0.0000 | 0.0000 | 0.0000 | 0.0495 | 0.1068 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `random_forest` | `-` | 70 | 573 | 0.6675 | 0.0912 | 0.0000 | 0.0000 | 0.0000 | 0.1494 | 0.3232 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `logistic_regression` | `-` | 70 | 573 | 0.6305 | 0.0824 | 0.1116 | 0.7086 | 0.0606 | 0.5713 | 0.6303 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `lightgbm` | `-` | 70 | 573 | 0.5921 | 0.0603 | 0.0000 | 0.0000 | 0.0000 | 0.0587 | 0.0509 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `xgboost` | `-` | 70 | 573 | 0.6020 | 0.0571 | 0.0033 | 0.0017 | 0.0250 | 0.0920 | 0.1624 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `logistic_regression` | `-` | 102 | 858 | 0.6263 | 0.1185 | 0.1562 | 0.7529 | 0.0871 | 0.5996 | 0.6607 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `random_forest` | `-` | 102 | 858 | 0.6395 | 0.0986 | 0.0000 | 0.0000 | 0.0000 | 0.1607 | 0.3075 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `xgboost` | `-` | 102 | 858 | 0.5609 | 0.0754 | 0.0022 | 0.0012 | 0.0263 | 0.1081 | 0.1528 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `lightgbm` | `-` | 102 | 858 | 0.4570 | 0.0607 | 0.0000 | 0.0000 | 0.0000 | 0.0876 | 0.0822 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `xgboost` | `-` | 285 | 36 | 0.5768 | 0.0499 | 0.0000 | 0.0000 | 0.0000 | 0.0621 | 0.1475 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `lightgbm` | `-` | 285 | 36 | 0.5452 | 0.0412 | 0.0000 | 0.0000 | 0.0000 | 0.0295 | 0.0327 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `random_forest` | `-` | 285 | 36 | 0.5801 | 0.0406 | 0.0000 | 0.0000 | 0.0000 | 0.0561 | 0.1673 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `logistic_regression` | `-` | 285 | 36 | 0.6242 | 0.0365 | 0.0727 | 0.2778 | 0.0418 | 0.1598 | 0.1921 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `random_forest` | `-` | 573 | 70 | 0.6213 | 0.0860 | 0.0000 | 0.0000 | 0.0000 | 0.0872 | 0.1906 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `xgboost` | `-` | 573 | 70 | 0.6239 | 0.0761 | 0.0000 | 0.0000 | 0.0000 | 0.0747 | 0.1188 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `lightgbm` | `-` | 573 | 70 | 0.5779 | 0.0712 | 0.0000 | 0.0000 | 0.0000 | 0.0450 | 0.0339 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `logistic_regression` | `-` | 573 | 70 | 0.6360 | 0.0677 | 0.1254 | 0.3143 | 0.0783 | 0.1899 | 0.2163 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `random_forest` | `-` | 858 | 102 | 0.6523 | 0.1374 | 0.0000 | 0.0000 | 0.0000 | 0.1058 | 0.2129 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `lightgbm` | `-` | 858 | 102 | 0.6461 | 0.1275 | 0.0000 | 0.0000 | 0.0000 | 0.0594 | 0.0316 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `xgboost` | `-` | 858 | 102 | 0.6718 | 0.1188 | 0.0000 | 0.0000 | 0.0000 | 0.0869 | 0.1173 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `logistic_regression` | `-` | 858 | 102 | 0.6410 | 0.0956 | 0.1683 | 0.3333 | 0.1126 | 0.2052 | 0.2190 |

## Interpretation

- If no-source performance drops sharply, the previous model was mostly using dataset identity.
- Source-holdout validation is the harsher test: it asks whether a model trained on other datasets transfers to a held-out culling-positive source.
- These results should guide feature engineering before MDP/RL work, not be treated as a final production model.

## Decision

- Time-split signal still exists after removing `source_code`, but calibration and precision are weak.
- Source-holdout transfer is poor when primary-horizon holdout models have low or zero recall at the train-selected threshold.
- Do not use the current risk model as a policy component yet. Before MDP/RL integration, add source-agnostic validation, improve labels for sources with no culling positives, and engineer more comparable animal-level features.
