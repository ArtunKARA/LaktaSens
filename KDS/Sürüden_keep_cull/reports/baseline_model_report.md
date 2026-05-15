# Baseline Risk Model Report

- Generated at: `2026-05-14T09:02:48`
- Input: `data/processed/training/inek_aylik_snapshot_model_ready.csv`
- Primary target: `cull_within_90d`
- Selection metric: `pr_auc`
- Split: time-based train/test from Faz 3.

## Best Baseline

- Model: `logistic_regression`
- Target: `cull_within_90d`
- PR-AUC: `0.228796`
- ROC-AUC: `0.997865`
- F1: `0.219902`
- Recall: `0.994444`
- Calibration Brier: `0.006155`

## Metrics

| Target | Model | Split | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `cull_within_30d` | `logistic_regression` | `positive_aware_time_split` | `2011-10-31` | 264 | 57 | 0.9980 | 0.1049 | 0.0904 | 0.9123 | 0.0475 | 0.0061 | 0.0083 | 0.9596 |
| `cull_within_30d` | `random_forest` | `positive_aware_time_split` | `2011-10-31` | 264 | 57 | 0.9974 | 0.0490 | 0.0253 | 0.0175 | 0.0455 | 0.0026 | 0.0086 | 0.8553 |
| `cull_within_30d` | `xgboost` | `positive_aware_time_split` | `2011-10-31` | 264 | 57 | 0.9974 | 0.0489 | 0.0923 | 0.9123 | 0.0486 | 0.0043 | 0.0051 | 0.9114 |
| `cull_within_30d` | `lightgbm` | `positive_aware_time_split` | `2011-10-31` | 264 | 57 | 0.9973 | 0.0479 | 0.0000 | 0.0000 | 0.0000 | 0.0042 | 0.0045 | 0.9447 |
| `cull_within_60d` | `logistic_regression` | `positive_aware_time_split` | `2011-09-30` | 517 | 126 | 0.9977 | 0.1663 | 0.1569 | 1.0000 | 0.0851 | 0.0068 | 0.0097 | 0.7927 |
| `cull_within_60d` | `random_forest` | `positive_aware_time_split` | `2011-09-30` | 517 | 126 | 0.9974 | 0.1025 | 0.0635 | 0.0476 | 0.0952 | 0.0020 | 0.0092 | 0.8383 |
| `cull_within_60d` | `xgboost` | `positive_aware_time_split` | `2011-09-30` | 517 | 126 | 0.9974 | 0.0999 | 0.1802 | 0.8889 | 0.1003 | 0.0041 | 0.0049 | 0.8875 |
| `cull_within_60d` | `lightgbm` | `positive_aware_time_split` | `2011-09-30` | 517 | 126 | 0.9973 | 0.0962 | 0.0339 | 0.0238 | 0.0588 | 0.0033 | 0.0039 | 0.9143 |
| `cull_within_90d` | `logistic_regression` | `positive_aware_time_split` | `2011-09-30` | 780 | 180 | 0.9979 | 0.2288 | 0.2199 | 0.9944 | 0.1236 | 0.0062 | 0.0088 | 0.7904 |
| `cull_within_90d` | `xgboost` | `positive_aware_time_split` | `2011-09-30` | 780 | 180 | 0.9975 | 0.1439 | 0.2517 | 0.9111 | 0.1460 | 0.0039 | 0.0047 | 0.8745 |
| `cull_within_90d` | `random_forest` | `positive_aware_time_split` | `2011-09-30` | 780 | 180 | 0.9976 | 0.1432 | 0.0620 | 0.0444 | 0.1026 | 0.0026 | 0.0090 | 0.8441 |
| `cull_within_90d` | `lightgbm` | `positive_aware_time_split` | `2011-09-30` | 780 | 180 | 0.9974 | 0.1372 | 0.0643 | 0.0500 | 0.0900 | 0.0032 | 0.0038 | 0.8814 |

## Notes

- PR-AUC is the primary comparison metric because culling positives are rare.
- If the Faz 3 test split has no positive culling examples, the script uses a positive-aware time split for that target and reports the cutoff date.
- Threshold is selected on train data by max F1, then evaluated on test data.
- Calibration is reported with Brier score and expected calibration error; no post-hoc calibration model is applied yet.
- This is supervised risk scoring only; it is not an RL policy.
