# Baseline Robustness Report

- Generated at: `2026-05-14T17:28:34`
- Purpose: check whether baseline performance depends on `source_code` shortcut signal.
- Feature variant: `no_source_code`
- Primary target: `cull_within_90d`

## Best No-Source Time Baseline

- Model: `lightgbm`
- PR-AUC: `0.366231`
- ROC-AUC: `0.790526`
- F1: `0.338776`
- Recall: `0.268608`
- Precision: `0.458564`

## With vs Without Source Code

- Previous with-source Logistic Regression PR-AUC: `0.251048`
- Current no-source best PR-AUC: `0.366231`
- Delta: `0.115182`

## Metrics

| Validation | Target | Model | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `phase_3_split` | `cull_within_30d` | `lightgbm` | `-` | 216 | 105 | 0.7850 | 0.1333 | 0.0916 | 0.0571 | 0.2308 | 0.1027 | 0.1502 |
| `phase_3_split` | `cull_within_30d` | `xgboost` | `-` | 216 | 105 | 0.7344 | 0.1300 | 0.1471 | 0.1905 | 0.1198 | 0.2255 | 0.3390 |
| `phase_3_split` | `cull_within_30d` | `logistic_regression` | `-` | 216 | 105 | 0.7437 | 0.1014 | 0.1546 | 0.7238 | 0.0866 | 0.3545 | 0.4720 |
| `phase_3_split` | `cull_within_30d` | `random_forest` | `-` | 216 | 105 | 0.7068 | 0.0704 | 0.1228 | 0.3619 | 0.0739 | 0.2643 | 0.4411 |
| `phase_3_split` | `cull_within_60d` | `lightgbm` | `-` | 434 | 209 | 0.7861 | 0.2556 | 0.2375 | 0.1818 | 0.3423 | 0.1332 | 0.1680 |
| `phase_3_split` | `cull_within_60d` | `xgboost` | `-` | 434 | 209 | 0.7103 | 0.2223 | 0.2698 | 0.2775 | 0.2624 | 0.2021 | 0.2752 |
| `phase_3_split` | `cull_within_60d` | `logistic_regression` | `-` | 434 | 209 | 0.7443 | 0.1815 | 0.2905 | 0.7416 | 0.1807 | 0.3002 | 0.4023 |
| `phase_3_split` | `cull_within_60d` | `random_forest` | `-` | 434 | 209 | 0.7290 | 0.1405 | 0.2174 | 0.3876 | 0.1511 | 0.2673 | 0.4277 |
| `phase_3_split` | `cull_within_90d` | `lightgbm` | `-` | 651 | 309 | 0.7905 | 0.3662 | 0.3388 | 0.2686 | 0.4586 | 0.1723 | 0.1952 |
| `phase_3_split` | `cull_within_90d` | `xgboost` | `-` | 651 | 309 | 0.7242 | 0.3044 | 0.3136 | 0.2913 | 0.3396 | 0.1914 | 0.2368 |
| `phase_3_split` | `cull_within_90d` | `logistic_regression` | `-` | 651 | 309 | 0.7307 | 0.2462 | 0.3459 | 0.5502 | 0.2522 | 0.2504 | 0.3222 |
| `phase_3_split` | `cull_within_90d` | `random_forest` | `-` | 651 | 309 | 0.7403 | 0.2277 | 0.3144 | 0.4660 | 0.2372 | 0.2504 | 0.3872 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `random_forest` | `-` | 36 | 285 | 0.6000 | 0.0371 | 0.0000 | 0.0000 | 0.0000 | 0.1232 | 0.3122 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `lightgbm` | `-` | 36 | 285 | 0.6112 | 0.0334 | 0.0000 | 0.0000 | 0.0000 | 0.0305 | 0.0295 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `xgboost` | `-` | 36 | 285 | 0.5987 | 0.0279 | 0.0000 | 0.0000 | 0.0000 | 0.0733 | 0.1535 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `logistic_regression` | `-` | 36 | 285 | 0.5111 | 0.0273 | 0.0447 | 0.9614 | 0.0229 | 0.9435 | 0.9535 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `random_forest` | `-` | 70 | 573 | 0.6396 | 0.0717 | 0.0000 | 0.0000 | 0.0000 | 0.1238 | 0.2804 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `logistic_regression` | `-` | 70 | 573 | 0.5407 | 0.0610 | 0.0889 | 0.9459 | 0.0466 | 0.8925 | 0.9088 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `lightgbm` | `-` | 70 | 573 | 0.5666 | 0.0560 | 0.0000 | 0.0000 | 0.0000 | 0.0575 | 0.0521 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `xgboost` | `-` | 70 | 573 | 0.5660 | 0.0526 | 0.0033 | 0.0017 | 0.0263 | 0.0803 | 0.1345 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `logistic_regression` | `-` | 102 | 858 | 0.5595 | 0.0978 | 0.1319 | 0.9079 | 0.0711 | 0.8284 | 0.8541 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `random_forest` | `-` | 102 | 858 | 0.5933 | 0.0899 | 0.0000 | 0.0000 | 0.0000 | 0.1309 | 0.2544 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `xgboost` | `-` | 102 | 858 | 0.5515 | 0.0791 | 0.0022 | 0.0012 | 0.0263 | 0.0897 | 0.1096 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `lightgbm` | `-` | 102 | 858 | 0.5333 | 0.0768 | 0.0000 | 0.0000 | 0.0000 | 0.0771 | 0.0662 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `lightgbm` | `-` | 285 | 36 | 0.5735 | 0.0412 | 0.0833 | 0.1667 | 0.0556 | 0.1108 | 0.1413 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `xgboost` | `-` | 285 | 36 | 0.6052 | 0.0396 | 0.0870 | 0.2500 | 0.0526 | 0.2249 | 0.3713 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `logistic_regression` | `-` | 285 | 36 | 0.6572 | 0.0368 | 0.0416 | 1.0000 | 0.0213 | 0.9560 | 0.9667 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `random_forest` | `-` | 285 | 36 | 0.5639 | 0.0340 | 0.0303 | 0.0278 | 0.0333 | 0.2107 | 0.4099 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `lightgbm` | `-` | 573 | 70 | 0.5889 | 0.0744 | 0.1065 | 0.2000 | 0.0725 | 0.1698 | 0.2180 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `xgboost` | `-` | 573 | 70 | 0.6150 | 0.0728 | 0.1298 | 0.3143 | 0.0818 | 0.2534 | 0.3929 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `random_forest` | `-` | 573 | 70 | 0.6027 | 0.0698 | 0.1331 | 0.5286 | 0.0761 | 0.3189 | 0.5112 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `logistic_regression` | `-` | 573 | 70 | 0.6598 | 0.0676 | 0.0794 | 1.0000 | 0.0413 | 0.9398 | 0.9486 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `random_forest` | `-` | 858 | 102 | 0.5800 | 0.1054 | 0.1138 | 0.7647 | 0.0615 | 0.4106 | 0.5807 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `xgboost` | `-` | 858 | 102 | 0.5965 | 0.1026 | 0.1814 | 0.4118 | 0.1163 | 0.3728 | 0.5103 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `logistic_regression` | `-` | 858 | 102 | 0.6632 | 0.0959 | 0.1136 | 1.0000 | 0.0602 | 0.9245 | 0.9317 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `lightgbm` | `-` | 858 | 102 | 0.5275 | 0.0830 | 0.1538 | 0.2745 | 0.1069 | 0.3976 | 0.5255 |

## Interpretation

- If no-source performance drops sharply, the previous model was mostly using dataset identity.
- Source-holdout validation is the harsher test: it asks whether a model trained on other datasets transfers to a held-out culling-positive source.
- These results should guide feature engineering before MDP/RL work, not be treated as a final production model.

## Decision

- Time-split signal still exists after removing `source_code`, but calibration and precision are weak.
- Source-holdout transfer is poor when primary-horizon holdout models have low or zero recall at the train-selected threshold.
- Do not use the current risk model as a policy component yet. Before MDP/RL integration, add source-agnostic validation, improve labels for sources with no culling positives, and engineer more comparable animal-level features.
