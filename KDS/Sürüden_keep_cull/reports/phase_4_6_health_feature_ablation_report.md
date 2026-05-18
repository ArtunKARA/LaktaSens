# Phase 4.6 Health Feature Ablation Selection

- Generated at: `2026-05-18T11:41:43`
- Objective: find a source-agnostic 90-day culling risk candidate after health auxiliary tabularization.
- Evaluation: `cull_within_90d`, no `source_code` categorical feature, time split from Faz 3.
- Model search excludes Random Forest, XGBoost and full LightGBM scan for runtime. Logistic Regression scans all groups; CatBoost is tested only on top scan groups.

## Selected Candidate

- Ablation: `all_health_aux`
- Model: `catboost`
- PR-AUC: `0.379632`
- ROC-AUC: `0.784542`
- Recall: `0.349515`
- Precision: `0.402985`
- Feature count: `111`

## Reference Comparison

| Reference | Model | PR-AUC | ROC-AUC | Recall | Precision |
|---|---|---:|---:|---:|---:|
| Pre-health primary source-including | `catboost` | 0.378601 | 0.768983 | 0.362460 | 0.434109 |
| All-health primary source-including | `xgboost` | 0.347276 | 0.795523 | 0.394822 | 0.398693 |
| Selected source-agnostic ablation | `catboost` | 0.379632 | 0.784542 | 0.349515 | 0.402985 |

## Ablation Metrics

| Ablation | Model | Added health features | PR-AUC | ROC-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `all_health_aux` | `catboost` | 19 | 0.3796 | 0.7845 | 0.3744 | 0.3495 | 0.4030 | 0.1626 | 0.2073 |
| `conductivity_only` | `catboost` | 5 | 0.3469 | 0.7760 | 0.3562 | 0.3107 | 0.4174 | 0.1776 | 0.2296 |
| `base_without_health_aux` | `catboost` | 0 | 0.3392 | 0.7725 | 0.4041 | 0.3851 | 0.4250 | 0.1760 | 0.2157 |
| `conductivity_only` | `logistic_regression` | 5 | 0.3283 | 0.8011 | 0.4085 | 0.6246 | 0.3035 | 0.2210 | 0.2626 |
| `base_without_health_aux` | `logistic_regression` | 0 | 0.3280 | 0.8019 | 0.4126 | 0.6343 | 0.3058 | 0.2215 | 0.2635 |
| `marcenat_scc_metabolic_only` | `logistic_regression` | 8 | 0.3266 | 0.7985 | 0.3883 | 0.5825 | 0.2913 | 0.2155 | 0.2497 |
| `marcenat_all_health_aux` | `logistic_regression` | 14 | 0.3241 | 0.7921 | 0.3817 | 0.4854 | 0.3145 | 0.1803 | 0.1996 |
| `all_health_aux` | `logistic_regression` | 19 | 0.3240 | 0.7918 | 0.3821 | 0.4822 | 0.3163 | 0.1803 | 0.1993 |
| `marcenat_health_counts_only` | `logistic_regression` | 8 | 0.3154 | 0.7904 | 0.3867 | 0.5081 | 0.3121 | 0.1869 | 0.2102 |

## Decision

- This selected candidate is better aligned with source-agnostic transfer than the source-including primary baseline.
- SCC/Chiozza/organic remain tabular auxiliary sources; they are not injected as negative culling labels.
- For the next MDP smoke-test, use this selected source-agnostic candidate as the supervised risk input, while keeping the pre-health CatBoost result as a comparison baseline.
