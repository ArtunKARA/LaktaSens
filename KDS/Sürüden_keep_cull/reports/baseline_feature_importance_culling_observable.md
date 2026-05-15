# Baseline Feature Importance

Best model: `logistic_regression` for `cull_within_90d`.

| Rank | Feature | Importance | Signed value | Type |
|---:|---|---:|---:|---|
| 1 | `dim` | 0.509088 | 0.509088 | `abs_logistic_coefficient` |
| 2 | `source_code_primiparous_social_env` | 0.490476 | -0.490476 | `abs_logistic_coefficient` |
| 3 | `gebelik_kaybi_flag` | 0.249150 | -0.249150 | `abs_logistic_coefficient` |
| 4 | `source_code_marcenat_inrae` | 0.226024 | 0.226024 | `abs_logistic_coefficient` |
| 5 | `gebe_mi` | 0.202412 | -0.202412 | `abs_logistic_coefficient` |
| 6 | `son_servis_gun` | 0.162269 | 0.162269 | `abs_logistic_coefficient` |
| 7 | `servis_sayisi` | 0.066571 | 0.066571 | `abs_logistic_coefficient` |
| 8 | `sut_trend_7g` | 0.059852 | -0.059852 | `abs_logistic_coefficient` |
| 9 | `son30_ortalama_sut` | 0.058565 | -0.058565 | `abs_logistic_coefficient` |
| 10 | `laktasyon_no` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |
| 11 | `lameness_flag` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |
| 12 | `mastitis_flag` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |
| 13 | `parite` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |
| 14 | `son30_saglik_olay_sayisi` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |
| 15 | `yas_gun` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |

Interpretation caution: source-level features can capture dataset differences as well as biological signal.
