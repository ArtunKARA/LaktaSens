# Baseline Risk Model Report

- Generated at: `2026-05-14T13:49:55`
- Input: `data/processed/training/inek_aylik_snapshot_culling_observable_model_ready.csv`
- Primary target: `cull_within_90d`
- Selection metric: `pr_auc`
- Split: time-based train/test from Faz 3.

## Best Baseline

- Model: `logistic_regression`
- Target: `cull_within_90d`
- PR-AUC: `0.188854`
- ROC-AUC: `0.598943`
- F1: `0.210412`
- Recall: `0.941748`
- Calibration Brier: `0.541638`

## Metrics

| Target | Model | Split | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `cull_within_30d` | `logistic_regression` | `phase_3_split` | `-` | 216 | 105 | 0.6067 | 0.0777 | 0.0792 | 0.6571 | 0.0421 | 0.6210 | 0.7339 | 0.7745 |
| `cull_within_30d` | `lightgbm` | `phase_3_split` | `-` | 216 | 105 | 0.6037 | 0.0647 | 0.0502 | 0.0667 | 0.0402 | 0.3896 | 0.4999 | 0.8166 |
| `cull_within_30d` | `xgboost` | `phase_3_split` | `-` | 216 | 105 | 0.6135 | 0.0632 | 0.0903 | 0.6000 | 0.0488 | 0.4059 | 0.5588 | 0.7488 |
| `cull_within_30d` | `random_forest` | `phase_3_split` | `-` | 216 | 105 | 0.6274 | 0.0569 | 0.0870 | 0.1143 | 0.0702 | 0.3040 | 0.4722 | 0.7111 |
| `cull_within_60d` | `logistic_regression` | `phase_3_split` | `-` | 434 | 209 | 0.6038 | 0.1365 | 0.1498 | 0.9330 | 0.0814 | 0.5854 | 0.6919 | 0.4917 |
| `cull_within_60d` | `xgboost` | `phase_3_split` | `-` | 434 | 209 | 0.5927 | 0.0998 | 0.1604 | 0.6651 | 0.0912 | 0.3898 | 0.5297 | 0.6665 |
| `cull_within_60d` | `random_forest` | `phase_3_split` | `-` | 434 | 209 | 0.5990 | 0.0945 | 0.1292 | 0.2201 | 0.0915 | 0.2701 | 0.4306 | 0.5905 |
| `cull_within_60d` | `lightgbm` | `phase_3_split` | `-` | 434 | 209 | 0.5675 | 0.0934 | 0.0724 | 0.1053 | 0.0551 | 0.3355 | 0.4659 | 0.7052 |
| `cull_within_90d` | `logistic_regression` | `phase_3_split` | `-` | 651 | 309 | 0.5989 | 0.1889 | 0.2104 | 0.9417 | 0.1184 | 0.5416 | 0.6434 | 0.4805 |
| `cull_within_90d` | `xgboost` | `phase_3_split` | `-` | 651 | 309 | 0.5905 | 0.1441 | 0.2223 | 0.7055 | 0.1320 | 0.3519 | 0.4803 | 0.6235 |
| `cull_within_90d` | `lightgbm` | `phase_3_split` | `-` | 651 | 309 | 0.5470 | 0.1339 | 0.1196 | 0.1489 | 0.1000 | 0.3003 | 0.4184 | 0.6513 |
| `cull_within_90d` | `random_forest` | `phase_3_split` | `-` | 651 | 309 | 0.5546 | 0.1279 | 0.1665 | 0.2136 | 0.1364 | 0.2499 | 0.3763 | 0.5914 |

## Notes

- PR-AUC is the primary comparison metric because culling positives are rare.
- If the Faz 3 test split has no positive culling examples, the script uses a positive-aware time split for that target and reports the cutoff date.
- Threshold is selected on train data by max F1, then evaluated on test data.
- Calibration is reported with Brier score and expected calibration error; no post-hoc calibration model is applied yet.
- This is supervised risk scoring only; it is not an RL policy.
