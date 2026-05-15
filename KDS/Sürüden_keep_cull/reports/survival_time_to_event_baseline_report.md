# Survival-Style Baseline Report

- Generated at: `2026-05-15T11:01:22`
- Method: discrete-time 30-day hazard classifier used as a lightweight time-to-event baseline.
- This is not full Cox/Random Survival Forest. It is dependency-light and enough to test whether time-to-cull signal exists before MDP work.

## Metrics

| Model | Hazard ROC-AUC | Hazard PR-AUC | Hazard F1 | Hazard Recall | Hazard Precision | 90d ROC-AUC using hazard score | 90d PR-AUC using hazard score | C-index | Brier | ECE |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `logistic_regression` | 0.8101 | 0.1430 | 0.1985 | 0.7333 | 0.1148 | 0.8090 | 0.3253 | 0.7325 | 0.3359 | 0.4263 |
| `lightgbm` | 0.7791 | 0.1169 | 0.1538 | 0.1238 | 0.2031 | 0.7523 | 0.2412 | 0.6638 | 0.1259 | 0.1706 |

## Decision

- If C-index and 90-day proxy ranking are weak, a full survival model will not fix data coverage by itself.
- If useful, the next step is a real survival package or a discrete hazard panel with richer monthly state transitions.
