# Baseline Feature Importance

Best model: `xgboost` for `cull_within_90d`.

| Rank | Feature | Importance | Signed value | Type |
|---:|---|---:|---:|---|
| 1 | `marcenat_num_lactation_payload_latest` | 0.093656 | 0.093656 | `model_feature_importance` |
| 2 | `dryoff_count_to_date` | 0.060503 | 0.060503 | `model_feature_importance` |
| 3 | `marcenat_gestation_duration_latest` | 0.055580 | 0.055580 | `model_feature_importance` |
| 4 | `marcenat_age_days_payload` | 0.042664 | 0.042664 | `model_feature_importance` |
| 5 | `primiparous_breed_unknown` | 0.041132 | 0.041132 | `model_feature_importance` |
| 6 | `days_since_last_dryoff` | 0.029891 | 0.029891 | `model_feature_importance` |
| 7 | `has_dryoff_before_ref` | 0.027891 | 0.027891 | `model_feature_importance` |
| 8 | `calving_count_to_date` | 0.026249 | 0.026249 | `model_feature_importance` |
| 9 | `marcenat_months_since_first_lactation` | 0.019608 | 0.019608 | `model_feature_importance` |
| 10 | `has_service_observation_180` | 0.019347 | 0.019347 | `model_feature_importance` |
| 11 | `has_primiparous_survival_record` | 0.018955 | 0.018955 | `model_feature_importance` |
| 12 | `months_observed` | 0.017156 | 0.017156 | `model_feature_importance` |
| 13 | `dim` | 0.016877 | 0.016877 | `model_feature_importance` |
| 14 | `gebe_mi_missing_flag` | 0.015744 | 0.015744 | `model_feature_importance` |
| 15 | `marcenat_my_6mo` | 0.014334 | 0.014334 | `model_feature_importance` |
| 16 | `service_count_180` | 0.014154 | 0.014154 | `model_feature_importance` |
| 17 | `marcenat_breed_MON` | 0.013531 | 0.013531 | `model_feature_importance` |
| 18 | `marcenat_prev_lact_completed_dim` | 0.013061 | 0.013061 | `model_feature_importance` |
| 19 | `son_servis_gun` | 0.012967 | 0.012967 | `model_feature_importance` |
| 20 | `marcenat_prev_lact_lameness_count` | 0.011936 | 0.011936 | `model_feature_importance` |
| 21 | `dim_month` | 0.011526 | 0.011526 | `model_feature_importance` |
| 22 | `marcenat_time_peak_week` | 0.011219 | 0.011219 | `model_feature_importance` |
| 23 | `servis_sayisi` | 0.011147 | 0.011147 | `model_feature_importance` |
| 24 | `son30_ortalama_sut` | 0.010976 | 0.010976 | `model_feature_importance` |
| 25 | `gebe_mi` | 0.010513 | 0.010513 | `model_feature_importance` |
| 26 | `marcenat_my_peak` | 0.010433 | 0.010433 | `model_feature_importance` |
| 27 | `sensor_weight_avg_90` | 0.010309 | 0.010309 | `model_feature_importance` |
| 28 | `marcenat_cum_my_12w` | 0.009669 | 0.009669 | `model_feature_importance` |
| 29 | `days_since_last_service_event` | 0.009637 | 0.009637 | `model_feature_importance` |
| 30 | `has_marcenat_static_payload` | 0.009569 | 0.009569 | `model_feature_importance` |

Interpretation caution: source-level features can capture dataset differences as well as biological signal.
