# Baseline Culling Observable Comparison

## Why This Was Needed

Initial baseline results looked strong because sources without observed culling events were treated as confirmed negatives. That is not a training-duration issue; it is a label-observability issue.

## Dataset Change

- Original model-ready rows: `271550`
- Culling-observable model-ready rows: `14070`
- Rows from sources without culling events are kept in the corrected full snapshot but excluded from supervised culling label training.

## Primary 90-Day Results

| Run | Feature variant | Model | ROC-AUC | PR-AUC | F1 | Recall | Precision | Notes |
|---|---|---|---:|---:|---:|---:|---:|---|
| Original | with `source_code` | logistic_regression | 0.9979 | 0.2288 | 0.2199 | 0.9944 | 0.1236 | inflated by source/label shortcut risk |
| Culling-observable | with `source_code` | logistic_regression | 0.5989 | 0.1889 | 0.2104 | 0.9417 | 0.1184 | corrected label observability |
| Culling-observable | no `source_code` | logistic_regression | 0.5937 | 0.1867 | 0.2079 | 0.9482 | 0.1168 | source shortcut removed |

## Source-Holdout 90-Day Results

| Held-out source | Best PR-AUC model | ROC-AUC | PR-AUC | F1 | Recall | Precision |
|---|---|---:|---:|---:|---:|---:|
| `marcenat_inrae` | `logistic_regression` | 0.6460 | 0.1258 | 0.1725 | 0.2343 | 0.1365 |
| `primiparous_social_env` | `logistic_regression` | 0.5870 | 0.1221 | 0.0541 | 0.0294 | 0.3333 |

## Decision

- More training alone was not the missing piece. The original issue was mislabeled negatives and source shortcut risk.
- After label correction, performance is more realistic: time-split PR-AUC is modest and calibration is weak.
- Source-holdout transfer is still limited, so this model remains a diagnostic baseline, not an MDP/RL policy component.
- Next useful work is feature engineering: comparable lactation/reproduction/culling-cause features for the culling-observable sources, then recalibration.
