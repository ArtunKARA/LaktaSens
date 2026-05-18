# Reason-Specific Audit and Improvement Report

- Generated at: `2026-05-16T17:27:21`
- Scope: Primiparous survival static features + CatBoost + culling-reason segment audit.
- Leakage guard: reason labels, survival outcome and exit age are audit-only; they are not model features.

## Overall 90-Day Improvement

- Previous best model: `xgboost` PR-AUC `0.376779`, ROC-AUC `0.798292`
- Current best model: `xgboost` PR-AUC `0.347276`, ROC-AUC `0.795523`
- Delta PR-AUC: `-0.029503`
- Delta ROC-AUC: `-0.002769`

## Strict Validation Best By Policy

| Policy | Previous best PR-AUC | Current best model | Current best PR-AUC | Delta |
|---|---:|---|---:|---:|
| `animal_hash_holdout` | 0.4469 | `lightgbm` | 0.5099 | +0.0630 |
| `animal_recent_cohort_holdout:2007-11-09` | 0.3995 | `catboost` | 0.4332 | +0.0337 |
| `phase_3_split` | 0.3269 | `catboost` | 0.3796 | +0.0527 |
| `source_holdout:marcenat_inrae` | 0.1185 | `lightgbm` | 0.1089 | -0.0096 |
| `source_holdout:primiparous_social_env` | 0.1275 | `lightgbm` | 0.1249 | -0.0026 |

## Reason-Specific One-vs-Rest Metrics

| Reason group | Positive rows | ROC-AUC | PR-AUC | F1 | Recall | Precision | Avg risk on positives |
|---|---:|---:|---:|---:|---:|---:|---:|
| `reproductive` | 103 | 0.7789 | 0.1962 | 0.4921 | 0.4563 | 0.5341 | 0.6379 |
| `unknown` | 148 | 0.7902 | 0.1614 | 0.3471 | 0.3986 | 0.3073 | 0.6352 |
| `economic` | 21 | 0.7864 | 0.0274 | 0.4706 | 0.3810 | 0.6154 | 0.6346 |
| `health` | 37 | 0.6903 | 0.0220 | 0.3200 | 0.2162 | 0.6154 | 0.4910 |

## Positive Capture By Reason

| Reason group | Positive rows | Captured | Recall | Avg risk | Median risk | P90 risk |
|---|---:|---:|---:|---:|---:|---:|
| `unknown` | 148 | 59 | 0.3986 | 0.6352 | 0.7273 | 0.9447 |
| `reproductive` | 103 | 47 | 0.4563 | 0.6379 | 0.7487 | 0.9569 |
| `health` | 37 | 8 | 0.2162 | 0.4910 | 0.4271 | 0.8660 |
| `economic` | 21 | 8 | 0.3810 | 0.6346 | 0.7654 | 0.9176 |

## Primiparous Survival Sheet Audit

| 1st lactation survival | Test rows | Animals | 90d positives | 90d positive rate | Avg risk | Median risk | Avg exit age |
|---|---:|---:|---:|---:|---:|---:|---:|
| `YES` | 171 | 11 | 33 | 0.1930 | 0.3265 | 0.2463 | 2149.2 |

## Decision

- CatBoost becomes the best time-split model, but the gain is small.
- Reason-specific audit is mainly diagnostic: reproductive and unknown/status exits dominate the positive set.
- Survival sheet static fields are safe to keep; survival outcome and exit age must remain audit-only.
