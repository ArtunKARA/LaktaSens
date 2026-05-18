# Health Auxiliary Feature Enrichment Report

- Generated at: `2026-05-16T18:00:01`
- Model-ready rows: `14070`
- Scope: tabularized SCC/organic/Chiozza review plus leakage-safe health features for culling-observable training rows.

## Modeling Decision

- SCC grazing cows and Chiozza lameness are now tabular files, but current IDs do not overlap the culling-observable training set and no observed culling labels are available from those sources.
- Organic SCM DOCX exposes aggregate farm-level supplemental data, not animal-level model rows.
- Therefore they are kept as auxiliary schema/evidence sources and are not treated as negative culling examples.
- Features added to the culling model come from sources already inside the culling-observable set: Marcenat prior completed lactation health summaries and Primiparous conductivity proxies.

## Thresholds

- Marcenat `CELL total` source p75: `21687.680074472428`
- Primiparous train `sensor_conductivity_avg_30` p75: `10.16634218364135`
- Primiparous train `sensor_conductivity_avg_90` p75: `10.162222730778542`

## Training Source Rows

| Source | Rows | Positive 90d rows |
|---|---:|---:|
| `marcenat_inrae` | 12376 | 858 |
| `primiparous_social_env` | 1694 | 102 |

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

## Tabularized Auxiliary Files

| Source | Status | Rows | File |
|---|---|---:|---|
| `scc_grazing_cows` | `tabularized` | 822797 | `data/processed/tabular_health_sources/scc_grazing_cows/milk_yield.csv` |
| `scc_grazing_cows` | `tabularized` | 802066 | `data/processed/tabular_health_sources/scc_grazing_cows/conception.csv` |
| `scc_grazing_cows` | `tabularized` | 918284 | `data/processed/tabular_health_sources/scc_grazing_cows/insemination_rate.csv` |
| `organic_scm` | `tabularized` | 7 | `data/processed/tabular_health_sources/organic_scm/organic_scm_table_1.csv` |
| `chiozza_lameness` | `tabularized` | 8035 | `data/processed/tabular_health_sources/chiozza_lameness/chiozza_lameness_raw_hoja1.csv` |
| `chiozza_lameness` | `tabularized` | 8035 | `data/processed/tabular_health_sources/chiozza_lameness/chiozza_lameness_normalized.csv` |

## Leakage Guard

- Marcenat health counts are exposed only after the dryoff/completed-lactation date is <= snapshot reference date.
- Conductivity high flags use p75 thresholds computed from train split rows only.
- Culling reason, survival outcome, exit age and post-culling fields remain audit-only.
