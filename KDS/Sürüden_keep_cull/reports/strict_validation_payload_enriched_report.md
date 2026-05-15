# Strict Validation Report

- Generated at: `2026-05-15T11:00:43`
- Purpose: test risk model robustness before MDP/reward simulation.
- Feature variant: no `source_code`; reason labels are not used as model features.

## Metrics

| Validation | Model | Test rows | Test animals | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `animal_hash_holdout` | `lightgbm` | 2938 | 72 | 203 | 0.9126 | 0.4469 | 0.4744 | 0.4335 | 0.5238 | 0.0717 | 0.0704 |
| `animal_hash_holdout` | `logistic_regression` | 2938 | 72 | 203 | 0.9126 | 0.3980 | 0.4926 | 0.6601 | 0.3930 | 0.1178 | 0.1850 |
| `animal_recent_cohort_holdout:2007-11-09` | `lightgbm` | 2427 | 67 | 199 | 0.8746 | 0.3995 | 0.4286 | 0.5126 | 0.3682 | 0.1230 | 0.1364 |
| `animal_recent_cohort_holdout:2007-11-09` | `logistic_regression` | 2427 | 67 | 199 | 0.8631 | 0.3743 | 0.4212 | 0.6583 | 0.3097 | 0.1499 | 0.1981 |
| `phase_3_split` | `logistic_regression` | 2814 | 108 | 309 | 0.7970 | 0.3269 | 0.4080 | 0.6246 | 0.3030 | 0.2244 | 0.2689 |
| `phase_3_split` | `lightgbm` | 2814 | 108 | 309 | 0.7853 | 0.3198 | 0.3121 | 0.2621 | 0.3857 | 0.1403 | 0.1434 |
| `source_holdout:marcenat_inrae` | `logistic_regression` | 12376 | 294 | 858 | 0.6263 | 0.1185 | 0.1562 | 0.7529 | 0.0871 | 0.5996 | 0.6607 |
| `source_holdout:marcenat_inrae` | `lightgbm` | 12376 | 294 | 858 | 0.4570 | 0.0607 | 0.0000 | 0.0000 | 0.0000 | 0.0876 | 0.0822 |
| `source_holdout:primiparous_social_env` | `lightgbm` | 1694 | 38 | 102 | 0.6461 | 0.1275 | 0.0000 | 0.0000 | 0.0000 | 0.0594 | 0.0316 |
| `source_holdout:primiparous_social_env` | `logistic_regression` | 1694 | 38 | 102 | 0.6410 | 0.0956 | 0.1683 | 0.3333 | 0.1126 | 0.2052 | 0.2190 |

## Decision

- If animal/source/cohort holdout performance is far below time split, the model is not policy-ready.
- Treat the current model as diagnostic until external-source transfer improves.
