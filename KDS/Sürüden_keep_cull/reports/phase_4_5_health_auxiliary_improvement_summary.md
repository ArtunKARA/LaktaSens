# Phase 4.5 Health Auxiliary Tabularization and Model Impact

- Generated at: `2026-05-16T18:00:21`
- Scope: SCC RAR, organic SCM DOCX and Chiozza lameness XLSX tabularization; leakage-safe health feature enrichment; metric comparison against `pre_health_auxiliary` archive.

## Decision Summary

- Tabularization succeeded and should stay in the pipeline.
- SCC and Chiozza remain auxiliary because current files do not provide culling-observable labels aligned to the training set.
- Organic SCM is aggregate supplemental data, not animal-level training data.
- Health features improved several no-source/strict validation views, but the source-including primary baseline fell. For MDP readiness, use these features as candidate/ablation inputs, not as a guaranteed replacement for the previous best risk model.

## Tabularized Health Files

| Source | Status | Rows | File |
|---|---|---:|---|
| `scc_grazing_cows` | `tabularized` | 822797 | `data/processed/tabular_health_sources/scc_grazing_cows/milk_yield.csv` |
| `scc_grazing_cows` | `tabularized` | 802066 | `data/processed/tabular_health_sources/scc_grazing_cows/conception.csv` |
| `scc_grazing_cows` | `tabularized` | 918284 | `data/processed/tabular_health_sources/scc_grazing_cows/insemination_rate.csv` |
| `organic_scm` | `tabularized` | 7 | `data/processed/tabular_health_sources/organic_scm/organic_scm_table_1.csv` |
| `chiozza_lameness` | `tabularized` | 8035 | `data/processed/tabular_health_sources/chiozza_lameness/chiozza_lameness_raw_hoja1.csv` |
| `chiozza_lameness` | `tabularized` | 8035 | `data/processed/tabular_health_sources/chiozza_lameness/chiozza_lameness_normalized.csv` |

## Primary Time Split 90d

| Metric | Previous | Current | Delta |
|---|---:|---:|---:|
| Best model | `catboost` | `xgboost` | - |
| PR-AUC | 0.378601 | 0.347276 | -0.031325 |
| ROC-AUC | 0.768983 | 0.795523 | +0.026540 |
| Recall | 0.362460 | 0.394822 | +0.032362 |
| Precision | 0.434109 | 0.398693 | -0.035416 |

## Strict Validation Best By Policy

| Policy | Previous model | Previous PR-AUC | Current model | Current PR-AUC | Delta |
|---|---|---:|---|---:|---:|
| `animal_hash_holdout` | `lightgbm` | 0.4584 | `lightgbm` | 0.5099 | +0.0515 |
| `animal_recent_cohort_holdout:2007-11-09` | `logistic_regression` | 0.3745 | `catboost` | 0.4332 | +0.0587 |
| `phase_3_split` | `catboost` | 0.3392 | `catboost` | 0.3796 | +0.0404 |
| `source_holdout:marcenat_inrae` | `lightgbm` | 0.1089 | `lightgbm` | 0.1089 | +0.0000 |
| `source_holdout:primiparous_social_env` | `lightgbm` | 0.1275 | `lightgbm` | 0.1249 | -0.0026 |

## Survival-Style Hazard

| Metric | Previous | Current | Delta |
|---|---:|---:|---:|
| Best model | `logistic_regression` | `logistic_regression` | - |
| Hazard PR-AUC | 0.152483 | 0.154263 | +0.001781 |
| C-index | 0.749882 | 0.757741 | +0.007859 |

## Reason-Specific 90d Audit

| Reason | Previous PR-AUC | Current PR-AUC | Delta | Previous recall | Current recall | Delta |
|---|---:|---:|---:|---:|---:|---:|
| `economic` | 0.0465 | 0.0274 | -0.0192 | 0.4286 | 0.3810 | -0.0476 |
| `health` | 0.0177 | 0.0220 | +0.0042 | 0.0541 | 0.2162 | +0.1622 |
| `reproductive` | 0.2179 | 0.1962 | -0.0217 | 0.4466 | 0.4563 | +0.0097 |
| `unknown` | 0.1646 | 0.1614 | -0.0032 | 0.3716 | 0.3986 | +0.0270 |

## Added Feature Coverage

| Feature | Non-null rows | Coverage | Non-zero rows |
|---|---:|---:|---:|
| `has_marcenat_prev_health_summary` | 14070 | 1.0000 | 9293 |
| `marcenat_prev_lact_mastitis_count` | 8470 | 0.6020 | 2688 |
| `marcenat_prev_lact_lameness_count` | 8470 | 0.6020 | 2708 |
| `marcenat_prev_lact_other_health_count` | 8470 | 0.6020 | 4700 |
| `marcenat_prev_lact_health_total_count` | 8470 | 0.6020 | 6510 |
| `marcenat_prev_lact_cell_total` | 8067 | 0.5733 | 8067 |
| `marcenat_prev_lact_cell_total_source_p75_flag` | 8067 | 0.5733 | 1935 |
| `marcenat_prev_lact_tb_tp` | 8146 | 0.5790 | 8146 |
| `marcenat_prev_lact_tb_tp_less_pct` | 8146 | 0.5790 | 5333 |
| `marcenat_prev_lact_tb_tp_more_pct` | 8146 | 0.5790 | 6242 |
| `marcenat_prev_lact_completed_dim` | 9293 | 0.6605 | 9293 |
| `marcenat_prev_lact_days_since_dryoff` | 9293 | 0.6605 | 9274 |
| `marcenat_prev_lact_mastitis_any` | 9293 | 0.6605 | 2688 |
| `marcenat_prev_lact_lameness_any` | 9293 | 0.6605 | 2708 |
| `sensor_conductivity_available_30` | 14070 | 1.0000 | 292 |
| `sensor_conductivity_available_90` | 14070 | 1.0000 | 341 |
| `sensor_conductivity_high_30_train_p75_flag` | 292 | 0.0208 | 73 |
| `sensor_conductivity_high_90_train_p75_flag` | 341 | 0.0242 | 86 |
| `sensor_conductivity_rise_flag` | 263 | 0.0187 | 132 |

## Recommendation

- Keep `scripts/24_tabularize_health_auxiliary_sources.py` as the health-source normalization entry point.
- Keep `scripts/25_engineer_health_auxiliary_features.py` as an ablation feature layer.
- Do not claim SCC/organic/Chiozza improve culling prediction until animal-level culling labels or reliable ID overlap are available.
- For MDP smoke-test, prefer the best strict/no-source model view over a source-including score when source transfer is the concern.
