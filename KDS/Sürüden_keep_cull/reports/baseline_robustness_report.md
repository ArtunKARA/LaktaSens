# Baseline Robustness Report

- Generated at: `2026-05-14T09:43:20`
- Purpose: check whether baseline performance depends on `source_code` shortcut signal.
- Feature variant: `no_source_code`
- Primary target: `cull_within_90d`

## Best No-Source Time Baseline

- Model: `logistic_regression`
- PR-AUC: `0.216100`
- ROC-AUC: `0.970821`
- F1: `0.015675`
- Recall: `0.950000`
- Precision: `0.007903`

## With vs Without Source Code

- Previous with-source Logistic Regression PR-AUC: `0.228796`
- Current no-source best PR-AUC: `0.216100`
- Delta: `-0.012696`

## Metrics

| Validation | Target | Model | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `positive_aware_time_split` | `cull_within_30d` | `logistic_regression` | `2011-10-31` | 264 | 57 | 0.9753 | 0.1004 | 0.0606 | 0.9123 | 0.0313 | 0.1168 | 0.2413 |
| `positive_aware_time_split` | `cull_within_30d` | `xgboost` | `2011-10-31` | 264 | 57 | 0.9920 | 0.0437 | 0.0878 | 0.9123 | 0.0461 | 0.0080 | 0.0168 |
| `positive_aware_time_split` | `cull_within_30d` | `random_forest` | `2011-10-31` | 264 | 57 | 0.9897 | 0.0422 | 0.0000 | 0.0000 | 0.0000 | 0.0165 | 0.0649 |
| `positive_aware_time_split` | `cull_within_30d` | `lightgbm` | `2011-10-31` | 264 | 57 | 0.9902 | 0.0405 | 0.0000 | 0.0000 | 0.0000 | 0.0064 | 0.0084 |
| `positive_aware_time_split` | `cull_within_60d` | `logistic_regression` | `2011-09-30` | 517 | 126 | 0.9747 | 0.1571 | 0.0119 | 0.9524 | 0.0060 | 0.1258 | 0.2595 |
| `positive_aware_time_split` | `cull_within_60d` | `xgboost` | `2011-09-30` | 517 | 126 | 0.9946 | 0.0867 | 0.1636 | 0.9048 | 0.0899 | 0.0104 | 0.0240 |
| `positive_aware_time_split` | `cull_within_60d` | `random_forest` | `2011-09-30` | 517 | 126 | 0.9908 | 0.0719 | 0.0556 | 0.0556 | 0.0556 | 0.0196 | 0.0751 |
| `positive_aware_time_split` | `cull_within_60d` | `lightgbm` | `2011-09-30` | 517 | 126 | 0.9924 | 0.0647 | 0.0172 | 0.0238 | 0.0135 | 0.0067 | 0.0108 |
| `positive_aware_time_split` | `cull_within_90d` | `logistic_regression` | `2011-09-30` | 780 | 180 | 0.9708 | 0.2161 | 0.0157 | 0.9500 | 0.0079 | 0.1292 | 0.2696 |
| `positive_aware_time_split` | `cull_within_90d` | `xgboost` | `2011-09-30` | 780 | 180 | 0.9949 | 0.1226 | 0.2154 | 0.8944 | 0.1224 | 0.0121 | 0.0286 |
| `positive_aware_time_split` | `cull_within_90d` | `random_forest` | `2011-09-30` | 780 | 180 | 0.9906 | 0.1067 | 0.0374 | 0.0389 | 0.0361 | 0.0217 | 0.0803 |
| `positive_aware_time_split` | `cull_within_90d` | `lightgbm` | `2011-09-30` | 780 | 180 | 0.9918 | 0.0854 | 0.0295 | 0.0444 | 0.0221 | 0.0076 | 0.0126 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `logistic_regression` | `-` | 36 | 285 | 0.6827 | 0.0511 | 0.0000 | 0.0000 | 0.0000 | 0.0596 | 0.1926 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `random_forest` | `-` | 36 | 285 | 0.6402 | 0.0319 | 0.0000 | 0.0000 | 0.0000 | 0.0306 | 0.0775 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `xgboost` | `-` | 36 | 285 | 0.4578 | 0.0213 | 0.0000 | 0.0000 | 0.0000 | 0.0272 | 0.0209 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `lightgbm` | `-` | 36 | 285 | 0.4389 | 0.0204 | 0.0000 | 0.0000 | 0.0000 | 0.0230 | 0.0229 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `random_forest` | `-` | 70 | 573 | 0.6390 | 0.0655 | 0.0000 | 0.0000 | 0.0000 | 0.0582 | 0.0970 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `lightgbm` | `-` | 70 | 573 | 0.4930 | 0.0509 | 0.0000 | 0.0000 | 0.0000 | 0.0464 | 0.0466 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `xgboost` | `-` | 70 | 573 | 0.4884 | 0.0479 | 0.0000 | 0.0000 | 0.0000 | 0.0498 | 0.0374 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `logistic_regression` | `-` | 70 | 573 | 0.3346 | 0.0314 | 0.0000 | 0.0000 | 0.0000 | 0.0710 | 0.1596 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `random_forest` | `-` | 102 | 858 | 0.6268 | 0.0932 | 0.0000 | 0.0000 | 0.0000 | 0.0738 | 0.0740 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `xgboost` | `-` | 102 | 858 | 0.5057 | 0.0777 | 0.0000 | 0.0000 | 0.0000 | 0.0709 | 0.0590 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `lightgbm` | `-` | 102 | 858 | 0.4700 | 0.0704 | 0.0000 | 0.0000 | 0.0000 | 0.0695 | 0.0697 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `logistic_regression` | `-` | 102 | 858 | 0.3540 | 0.0487 | 0.0000 | 0.0000 | 0.0000 | 0.0892 | 0.1511 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `xgboost` | `-` | 285 | 36 | 0.5458 | 0.0619 | 0.0000 | 0.0000 | 0.0000 | 0.0212 | 0.0211 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `lightgbm` | `-` | 285 | 36 | 0.6353 | 0.0441 | 0.0000 | 0.0000 | 0.0000 | 0.0213 | 0.0212 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `logistic_regression` | `-` | 285 | 36 | 0.4027 | 0.0252 | 0.0000 | 0.0000 | 0.0000 | 0.0213 | 0.0212 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `random_forest` | `-` | 285 | 36 | 0.5081 | 0.0210 | 0.0000 | 0.0000 | 0.0000 | 0.0223 | 0.0062 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `lightgbm` | `-` | 573 | 70 | 0.5494 | 0.0596 | 0.0000 | 0.0000 | 0.0000 | 0.0413 | 0.0413 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `xgboost` | `-` | 573 | 70 | 0.4332 | 0.0514 | 0.0000 | 0.0000 | 0.0000 | 0.0413 | 0.0407 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `random_forest` | `-` | 573 | 70 | 0.4970 | 0.0381 | 0.0000 | 0.0000 | 0.0000 | 0.0426 | 0.0552 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `logistic_regression` | `-` | 573 | 70 | 0.3709 | 0.0369 | 0.0000 | 0.0000 | 0.0000 | 0.0413 | 0.0413 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `lightgbm` | `-` | 858 | 102 | 0.5327 | 0.0785 | 0.0000 | 0.0000 | 0.0000 | 0.0602 | 0.0602 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `random_forest` | `-` | 858 | 102 | 0.4607 | 0.0536 | 0.0000 | 0.0000 | 0.0000 | 0.0604 | 0.0344 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `xgboost` | `-` | 858 | 102 | 0.4266 | 0.0495 | 0.0000 | 0.0000 | 0.0000 | 0.0602 | 0.0596 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `logistic_regression` | `-` | 858 | 102 | 0.3546 | 0.0459 | 0.0000 | 0.0000 | 0.0000 | 0.0602 | 0.0602 |

## Interpretation

- If no-source performance drops sharply, the previous model was mostly using dataset identity.
- Source-holdout validation is the harsher test: it asks whether a model trained on other datasets transfers to a held-out culling-positive source.
- These results should guide feature engineering before MDP/RL work, not be treated as a final production model.

## Decision

- Time-split signal still exists after removing `source_code`, but calibration and precision are weak.
- Source-holdout transfer is poor: all primary-horizon holdout models have F1/recall `0` at the train-selected threshold.
- Do not use the current risk model as a policy component yet. Before MDP/RL integration, add source-agnostic validation, improve labels for sources with no culling positives, and engineer more comparable animal-level features.
