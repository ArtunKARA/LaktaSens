# Strict Validation Report

- Generated at: `2026-05-16T17:24:34`
- Purpose: test risk model robustness before MDP/reward simulation.
- Feature variant: no `source_code`; reason labels are not used as model features.

## Metrics

| Validation | Model | Test rows | Test animals | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `animal_hash_holdout` | `lightgbm` | 2938 | 72 | 203 | 0.9204 | 0.5099 | 0.4715 | 0.4680 | 0.4750 | 0.0647 | 0.0570 |
| `animal_hash_holdout` | `catboost` | 2938 | 72 | 203 | 0.9234 | 0.4502 | 0.5058 | 0.5369 | 0.4781 | 0.0946 | 0.1430 |
| `animal_hash_holdout` | `logistic_regression` | 2938 | 72 | 203 | 0.9169 | 0.3972 | 0.4819 | 0.6552 | 0.3811 | 0.1137 | 0.1739 |
| `animal_recent_cohort_holdout:2007-11-09` | `catboost` | 2427 | 67 | 199 | 0.8795 | 0.4332 | 0.4070 | 0.5829 | 0.3127 | 0.1687 | 0.2375 |
| `animal_recent_cohort_holdout:2007-11-09` | `lightgbm` | 2427 | 67 | 199 | 0.8671 | 0.4125 | 0.3956 | 0.4523 | 0.3516 | 0.1240 | 0.1285 |
| `animal_recent_cohort_holdout:2007-11-09` | `logistic_regression` | 2427 | 67 | 199 | 0.8635 | 0.3682 | 0.4248 | 0.6533 | 0.3148 | 0.1521 | 0.2004 |
| `phase_3_split` | `catboost` | 2814 | 108 | 309 | 0.7845 | 0.3796 | 0.3744 | 0.3495 | 0.4030 | 0.1626 | 0.2073 |
| `phase_3_split` | `lightgbm` | 2814 | 108 | 309 | 0.7860 | 0.3298 | 0.3608 | 0.3333 | 0.3931 | 0.1395 | 0.1386 |
| `phase_3_split` | `logistic_regression` | 2814 | 108 | 309 | 0.7918 | 0.3240 | 0.3821 | 0.4822 | 0.3163 | 0.1803 | 0.1993 |
| `source_holdout:marcenat_inrae` | `lightgbm` | 12376 | 294 | 858 | 0.6485 | 0.1089 | 0.0000 | 0.0000 | 0.0000 | 0.0693 | 0.0693 |
| `source_holdout:marcenat_inrae` | `logistic_regression` | 12376 | 294 | 858 | 0.6022 | 0.1083 | 0.1632 | 0.2436 | 0.1227 | 0.1841 | 0.1970 |
| `source_holdout:marcenat_inrae` | `catboost` | 12376 | 294 | 858 | 0.5504 | 0.0720 | 0.0000 | 0.0000 | 0.0000 | 0.0685 | 0.0629 |
| `source_holdout:primiparous_social_env` | `lightgbm` | 1694 | 38 | 102 | 0.6245 | 0.1249 | 0.0000 | 0.0000 | 0.0000 | 0.0624 | 0.0469 |
| `source_holdout:primiparous_social_env` | `catboost` | 1694 | 38 | 102 | 0.6604 | 0.1132 | 0.0000 | 0.0000 | 0.0000 | 0.0585 | 0.0316 |
| `source_holdout:primiparous_social_env` | `logistic_regression` | 1694 | 38 | 102 | 0.6558 | 0.1076 | 0.1659 | 0.3333 | 0.1104 | 0.2192 | 0.2760 |

## Decision

- If animal/source/cohort holdout performance is far below time split, the model is not policy-ready.
- Treat the current model as diagnostic until external-source transfer improves.
