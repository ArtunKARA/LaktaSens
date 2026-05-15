# Baseline Feature Importance

Best model: `logistic_regression` for `cull_within_90d`.

| Rank | Feature | Importance | Signed value | Type |
|---:|---|---:|---:|---|
| 1 | `source_code_embryo_losses_mendeley` | 5.338431 | -5.338431 | `abs_logistic_coefficient` |
| 2 | `source_code_chiozza_lameness` | 4.935250 | -4.935250 | `abs_logistic_coefficient` |
| 3 | `source_code_marcenat_inrae` | 4.036845 | 4.036845 | `abs_logistic_coefficient` |
| 4 | `source_code_primiparous_social_env` | 3.326490 | 3.326490 | `abs_logistic_coefficient` |
| 5 | `gebelik_kaybi_flag` | 0.890005 | -0.890005 | `abs_logistic_coefficient` |
| 6 | `dim` | 0.441583 | 0.441583 | `abs_logistic_coefficient` |
| 7 | `parite` | 0.295684 | -0.295684 | `abs_logistic_coefficient` |
| 8 | `laktasyon_no` | 0.252745 | 0.252745 | `abs_logistic_coefficient` |
| 9 | `lameness_flag` | 0.250240 | -0.250240 | `abs_logistic_coefficient` |
| 10 | `son30_saglik_olay_sayisi` | 0.234341 | -0.234341 | `abs_logistic_coefficient` |
| 11 | `son_servis_gun` | 0.228776 | 0.228776 | `abs_logistic_coefficient` |
| 12 | `gebe_mi` | 0.216219 | -0.216219 | `abs_logistic_coefficient` |
| 13 | `son30_ortalama_sut` | 0.047302 | -0.047302 | `abs_logistic_coefficient` |
| 14 | `sut_trend_7g` | 0.038342 | -0.038342 | `abs_logistic_coefficient` |
| 15 | `servis_sayisi` | 0.026419 | 0.026419 | `abs_logistic_coefficient` |
| 16 | `mastitis_flag` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |
| 17 | `yas_gun` | 0.000000 | 0.000000 | `abs_logistic_coefficient` |

Interpretation caution: source-level features can capture dataset differences as well as biological signal.
