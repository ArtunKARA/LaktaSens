# Engineered Feature Review

- Input rows: `14070`
- Output rows: `14070`
- Culling reason / future exit status is intentionally not used as a feature because it would leak label information.

## New Numeric Features

- `calving_count_to_date`
- `service_count_90`
- `service_count_180`
- `health_count_60`
- `health_count_90`
- `days_since_last_calving_event`
- `days_since_last_service_event`
- `days_since_last_health_event`
- `has_service_observation_180`
- `has_health_observation_365`
- `milk_obs_count_30`
- `milk_obs_count_60`
- `milk_obs_count_90`
- `milk_avg_60`
- `milk_avg_90`
- `milk_trend_30_vs_prev30`
- `milk_last_obs_gun`
- `has_milk_observation_90`
- `dim_month`
- `months_observed`
- `laktasyon_no_missing_flag`
- `parite_missing_flag`
- `dim_missing_flag`
- `yas_gun_missing_flag`
- `gebe_mi_missing_flag`
- `son_servis_gun_missing_flag`
- `son30_ortalama_sut_missing_flag`
- `sut_trend_7g_missing_flag`

## New Categorical Features

- `laktasyon_evresi`
- `parite_grup`

## Missingness

Missingness flags are part of the feature set because Marcenat and Primiparous expose different observation channels.
