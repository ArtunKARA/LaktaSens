# Engineered Baseline Calibration Report

- Best model by PR-AUC: `calibrated_lightgbm_sigmoid_cv3`
- Feature variant: `engineered_no_source_code`
- Target: `cull_within_90d`
- Split policy: `phase_3_split`

## Metrics

| Model | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `calibrated_lightgbm_sigmoid_cv3` | 0.7751 | 0.3489 | 0.3321 | 0.2977 | 0.3755 | 0.0872 | 0.0319 | 0.2370 |
| `calibrated_logistic_regression_sigmoid_cv3` | 0.7684 | 0.2577 | 0.3233 | 0.5016 | 0.2385 | 0.0939 | 0.0424 | 0.1119 |

## Best Artifact

- `Model/baseline_risk/engineered/calibrated_lightgbm_sigmoid_cv3_no_source_cull_within_90d.joblib`

## Decision Note

Calibration is evaluated as a risk-score quality step. If Brier/ECE do not improve enough, the model should remain diagnostic and should not feed MDP rewards directly.
