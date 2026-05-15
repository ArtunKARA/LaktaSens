# Baseline Feature Importance

Best model: `xgboost` for `cull_within_90d`.

| Rank | Feature | Importance | Signed value | Type |
|---:|---|---:|---:|---|
| 1 | `marcenat_num_lactation_payload_latest` | 0.114243 | 0.114243 | `model_feature_importance` |
| 2 | `marcenat_gestation_duration_latest` | 0.064354 | 0.064354 | `model_feature_importance` |
| 3 | `has_dryoff_before_ref` | 0.057325 | 0.057325 | `model_feature_importance` |
| 4 | `source_code_marcenat_inrae` | 0.046847 | 0.046847 | `model_feature_importance` |
| 5 | `has_marcenat_lactation_payload` | 0.039660 | 0.039660 | `model_feature_importance` |
| 6 | `marcenat_age_days_payload` | 0.038770 | 0.038770 | `model_feature_importance` |
| 7 | `calving_count_to_date` | 0.032702 | 0.032702 | `model_feature_importance` |
| 8 | `days_since_last_dryoff` | 0.030531 | 0.030531 | `model_feature_importance` |
| 9 | `has_service_observation_180` | 0.025897 | 0.025897 | `model_feature_importance` |
| 10 | `marcenat_months_since_first_lactation` | 0.022988 | 0.022988 | `model_feature_importance` |
| 11 | `dryoff_count_to_date` | 0.021611 | 0.021611 | `model_feature_importance` |
| 12 | `days_since_last_calving_event` | 0.018905 | 0.018905 | `model_feature_importance` |
| 13 | `months_observed` | 0.018797 | 0.018797 | `model_feature_importance` |
| 14 | `sensor_milking_time_avg_30` | 0.017842 | 0.017842 | `model_feature_importance` |
| 15 | `dim` | 0.016945 | 0.016945 | `model_feature_importance` |
| 16 | `servis_sayisi` | 0.016510 | 0.016510 | `model_feature_importance` |
| 17 | `service_count_180` | 0.016241 | 0.016241 | `model_feature_importance` |
| 18 | `marcenat_cum_my_4w` | 0.015865 | 0.015865 | `model_feature_importance` |
| 19 | `marcenat_my_peak` | 0.013087 | 0.013087 | `model_feature_importance` |
| 20 | `sensor_activity_avg_30` | 0.013033 | 0.013033 | `model_feature_importance` |
| 21 | `gebe_mi` | 0.012832 | 0.012832 | `model_feature_importance` |
| 22 | `son30_ortalama_sut` | 0.012581 | 0.012581 | `model_feature_importance` |
| 23 | `dim_month` | 0.012580 | 0.012580 | `model_feature_importance` |
| 24 | `marcenat_my_6mo` | 0.012092 | 0.012092 | `model_feature_importance` |
| 25 | `son_servis_gun` | 0.011945 | 0.011945 | `model_feature_importance` |
| 26 | `days_since_last_service_event` | 0.011811 | 0.011811 | `model_feature_importance` |
| 27 | `marcenat_cum_my_12w` | 0.011119 | 0.011119 | `model_feature_importance` |
| 28 | `marcenat_time_peak_week` | 0.011029 | 0.011029 | `model_feature_importance` |
| 29 | `milk_avg_60` | 0.010590 | 0.010590 | `model_feature_importance` |
| 30 | `marcenat_cum_my_24w` | 0.010388 | 0.010388 | `model_feature_importance` |

Interpretation caution: source-level features can capture dataset differences as well as biological signal.
