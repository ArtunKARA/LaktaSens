# Baseline Robustness Report

- Generated at: `2026-05-14T13:56:03`
- Purpose: check whether baseline performance depends on `source_code` shortcut signal.
- Feature variant: `no_source_code`
- Primary target: `cull_within_90d`

## Best No-Source Time Baseline

- Model: `logistic_regression`
- PR-AUC: `0.186688`
- ROC-AUC: `0.593742`
- F1: `0.207949`
- Recall: `0.948220`
- Precision: `0.116780`

## With vs Without Source Code

- Previous with-source Logistic Regression PR-AUC: `0.188854`
- Current no-source best PR-AUC: `0.186688`
- Delta: `-0.002167`

## Metrics

| Validation | Target | Model | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `phase_3_split` | `cull_within_30d` | `logistic_regression` | `-` | 216 | 105 | 0.6024 | 0.0772 | 0.0781 | 0.6476 | 0.0415 | 0.6235 | 0.7359 |
| `phase_3_split` | `cull_within_30d` | `lightgbm` | `-` | 216 | 105 | 0.6063 | 0.0649 | 0.0504 | 0.0667 | 0.0405 | 0.3906 | 0.5010 |
| `phase_3_split` | `cull_within_30d` | `xgboost` | `-` | 216 | 105 | 0.6105 | 0.0647 | 0.0901 | 0.5905 | 0.0487 | 0.4017 | 0.5567 |
| `phase_3_split` | `cull_within_30d` | `random_forest` | `-` | 216 | 105 | 0.6259 | 0.0575 | 0.0984 | 0.6571 | 0.0532 | 0.3081 | 0.5109 |
| `phase_3_split` | `cull_within_60d` | `logistic_regression` | `-` | 434 | 209 | 0.5988 | 0.1353 | 0.1478 | 0.9378 | 0.0802 | 0.5875 | 0.6935 |
| `phase_3_split` | `cull_within_60d` | `random_forest` | `-` | 434 | 209 | 0.6087 | 0.1062 | 0.1265 | 0.1770 | 0.0984 | 0.2971 | 0.4737 |
| `phase_3_split` | `cull_within_60d` | `xgboost` | `-` | 434 | 209 | 0.5946 | 0.1011 | 0.1588 | 0.6746 | 0.0900 | 0.3894 | 0.5301 |
| `phase_3_split` | `cull_within_60d` | `lightgbm` | `-` | 434 | 209 | 0.5687 | 0.0927 | 0.0736 | 0.1100 | 0.0553 | 0.3353 | 0.4656 |
| `phase_3_split` | `cull_within_90d` | `logistic_regression` | `-` | 651 | 309 | 0.5937 | 0.1867 | 0.2079 | 0.9482 | 0.1168 | 0.5431 | 0.6445 |
| `phase_3_split` | `cull_within_90d` | `random_forest` | `-` | 651 | 309 | 0.5792 | 0.1521 | 0.1664 | 0.1974 | 0.1439 | 0.2712 | 0.4159 |
| `phase_3_split` | `cull_within_90d` | `xgboost` | `-` | 651 | 309 | 0.5872 | 0.1417 | 0.2220 | 0.7055 | 0.1317 | 0.3476 | 0.4770 |
| `phase_3_split` | `cull_within_90d` | `lightgbm` | `-` | 651 | 309 | 0.5453 | 0.1308 | 0.1158 | 0.1424 | 0.0976 | 0.3001 | 0.4173 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `logistic_regression` | `-` | 36 | 285 | 0.6827 | 0.0511 | 0.0838 | 0.1298 | 0.0619 | 0.1504 | 0.3030 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `random_forest` | `-` | 36 | 285 | 0.5863 | 0.0337 | 0.0000 | 0.0000 | 0.0000 | 0.1319 | 0.3302 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `lightgbm` | `-` | 36 | 285 | 0.5613 | 0.0290 | 0.0000 | 0.0000 | 0.0000 | 0.0259 | 0.0264 |
| `source_holdout:marcenat_inrae` | `cull_within_30d` | `xgboost` | `-` | 36 | 285 | 0.5605 | 0.0254 | 0.0000 | 0.0000 | 0.0000 | 0.0490 | 0.1281 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `logistic_regression` | `-` | 70 | 573 | 0.6654 | 0.0913 | 0.1299 | 0.1658 | 0.1067 | 0.1534 | 0.2808 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `random_forest` | `-` | 70 | 573 | 0.6136 | 0.0662 | 0.0000 | 0.0000 | 0.0000 | 0.1423 | 0.3132 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `lightgbm` | `-` | 70 | 573 | 0.5905 | 0.0587 | 0.0000 | 0.0000 | 0.0000 | 0.0480 | 0.0373 |
| `source_holdout:marcenat_inrae` | `cull_within_60d` | `xgboost` | `-` | 70 | 573 | 0.5444 | 0.0535 | 0.0000 | 0.0000 | 0.0000 | 0.0654 | 0.1022 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `logistic_regression` | `-` | 102 | 858 | 0.6460 | 0.1258 | 0.1725 | 0.2343 | 0.1365 | 0.2022 | 0.3086 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `random_forest` | `-` | 102 | 858 | 0.6217 | 0.0936 | 0.0000 | 0.0000 | 0.0000 | 0.1407 | 0.2772 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `lightgbm` | `-` | 102 | 858 | 0.5923 | 0.0867 | 0.0000 | 0.0000 | 0.0000 | 0.0711 | 0.0599 |
| `source_holdout:marcenat_inrae` | `cull_within_90d` | `xgboost` | `-` | 102 | 858 | 0.5818 | 0.0846 | 0.0000 | 0.0000 | 0.0000 | 0.0872 | 0.1182 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `logistic_regression` | `-` | 285 | 36 | 0.5518 | 0.0630 | 0.0000 | 0.0000 | 0.0000 | 0.1965 | 0.4181 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `random_forest` | `-` | 285 | 36 | 0.5334 | 0.0325 | 0.0317 | 0.0278 | 0.0370 | 0.1522 | 0.3072 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `xgboost` | `-` | 285 | 36 | 0.4875 | 0.0270 | 0.0556 | 0.0556 | 0.0556 | 0.2401 | 0.4198 |
| `source_holdout:primiparous_social_env` | `cull_within_30d` | `lightgbm` | `-` | 285 | 36 | 0.3946 | 0.0180 | 0.0238 | 0.0278 | 0.0208 | 0.2904 | 0.4484 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `logistic_regression` | `-` | 573 | 70 | 0.5806 | 0.0947 | 0.0519 | 0.0286 | 0.2857 | 0.2032 | 0.4042 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `random_forest` | `-` | 573 | 70 | 0.4902 | 0.0489 | 0.0764 | 0.0857 | 0.0690 | 0.2353 | 0.3967 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `xgboost` | `-` | 573 | 70 | 0.4950 | 0.0464 | 0.0976 | 0.1143 | 0.0851 | 0.2639 | 0.4405 |
| `source_holdout:primiparous_social_env` | `cull_within_60d` | `lightgbm` | `-` | 573 | 70 | 0.4177 | 0.0351 | 0.0421 | 0.2857 | 0.0228 | 0.3241 | 0.4854 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `logistic_regression` | `-` | 858 | 102 | 0.5870 | 0.1221 | 0.0541 | 0.0294 | 0.3333 | 0.2096 | 0.3922 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `xgboost` | `-` | 858 | 102 | 0.4732 | 0.0708 | 0.0963 | 0.1275 | 0.0774 | 0.2728 | 0.4384 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `random_forest` | `-` | 858 | 102 | 0.4068 | 0.0490 | 0.0676 | 0.3333 | 0.0376 | 0.3213 | 0.4620 |
| `source_holdout:primiparous_social_env` | `cull_within_90d` | `lightgbm` | `-` | 858 | 102 | 0.3964 | 0.0464 | 0.0690 | 0.3529 | 0.0383 | 0.3451 | 0.4896 |

## Interpretation

- If no-source performance drops sharply, the previous model was mostly using dataset identity.
- Source-holdout validation is the harsher test: it asks whether a model trained on other datasets transfers to a held-out culling-positive source.
- These results should guide feature engineering before MDP/RL work, not be treated as a final production model.

## Decision

- Time-split signal still exists after removing `source_code`, but calibration and precision are weak.
- Source-holdout transfer is poor when primary-horizon holdout models have low or zero recall at the train-selected threshold.
- Do not use the current risk model as a policy component yet. Before MDP/RL integration, add source-agnostic validation, improve labels for sources with no culling positives, and engineer more comparable animal-level features.
