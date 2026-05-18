# Survival-Style Baseline Report

- Generated at: `2026-05-16T17:27:10`
- Method: discrete-time 30-day hazard classifier used as a lightweight time-to-event baseline.
- This is not full Cox/Random Survival Forest. It is dependency-light and enough to test whether time-to-cull signal exists before MDP work.

## Metrics

| Model | Hazard ROC-AUC | Hazard PR-AUC | Hazard F1 | Hazard Recall | Hazard Precision | 90d ROC-AUC using hazard score | 90d PR-AUC using hazard score | C-index | Brier | ECE |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `logistic_regression` | 0.8221 | 0.1543 | 0.1974 | 0.7238 | 0.1143 | 0.8227 | 0.3480 | 0.7577 | 0.2942 | 0.3820 |
| `catboost` | 0.7655 | 0.1528 | 0.1841 | 0.2095 | 0.1642 | 0.7539 | 0.3186 | 0.6628 | 0.1525 | 0.2514 |
| `lightgbm` | 0.7738 | 0.1139 | 0.1458 | 0.1333 | 0.1609 | 0.7532 | 0.2405 | 0.6626 | 0.1253 | 0.1568 |

## Decision

- If C-index and 90-day proxy ranking are weak, a full survival model will not fix data coverage by itself.
- If useful, the next step is a real survival package or a discrete hazard panel with richer monthly state transitions.
