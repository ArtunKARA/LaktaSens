# Baseline Risk Model Report

- Generated at: `2026-05-14T17:08:35`
- Input: `data/processed/training/inek_aylik_snapshot_culling_observable_engineered_model_ready.csv`
- Primary target: `cull_within_90d`
- Selection metric: `pr_auc`
- Split: time-based train/test from Faz 3.

## Best Baseline

- Model: `lightgbm`
- Target: `cull_within_90d`
- PR-AUC: `0.365644`
- ROC-AUC: `0.784425`
- F1: `0.356364`
- Recall: `0.317152`
- Calibration Brier: `0.173242`

## Metrics

| Target | Model | Split | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `cull_within_30d` | `xgboost` | `phase_3_split` | `-` | 216 | 105 | 0.7424 | 0.1424 | 0.1854 | 0.1810 | 0.1900 | 0.2314 | 0.3451 | 0.8954 |
| `cull_within_30d` | `lightgbm` | `phase_3_split` | `-` | 216 | 105 | 0.7797 | 0.1285 | 0.1077 | 0.0667 | 0.2800 | 0.1055 | 0.1526 | 0.9350 |
| `cull_within_30d` | `logistic_regression` | `phase_3_split` | `-` | 216 | 105 | 0.7746 | 0.1116 | 0.1558 | 0.7143 | 0.0874 | 0.3559 | 0.4811 | 0.7747 |
| `cull_within_30d` | `random_forest` | `phase_3_split` | `-` | 216 | 105 | 0.7120 | 0.0744 | 0.1288 | 0.3619 | 0.0784 | 0.2504 | 0.4256 | 0.6588 |
| `cull_within_60d` | `lightgbm` | `phase_3_split` | `-` | 434 | 209 | 0.7828 | 0.2466 | 0.2089 | 0.1579 | 0.3084 | 0.1314 | 0.1635 | 0.9033 |
| `cull_within_60d` | `xgboost` | `phase_3_split` | `-` | 434 | 209 | 0.7084 | 0.2176 | 0.2712 | 0.2297 | 0.3310 | 0.2001 | 0.2710 | 0.8704 |
| `cull_within_60d` | `logistic_regression` | `phase_3_split` | `-` | 434 | 209 | 0.7758 | 0.1938 | 0.2882 | 0.7225 | 0.1800 | 0.3025 | 0.4127 | 0.7268 |
| `cull_within_60d` | `random_forest` | `phase_3_split` | `-` | 434 | 209 | 0.7308 | 0.1485 | 0.2105 | 0.3828 | 0.1452 | 0.2707 | 0.4294 | 0.6903 |
| `cull_within_90d` | `lightgbm` | `phase_3_split` | `-` | 651 | 309 | 0.7844 | 0.3656 | 0.3564 | 0.3172 | 0.4066 | 0.1732 | 0.1995 | 0.8322 |
| `cull_within_90d` | `xgboost` | `phase_3_split` | `-` | 651 | 309 | 0.7193 | 0.3042 | 0.3113 | 0.3204 | 0.3028 | 0.2027 | 0.2499 | 0.7952 |
| `cull_within_90d` | `logistic_regression` | `phase_3_split` | `-` | 651 | 309 | 0.7509 | 0.2510 | 0.3462 | 0.5372 | 0.2554 | 0.2475 | 0.3179 | 0.7381 |
| `cull_within_90d` | `random_forest` | `phase_3_split` | `-` | 651 | 309 | 0.7359 | 0.2203 | 0.2706 | 0.3722 | 0.2126 | 0.2553 | 0.3918 | 0.6795 |

## Notes

- PR-AUC is the primary comparison metric because culling positives are rare.
- If the Faz 3 test split has no positive culling examples, the script uses a positive-aware time split for that target and reports the cutoff date.
- Threshold is selected on train data by max F1, then evaluated on test data.
- Calibration is reported with Brier score and expected calibration error; no post-hoc calibration model is applied yet.
- This is supervised risk scoring only; it is not an RL policy.
