# Risk Band Calibration Report

- Generated at: `2026-05-15T11:02:33`
- Purpose: check whether risk scores behave like usable risk bands before MDP/reward simulation.

## Band Summary

| Score set | Model | Target | Band | Rows | Positives | Observed rate | Avg predicted | Gap |
|---|---|---|---|---:|---:|---:|---:|---:|
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `cull_within_90d` | `0-5%` | 1523 | 65 | 0.0427 | 0.0262 | -0.0164 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `cull_within_90d` | `10-20%` | 326 | 46 | 0.1411 | 0.1394 | -0.0017 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `cull_within_90d` | `20-35%` | 286 | 45 | 0.1573 | 0.2646 | 0.1073 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `cull_within_90d` | `35-50%` | 206 | 55 | 0.2670 | 0.4316 | 0.1646 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `cull_within_90d` | `5-10%` | 308 | 22 | 0.0714 | 0.0718 | 0.0003 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `cull_within_90d` | `50-100%` | 165 | 76 | 0.4606 | 0.6102 | 0.1496 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `0-5%` | 712 | 3 | 0.0042 | 0.0146 | 0.0104 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `10-20%` | 362 | 28 | 0.0773 | 0.1437 | 0.0664 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `20-35%` | 364 | 24 | 0.0659 | 0.2807 | 0.2148 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `35-50%` | 267 | 19 | 0.0712 | 0.4154 | 0.3442 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `5-10%` | 197 | 12 | 0.0609 | 0.0742 | 0.0133 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `50-100%` | 912 | 223 | 0.2445 | 0.7416 | 0.4971 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `0-5%` | 1321 | 40 | 0.0303 | 0.0106 | -0.0197 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `10-20%` | 260 | 29 | 0.1115 | 0.1400 | 0.0285 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `20-35%` | 226 | 20 | 0.0885 | 0.2674 | 0.1789 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `35-50%` | 146 | 14 | 0.0959 | 0.4152 | 0.3193 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `5-10%` | 295 | 32 | 0.1085 | 0.0719 | -0.0366 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `50-100%` | 566 | 174 | 0.3074 | 0.7883 | 0.4809 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `0-5%` | 860 | 23 | 0.0267 | 0.0128 | -0.0140 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `10-20%` | 230 | 6 | 0.0261 | 0.1445 | 0.1184 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `20-35%` | 261 | 19 | 0.0728 | 0.2753 | 0.2025 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `35-50%` | 227 | 16 | 0.0705 | 0.4208 | 0.3503 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `5-10%` | 209 | 4 | 0.0191 | 0.0731 | 0.0540 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `50-100%` | 1027 | 241 | 0.2347 | 0.8154 | 0.5808 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `0-5%` | 1423 | 56 | 0.0394 | 0.0085 | -0.0309 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `10-20%` | 233 | 22 | 0.0944 | 0.1452 | 0.0508 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `20-35%` | 263 | 45 | 0.1711 | 0.2659 | 0.0948 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `35-50%` | 183 | 35 | 0.1913 | 0.4219 | 0.2306 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `5-10%` | 213 | 27 | 0.1268 | 0.0721 | -0.0547 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `50-100%` | 499 | 124 | 0.2485 | 0.7550 | 0.5065 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `0-5%` | 673 | 9 | 0.0134 | 0.0128 | -0.0006 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `10-20%` | 220 | 6 | 0.0273 | 0.1442 | 0.1169 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `20-35%` | 216 | 2 | 0.0093 | 0.2750 | 0.2658 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `35-50%` | 198 | 11 | 0.0556 | 0.4251 | 0.3695 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `5-10%` | 190 | 6 | 0.0316 | 0.0714 | 0.0398 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `50-100%` | 1317 | 275 | 0.2088 | 0.8407 | 0.6318 |

## Positive Reason Mix By Band

| Score set | Model | Band | Reason group | Positive rows |
|---|---|---|---|---:|
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `0-5%` | `unknown` | 36 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `0-5%` | `reproductive` | 22 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `0-5%` | `health` | 5 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `0-5%` | `economic` | 2 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `10-20%` | `unknown` | 24 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `10-20%` | `health` | 14 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `10-20%` | `economic` | 4 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `10-20%` | `reproductive` | 4 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `20-35%` | `unknown` | 23 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `20-35%` | `reproductive` | 16 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `20-35%` | `health` | 4 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `20-35%` | `economic` | 2 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `35-50%` | `reproductive` | 23 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `35-50%` | `unknown` | 21 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `35-50%` | `health` | 6 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `35-50%` | `economic` | 5 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `5-10%` | `unknown` | 13 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `5-10%` | `reproductive` | 5 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `5-10%` | `health` | 3 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `5-10%` | `economic` | 1 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `50-100%` | `reproductive` | 33 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `50-100%` | `unknown` | 31 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `50-100%` | `economic` | 7 |
| `payload_calibrated_no_source` | `calibrated_lightgbm_sigmoid_cv3` | `50-100%` | `health` | 5 |
| `payload_configured` | `xgboost` | `0-5%` | `unknown` | 2 |
| `payload_configured` | `xgboost` | `0-5%` | `reproductive` | 1 |
| `payload_configured` | `xgboost` | `10-20%` | `unknown` | 13 |
| `payload_configured` | `xgboost` | `10-20%` | `reproductive` | 11 |
| `payload_configured` | `xgboost` | `10-20%` | `health` | 3 |
| `payload_configured` | `xgboost` | `10-20%` | `economic` | 1 |
| `payload_configured` | `xgboost` | `20-35%` | `unknown` | 11 |
| `payload_configured` | `xgboost` | `20-35%` | `reproductive` | 7 |
| `payload_configured` | `xgboost` | `20-35%` | `health` | 6 |
| `payload_configured` | `xgboost` | `35-50%` | `reproductive` | 8 |
| `payload_configured` | `xgboost` | `35-50%` | `unknown` | 5 |
| `payload_configured` | `xgboost` | `35-50%` | `economic` | 4 |
| `payload_configured` | `xgboost` | `35-50%` | `health` | 2 |
| `payload_configured` | `xgboost` | `5-10%` | `reproductive` | 8 |
| `payload_configured` | `xgboost` | `5-10%` | `unknown` | 4 |
| `payload_configured` | `xgboost` | `50-100%` | `unknown` | 113 |
| `payload_configured` | `xgboost` | `50-100%` | `reproductive` | 68 |
| `payload_configured` | `xgboost` | `50-100%` | `health` | 26 |
| `payload_configured` | `xgboost` | `50-100%` | `economic` | 16 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `unknown` | 21 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `reproductive` | 16 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `economic` | 2 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `health` | 1 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `reproductive` | 12 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `unknown` | 11 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `health` | 6 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `unknown` | 11 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `reproductive` | 4 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `health` | 3 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `economic` | 2 |
| `strict_validation_no_source` | `lightgbm` | `35-50%` | `unknown` | 8 |
| `strict_validation_no_source` | `lightgbm` | `35-50%` | `health` | 3 |
| `strict_validation_no_source` | `lightgbm` | `35-50%` | `reproductive` | 3 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `health` | 11 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `unknown` | 11 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `reproductive` | 9 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `economic` | 1 |
| `strict_validation_no_source` | `lightgbm` | `50-100%` | `unknown` | 86 |
| `strict_validation_no_source` | `lightgbm` | `50-100%` | `reproductive` | 59 |
| `strict_validation_no_source` | `lightgbm` | `50-100%` | `economic` | 16 |
| `strict_validation_no_source` | `lightgbm` | `50-100%` | `health` | 13 |
| `strict_validation_no_source` | `logistic_regression` | `0-5%` | `unknown` | 23 |
| `strict_validation_no_source` | `logistic_regression` | `10-20%` | `unknown` | 4 |
| `strict_validation_no_source` | `logistic_regression` | `10-20%` | `economic` | 2 |
| `strict_validation_no_source` | `logistic_regression` | `20-35%` | `unknown` | 12 |
| `strict_validation_no_source` | `logistic_regression` | `20-35%` | `health` | 4 |
| `strict_validation_no_source` | `logistic_regression` | `20-35%` | `reproductive` | 2 |
| `strict_validation_no_source` | `logistic_regression` | `20-35%` | `economic` | 1 |
| `strict_validation_no_source` | `logistic_regression` | `35-50%` | `health` | 7 |
| `strict_validation_no_source` | `logistic_regression` | `35-50%` | `unknown` | 7 |
| `strict_validation_no_source` | `logistic_regression` | `35-50%` | `reproductive` | 2 |
| `strict_validation_no_source` | `logistic_regression` | `5-10%` | `unknown` | 4 |
| `strict_validation_no_source` | `logistic_regression` | `50-100%` | `reproductive` | 99 |
| `strict_validation_no_source` | `logistic_regression` | `50-100%` | `unknown` | 98 |
| `strict_validation_no_source` | `logistic_regression` | `50-100%` | `health` | 26 |
| `strict_validation_no_source` | `logistic_regression` | `50-100%` | `economic` | 18 |

## Decision

- Calibrated scores are preferred for decision thresholds because Brier/ECE are lower.
- Uncalibrated XGBoost may rank animals better, but its raw probability scale is not reliable enough for direct economic reward use.
- Risk bands can feed MDP smoke tests only as scenario inputs, not final policy thresholds.
