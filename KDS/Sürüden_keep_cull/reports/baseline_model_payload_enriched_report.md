# Baseline Risk Model Report

- Generated at: `2026-05-15T10:01:16`
- Input: `data/processed/training/inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv`
- Primary target: `cull_within_90d`
- Selection metric: `pr_auc`
- Split: time-based train/test from Faz 3.

## Best Baseline

- Model: `xgboost`
- Target: `cull_within_90d`
- PR-AUC: `0.376779`
- ROC-AUC: `0.798292`
- F1: `0.373002`
- Recall: `0.339806`
- Calibration Brier: `0.182429`

## Metrics

| Target | Model | Split | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `cull_within_30d` | `logistic_regression` | `phase_3_split` | `-` | 216 | 105 | 0.8098 | 0.1426 | 0.1977 | 0.7333 | 0.1142 | 0.3373 | 0.4277 | 0.8786 |
| `cull_within_30d` | `xgboost` | `phase_3_split` | `-` | 216 | 105 | 0.7779 | 0.1296 | 0.2162 | 0.2286 | 0.2051 | 0.1763 | 0.2735 | 0.8688 |
| `cull_within_30d` | `random_forest` | `phase_3_split` | `-` | 216 | 105 | 0.7486 | 0.1268 | 0.1561 | 0.1524 | 0.1600 | 0.1444 | 0.3002 | 0.6188 |
| `cull_within_30d` | `lightgbm` | `phase_3_split` | `-` | 216 | 105 | 0.7791 | 0.1169 | 0.1538 | 0.1238 | 0.2031 | 0.1259 | 0.1706 | 0.9307 |
| `cull_within_60d` | `lightgbm` | `phase_3_split` | `-` | 434 | 209 | 0.7735 | 0.2658 | 0.3005 | 0.2775 | 0.3277 | 0.1338 | 0.1542 | 0.8882 |
| `cull_within_60d` | `logistic_regression` | `phase_3_split` | `-` | 434 | 209 | 0.8101 | 0.2545 | 0.3096 | 0.7273 | 0.1966 | 0.2752 | 0.3475 | 0.7851 |
| `cull_within_60d` | `xgboost` | `phase_3_split` | `-` | 434 | 209 | 0.7815 | 0.2509 | 0.3412 | 0.3445 | 0.3380 | 0.1736 | 0.2411 | 0.8397 |
| `cull_within_60d` | `random_forest` | `phase_3_split` | `-` | 434 | 209 | 0.7602 | 0.2350 | 0.2308 | 0.1722 | 0.3495 | 0.1737 | 0.3067 | 0.6900 |
| `cull_within_90d` | `xgboost` | `phase_3_split` | `-` | 651 | 309 | 0.7983 | 0.3768 | 0.3730 | 0.3398 | 0.4134 | 0.1824 | 0.2336 | 0.8516 |
| `cull_within_90d` | `logistic_regression` | `phase_3_split` | `-` | 651 | 309 | 0.7969 | 0.3268 | 0.4076 | 0.6246 | 0.3025 | 0.2242 | 0.2684 | 0.7828 |
| `cull_within_90d` | `random_forest` | `phase_3_split` | `-` | 651 | 309 | 0.7651 | 0.3255 | 0.2738 | 0.1909 | 0.4836 | 0.1805 | 0.2852 | 0.6900 |
| `cull_within_90d` | `lightgbm` | `phase_3_split` | `-` | 651 | 309 | 0.7853 | 0.3198 | 0.3121 | 0.2621 | 0.3857 | 0.1403 | 0.1434 | 0.8677 |

## Notes

- PR-AUC is the primary comparison metric because culling positives are rare.
- If the Faz 3 test split has no positive culling examples, the script uses a positive-aware time split for that target and reports the cutoff date.
- Threshold is selected on train data by max F1, then evaluated on test data.
- Calibration is reported with Brier score and expected calibration error; no post-hoc calibration model is applied yet.
- This is supervised risk scoring only; it is not an RL policy.
