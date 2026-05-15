# Payload-Enriched Baseline Calibration Report

- Best model by PR-AUC: `calibrated_lightgbm_sigmoid_cv3`
- Feature variant: `no_source_code`
- Target: `cull_within_90d`
- Split policy: `phase_3_split`

## Metrics

| Model | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `calibrated_lightgbm_sigmoid_cv3` | 0.7890 | 0.3275 | 0.3787 | 0.4142 | 0.3488 | 0.0900 | 0.0408 | 0.3554 |
| `calibrated_logistic_regression_sigmoid_cv3` | 0.7921 | 0.3208 | 0.3696 | 0.7314 | 0.2473 | 0.0917 | 0.0425 | 0.1801 |

## Best Artifact

- `Model/baseline_risk/payload_enriched/calibrated_lightgbm_sigmoid_cv3_no_source_cull_within_90d.joblib`

## Decision Note

Calibration is evaluated as a risk-score quality step. If Brier/ECE do not improve enough, the model should remain diagnostic and should not feed MDP rewards directly.
