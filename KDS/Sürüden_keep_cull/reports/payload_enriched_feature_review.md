# Payload-Enriched Feature Review

- Input rows: `14070`
- Output rows: `14070`

## Leakage Guard

The following payload fields were intentionally not used because they are known at or after culling, or summarize a completed future lactation:

- `Date Reforme`
- `Lifespan`
- `Productive lifespan`
- `Durée Lactation`
- `Cumulative DIM`
- `Avg DIM per lactation`
- `Date tarrissement`
- `Cumulative MY total lactation (kg)`
- `Date Lactation__3`
- `End of lactation`
- `Start of dry period`
- `Jour Lactation`
- `1st lactation survival`
- `exit age`

Marcenat production payload values are only exposed after their biological observation window has passed, e.g. 4-week milk after 28 days, 3-month values after 84 days, and 305-day values after 305 days.

Primiparous survival sheet outcome fields `1st lactation survival` and `exit age` are written only to `data/processed/primiparous_survival_labels.csv` for audit. They are not included in model features.

## New Numeric Features

- `sensor_weight_avg_30`
- `sensor_weight_avg_90`
- `sensor_weight_trend_30`
- `sensor_activity_avg_30`
- `sensor_activity_avg_90`
- `sensor_activity_trend_30`
- `sensor_conductivity_avg_30`
- `sensor_conductivity_avg_90`
- `sensor_conductivity_trend_30`
- `sensor_milking_time_avg_30`
- `sensor_milking_time_avg_90`
- `sensor_daily_dim_last`
- `sensor_lactation_number_last`
- `sensor_group_current`
- `sensor_group_change_count_180`
- `sensor_days_since_group_change`
- `sensor_payload_obs_90`
- `has_sensor_payload_90`
- `has_primiparous_survival_record`
- `primiparous_mother_code`
- `marcenat_age_days_payload`
- `marcenat_age_first_calving_months`
- `marcenat_months_since_first_lactation`
- `has_marcenat_static_payload`
- `marcenat_calving_difficulty_latest`
- `marcenat_calf_weight_latest`
- `marcenat_num_lactation_payload_latest`
- `marcenat_gestation_duration_latest`
- `marcenat_bw_at_calving`
- `marcenat_bcs_at_calving`
- `marcenat_my_4w`
- `marcenat_cum_my_4w`
- `marcenat_my_3mo`
- `marcenat_cum_my_12w`
- `marcenat_bw_3mo`
- `marcenat_bcs_3mo`
- `marcenat_my_6mo`
- `marcenat_cum_my_24w`
- `marcenat_my_305d`
- `marcenat_cum_my_305d`
- `marcenat_my_peak`
- `marcenat_time_peak_week`
- `has_marcenat_lactation_payload`
- `dryoff_count_to_date`
- `days_since_last_dryoff`
- `has_dryoff_before_ref`

## New Categorical Features

- `marcenat_breed`
- `primiparous_housing`
- `primiparous_breed`
