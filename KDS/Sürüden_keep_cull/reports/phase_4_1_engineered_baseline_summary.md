# Phase 4.1 Engineered Baseline Summary

## What Changed

- Added rolling, source-agnostic features for culling-observable snapshots.
- Added missingness flags because Marcenat and Primiparous expose different observation channels.
- Kept culling reason / future exit status out of features to avoid leakage.
- Added sigmoid calibration for no-source engineered models.

## Primary 90-Day Comparison

| Run | Model | Feature variant | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Culling-observable baseline | `logistic_regression` | with source config | 0.5989 | 0.1889 | 0.2104 | 0.9417 | 0.1184 | 0.5416 | 0.6434 |
| Engineered baseline | `lightgbm` | with source config | 0.7844 | 0.3656 | 0.3564 | 0.3172 | 0.4066 | 0.1732 | 0.1995 |
| Engineered robust | `lightgbm` | no source_code | 0.7905 | 0.3662 | 0.3388 | 0.2686 | 0.4586 | 0.1723 | 0.1952 |
| Engineered calibrated | `calibrated_lightgbm_sigmoid_cv3` | no source_code + sigmoid calibration | 0.7751 | 0.3489 | 0.3321 | 0.2977 | 0.3755 | 0.0872 | 0.0319 |

## Source-Holdout 90-Day Check

| Held-out source | Best model | ROC-AUC | PR-AUC | F1 | Recall | Precision |
|---|---|---:|---:|---:|---:|---:|
| `marcenat_inrae` | `logistic_regression` | 0.5595 | 0.0978 | 0.1319 | 0.9079 | 0.0711 |
| `primiparous_social_env` | `random_forest` | 0.5800 | 0.1054 | 0.1138 | 0.7647 | 0.0615 |

## Decision

- Feature engineering materially improved the time-split baseline: primary PR-AUC rose from the corrected baseline level to about `0.36`.
- Removing `source_code` no longer hurts; the best no-source PR-AUC is approximately the same as with-source. That is a good sign.
- Calibration strongly improved Brier/ECE, but calibrated PR-AUC is slightly below uncalibrated LightGBM. For probability use, calibrated LightGBM is the current best candidate.
- Source-holdout transfer is still only moderate/weak. The model is now useful as a diagnostic risk model and possibly for MDP smoke tests, but not yet as a trusted policy component.

## Next Work

- Add source-holdout-oriented calibration or per-source threshold review.
- Improve Marcenat/Primiparous shared features, especially comparable fertility and lifecycle features.
- Only after source-holdout behavior improves should this risk model feed MDP transition probabilities.
