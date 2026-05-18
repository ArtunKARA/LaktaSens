# Data Coverage Audit

- Generated at: `2026-05-15T15:32:43`
- Purpose: decide what can still improve the culling risk model before MDP/reward simulation.

## Source Coverage

| Source | Local files | Schema status | Raw rows | Event rows | Normalized rows | Notes |
|---|---:|---|---:|---:|---:|---|
| `embryo_losses_mendeley` | 1 | inspectable_tabular | 23361 | 46722 | 52918 | Landing page states calving date, drying off or culling, milk production, reproduction, mastitis and lameness records. TODO / manual inspection required for exact file names and column schema. |
| `primiparous_social_env` | 2 | inspectable_tabular; unsupported_schema | 8129 | 8521 | 9593 | Published metadata names CowID, CalfID, Date, Yield, Conductivity, activity, service period and Events including insemination, pregnancy diagnostics, group changes and exit. TODO / manual inspection required for exact file schemas. |
| `marcenat_inrae` | 4 | inspectable_tabular; non_tabular_or_manifest | 998 | 4508 | 4508 | Dataset metadata lists dairy performance, BW, BCS, fertility, health events, culling dates and causes, and feeding records. TODO / manual inspection required for exact source columns before raw load. |
| `scc_grazing_cows` | 1 | unsupported_schema | 0 | 0 | 0 | Metadata includes milk yield, fat, protein, SCC, service dates, positive pregnancy diagnosis and calving. It does not expose explicit culling/removal. TODO / manual inspection required; article notes restricted access. |
| `calving_afc_culling` | 1 | unsupported_schema | 0 | 0 | 0 | Metadata states calving difficulty, age at first calving, milk traits and culling reasons. TODO / manual inspection required for exact time fields and animal identifiers. |
| `organic_scm` | 1 | unsupported_schema | 0 | 0 | 0 | Supplemental material for subclinical mastitis, SCC linear scores, milk yield, fertility and culling. TODO / manual inspection required for file and column schema. |
| `chiozza_lameness` | 1 | inspectable_tabular | 2134 | 32046 | 39038 | Lameness timing, milk production and reproductive performance source. TODO / manual inspection required for exact source columns and date granularity. |
| `usda_nass_milk_price` | 1 | inspectable_tabular | 0 | 0 | 0 | Use NASS QuickStats for all-milk price by month/state. API key and exact query parameters must be configured manually before automated extraction. |
| `usda_ams_cull_cow` | 2 | unsupported_schema | 0 | 0 | 0 | Direct PDF is downloadable, but transforming cull-cow price ranges into reward parameters requires a separate parser and market-class mapping. |
| `usda_ers_milk_cost` | 2 | inspectable_tabular | 0 | 0 | 0 | ERS page exposes CSV/XLSX downloads, but exact file URLs can change. Manual download or a dedicated ERS scraper is required. |
| `iowa_state_heifer_cost` | 2 | unsupported_schema | 0 | 0 | 0 | Direct PDF is downloadable. Values must not be copied into baseline SQL until manually reviewed and approved for the scenario. |

## Culling Reason Capacity

- Raw unique culling cows: `330`
- Marcenat `JDD_DIB.csv` rows: `185`
- Marcenat culling-reason cows matched to raw culling IDs: `185`
- Primiparous exit status values: `Milk:27, Heifer:10`

## Feature Coverage Highlights

- Total source-feature pairs checked: `184`
- Pairs under 20% coverage: `65`

| Source | Feature | Coverage | Status |
|---|---|---:|---|
| `marcenat_inrae` | `days_since_last_health_event` | 0.00% | `all_null` |
| `marcenat_inrae` | `days_since_last_service_event` | 0.00% | `all_null` |
| `marcenat_inrae` | `gebe_mi` | 0.00% | `all_null` |
| `marcenat_inrae` | `laktasyon_no` | 0.00% | `all_null` |
| `marcenat_inrae` | `milk_avg_60` | 0.00% | `all_null` |
| `marcenat_inrae` | `milk_avg_90` | 0.00% | `all_null` |
| `marcenat_inrae` | `milk_last_obs_gun` | 0.00% | `all_null` |
| `marcenat_inrae` | `milk_trend_30_vs_prev30` | 0.00% | `all_null` |
| `marcenat_inrae` | `parite` | 0.00% | `all_null` |
| `marcenat_inrae` | `primiparous_mother_code` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_activity_avg_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_activity_avg_90` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_activity_trend_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_conductivity_avg_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_conductivity_avg_90` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_conductivity_trend_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_daily_dim_last` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_days_since_group_change` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_group_current` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_lactation_number_last` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_milking_time_avg_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_milking_time_avg_90` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_weight_avg_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_weight_avg_90` | 0.00% | `all_null` |
| `marcenat_inrae` | `sensor_weight_trend_30` | 0.00% | `all_null` |
| `marcenat_inrae` | `son30_ortalama_sut` | 0.00% | `all_null` |
| `marcenat_inrae` | `son_servis_gun` | 0.00% | `all_null` |
| `marcenat_inrae` | `sut_trend_7g` | 0.00% | `all_null` |
| `marcenat_inrae` | `yas_gun` | 0.00% | `all_null` |
| `primiparous_social_env` | `days_since_last_health_event` | 0.00% | `all_null` |
| `primiparous_social_env` | `laktasyon_no` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_age_days_payload` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_age_first_calving_months` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_bcs_3mo` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_bcs_at_calving` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_bw_3mo` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_bw_at_calving` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_calf_weight_latest` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_calving_difficulty_latest` | 0.00% | `all_null` |
| `primiparous_social_env` | `marcenat_cum_my_12w` | 0.00% | `all_null` |

## Decision

- SCC RAR, organic DOCX and calving/AFC PDF remain manual tabular-conversion work.
- Marcenat has usable culling reason labels in `JDD_DIB.csv`; these should be used for audit/stratification, not as predictive features before culling.
- Primiparous `Status` indicates lifecycle/status at exit, not a true culling cause; keep it low-confidence.
