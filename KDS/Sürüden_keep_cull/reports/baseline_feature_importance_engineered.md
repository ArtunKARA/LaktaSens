# Baseline Feature Importance

Best model: `lightgbm` for `cull_within_90d`.

| Rank | Feature | Importance | Signed value | Type |
|---:|---|---:|---:|---|
| 1 | `months_observed` | 3118.000000 | 3118.000000 | `model_feature_importance` |
| 2 | `dim` | 2436.000000 | 2436.000000 | `model_feature_importance` |
| 3 | `calving_count_to_date` | 1595.000000 | 1595.000000 | `model_feature_importance` |
| 4 | `son_servis_gun` | 676.000000 | 676.000000 | `model_feature_importance` |
| 5 | `milk_last_obs_gun` | 211.000000 | 211.000000 | `model_feature_importance` |
| 6 | `service_count_180` | 167.000000 | 167.000000 | `model_feature_importance` |
| 7 | `son30_ortalama_sut` | 124.000000 | 124.000000 | `model_feature_importance` |
| 8 | `milk_avg_90` | 115.000000 | 115.000000 | `model_feature_importance` |
| 9 | `servis_sayisi` | 108.000000 | 108.000000 | `model_feature_importance` |
| 10 | `gebe_mi` | 84.000000 | 84.000000 | `model_feature_importance` |
| 11 | `milk_avg_60` | 64.000000 | 64.000000 | `model_feature_importance` |
| 12 | `laktasyon_evresi_mid` | 47.000000 | 47.000000 | `model_feature_importance` |
| 13 | `service_count_90` | 45.000000 | 45.000000 | `model_feature_importance` |
| 14 | `gebe_mi_missing_flag` | 40.000000 | 40.000000 | `model_feature_importance` |
| 15 | `sut_trend_7g` | 39.000000 | 39.000000 | `model_feature_importance` |
| 16 | `milk_trend_30_vs_prev30` | 35.000000 | 35.000000 | `model_feature_importance` |
| 17 | `milk_obs_count_60` | 29.000000 | 29.000000 | `model_feature_importance` |
| 18 | `milk_obs_count_90` | 22.000000 | 22.000000 | `model_feature_importance` |
| 19 | `dim_missing_flag` | 21.000000 | 21.000000 | `model_feature_importance` |
| 20 | `son_servis_gun_missing_flag` | 7.000000 | 7.000000 | `model_feature_importance` |
| 21 | `source_code_primiparous_social_env` | 6.000000 | 6.000000 | `model_feature_importance` |
| 22 | `milk_obs_count_30` | 4.000000 | 4.000000 | `model_feature_importance` |
| 23 | `laktasyon_evresi_late` | 3.000000 | 3.000000 | `model_feature_importance` |
| 24 | `source_code_marcenat_inrae` | 2.000000 | 2.000000 | `model_feature_importance` |
| 25 | `laktasyon_evresi_early` | 1.000000 | 1.000000 | `model_feature_importance` |
| 26 | `son30_ortalama_sut_missing_flag` | 1.000000 | 1.000000 | `model_feature_importance` |
| 27 | `days_since_last_calving_event` | 0.000000 | 0.000000 | `model_feature_importance` |
| 28 | `days_since_last_health_event` | 0.000000 | 0.000000 | `model_feature_importance` |
| 29 | `days_since_last_service_event` | 0.000000 | 0.000000 | `model_feature_importance` |
| 30 | `dim_month` | 0.000000 | 0.000000 | `model_feature_importance` |

Interpretation caution: source-level features can capture dataset differences as well as biological signal.
