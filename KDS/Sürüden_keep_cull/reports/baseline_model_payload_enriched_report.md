# Baseline Risk Model Report

- Generated at: `2026-05-16T17:12:56`
- Input: `data/processed/training/inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv`
- Primary target: `cull_within_90d`
- Selection metric: `pr_auc`
- Split: time-based train/test from Faz 3.

## Best Baseline

- Model: `xgboost`
- Target: `cull_within_90d`
- PR-AUC: `0.347276`
- ROC-AUC: `0.795523`
- F1: `0.396748`
- Recall: `0.394822`
- Calibration Brier: `0.169001`

## Metrics

| Target | Model | Split | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `cull_within_30d` | `logistic_regression` | `phase_3_split` | `-` | 216 | 105 | 0.8208 | 0.1522 | 0.1977 | 0.7238 | 0.1145 | 0.2955 | 0.3831 | 0.8468 |
| `cull_within_30d` | `catboost` | `phase_3_split` | `-` | 216 | 105 | 0.7756 | 0.1227 | 0.1811 | 0.2286 | 0.1500 | 0.1864 | 0.2962 | 0.8669 |
| `cull_within_30d` | `xgboost` | `phase_3_split` | `-` | 216 | 105 | 0.7856 | 0.1150 | 0.1862 | 0.2571 | 0.1459 | 0.1649 | 0.2583 | 0.8445 |
| `cull_within_30d` | `lightgbm` | `phase_3_split` | `-` | 216 | 105 | 0.7738 | 0.1139 | 0.1458 | 0.1333 | 0.1609 | 0.1253 | 0.1568 | 0.9210 |
| `cull_within_30d` | `random_forest` | `phase_3_split` | `-` | 216 | 105 | 0.7585 | 0.1119 | 0.1920 | 0.2286 | 0.1655 | 0.1350 | 0.2845 | 0.6238 |
| `cull_within_60d` | `catboost` | `phase_3_split` | `-` | 434 | 209 | 0.7769 | 0.2828 | 0.3279 | 0.2871 | 0.3822 | 0.1643 | 0.2437 | 0.8600 |
| `cull_within_60d` | `xgboost` | `phase_3_split` | `-` | 434 | 209 | 0.7956 | 0.2716 | 0.3077 | 0.2967 | 0.3196 | 0.1669 | 0.2312 | 0.8638 |
| `cull_within_60d` | `logistic_regression` | `phase_3_split` | `-` | 434 | 209 | 0.8231 | 0.2653 | 0.3557 | 0.6603 | 0.2434 | 0.2238 | 0.2859 | 0.8229 |
| `cull_within_60d` | `lightgbm` | `phase_3_split` | `-` | 434 | 209 | 0.7905 | 0.2437 | 0.2857 | 0.3254 | 0.2547 | 0.1473 | 0.1572 | 0.8329 |
| `cull_within_60d` | `random_forest` | `phase_3_split` | `-` | 434 | 209 | 0.7678 | 0.2293 | 0.2521 | 0.2201 | 0.2949 | 0.1652 | 0.2946 | 0.6733 |
| `cull_within_90d` | `xgboost` | `phase_3_split` | `-` | 651 | 309 | 0.7955 | 0.3473 | 0.3967 | 0.3948 | 0.3987 | 0.1690 | 0.2099 | 0.8076 |
| `cull_within_90d` | `catboost` | `phase_3_split` | `-` | 651 | 309 | 0.7795 | 0.3460 | 0.3702 | 0.3463 | 0.3978 | 0.1668 | 0.2143 | 0.8260 |
| `cull_within_90d` | `lightgbm` | `phase_3_split` | `-` | 651 | 309 | 0.7860 | 0.3298 | 0.3608 | 0.3333 | 0.3931 | 0.1395 | 0.1386 | 0.8409 |
| `cull_within_90d` | `logistic_regression` | `phase_3_split` | `-` | 651 | 309 | 0.7913 | 0.3238 | 0.3841 | 0.4854 | 0.3178 | 0.1801 | 0.1986 | 0.7878 |
| `cull_within_90d` | `random_forest` | `phase_3_split` | `-` | 651 | 309 | 0.7743 | 0.3154 | 0.2816 | 0.2233 | 0.3812 | 0.1720 | 0.2748 | 0.6822 |

## Notes

- PR-AUC is the primary comparison metric because culling positives are rare.
- If the Faz 3 test split has no positive culling examples, the script uses a positive-aware time split for that target and reports the cutoff date.
- Threshold is selected on train data by max F1, then evaluated on test data.
- Calibration is reported with Brier score and expected calibration error; no post-hoc calibration model is applied yet.
- This is supervised risk scoring only; it is not an RL policy.
