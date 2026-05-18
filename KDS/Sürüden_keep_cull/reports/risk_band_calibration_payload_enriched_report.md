# Risk Band Calibration Report

- Generated at: `2026-05-16T17:27:20`
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
| `payload_configured` | `xgboost` | `cull_within_90d` | `0-5%` | 735 | 8 | 0.0109 | 0.0148 | 0.0039 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `10-20%` | 393 | 24 | 0.0611 | 0.1439 | 0.0829 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `20-35%` | 366 | 35 | 0.0956 | 0.2714 | 0.1758 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `35-50%` | 306 | 44 | 0.1438 | 0.4255 | 0.2817 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `5-10%` | 235 | 7 | 0.0298 | 0.0745 | 0.0447 |
| `payload_configured` | `xgboost` | `cull_within_90d` | `50-100%` | 779 | 191 | 0.2452 | 0.7510 | 0.5058 |
| `strict_validation_no_source` | `catboost` | `cull_within_90d` | `0-5%` | 616 | 5 | 0.0081 | 0.0201 | 0.0120 |
| `strict_validation_no_source` | `catboost` | `cull_within_90d` | `10-20%` | 384 | 23 | 0.0599 | 0.1420 | 0.0821 |
| `strict_validation_no_source` | `catboost` | `cull_within_90d` | `20-35%` | 456 | 42 | 0.0921 | 0.2673 | 0.1752 |
| `strict_validation_no_source` | `catboost` | `cull_within_90d` | `35-50%` | 361 | 46 | 0.1274 | 0.4221 | 0.2947 |
| `strict_validation_no_source` | `catboost` | `cull_within_90d` | `5-10%` | 280 | 11 | 0.0393 | 0.0757 | 0.0364 |
| `strict_validation_no_source` | `catboost` | `cull_within_90d` | `50-100%` | 717 | 182 | 0.2538 | 0.7391 | 0.4853 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `0-5%` | 1475 | 55 | 0.0373 | 0.0114 | -0.0259 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `10-20%` | 262 | 25 | 0.0954 | 0.1447 | 0.0493 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `20-35%` | 189 | 23 | 0.1217 | 0.2547 | 0.1331 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `35-50%` | 136 | 21 | 0.1544 | 0.4259 | 0.2715 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `5-10%` | 220 | 25 | 0.1136 | 0.0714 | -0.0422 |
| `strict_validation_no_source` | `lightgbm` | `cull_within_90d` | `50-100%` | 532 | 160 | 0.3008 | 0.8039 | 0.5032 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `0-5%` | 1129 | 26 | 0.0230 | 0.0101 | -0.0130 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `10-20%` | 254 | 10 | 0.0394 | 0.1469 | 0.1076 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `20-35%` | 247 | 28 | 0.1134 | 0.2703 | 0.1569 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `35-50%` | 181 | 27 | 0.1492 | 0.4226 | 0.2735 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `5-10%` | 222 | 15 | 0.0676 | 0.0735 | 0.0060 |
| `strict_validation_no_source` | `logistic_regression` | `cull_within_90d` | `50-100%` | 781 | 203 | 0.2599 | 0.8130 | 0.5530 |
| `survival_30d_hazard_proxy` | `catboost` | `cull_within_90d_proxy_from_30d_hazard` | `0-5%` | 726 | 20 | 0.0275 | 0.0214 | -0.0062 |
| `survival_30d_hazard_proxy` | `catboost` | `cull_within_90d_proxy_from_30d_hazard` | `10-20%` | 376 | 31 | 0.0824 | 0.1507 | 0.0683 |
| `survival_30d_hazard_proxy` | `catboost` | `cull_within_90d_proxy_from_30d_hazard` | `20-35%` | 429 | 40 | 0.0932 | 0.2694 | 0.1761 |
| `survival_30d_hazard_proxy` | `catboost` | `cull_within_90d_proxy_from_30d_hazard` | `35-50%` | 358 | 38 | 0.1061 | 0.4184 | 0.3123 |
| `survival_30d_hazard_proxy` | `catboost` | `cull_within_90d_proxy_from_30d_hazard` | `5-10%` | 296 | 13 | 0.0439 | 0.0736 | 0.0297 |
| `survival_30d_hazard_proxy` | `catboost` | `cull_within_90d_proxy_from_30d_hazard` | `50-100%` | 629 | 167 | 0.2655 | 0.7206 | 0.4551 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `0-5%` | 1552 | 62 | 0.0399 | 0.0095 | -0.0305 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `10-20%` | 217 | 35 | 0.1613 | 0.1490 | -0.0123 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `20-35%` | 155 | 27 | 0.1742 | 0.2730 | 0.0988 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `35-50%` | 128 | 26 | 0.2031 | 0.4227 | 0.2196 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `5-10%` | 256 | 37 | 0.1445 | 0.0710 | -0.0736 |
| `survival_30d_hazard_proxy` | `lightgbm` | `cull_within_90d_proxy_from_30d_hazard` | `50-100%` | 506 | 122 | 0.2411 | 0.7603 | 0.5192 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `0-5%` | 768 | 9 | 0.0117 | 0.0117 | 0.0000 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `10-20%` | 228 | 2 | 0.0088 | 0.1458 | 0.1370 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `20-35%` | 228 | 8 | 0.0351 | 0.2697 | 0.2346 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `35-50%` | 196 | 12 | 0.0612 | 0.4218 | 0.3605 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `5-10%` | 218 | 10 | 0.0459 | 0.0752 | 0.0294 |
| `survival_30d_hazard_proxy` | `logistic_regression` | `cull_within_90d_proxy_from_30d_hazard` | `50-100%` | 1176 | 268 | 0.2279 | 0.8309 | 0.6030 |

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
| `payload_configured` | `xgboost` | `0-5%` | `reproductive` | 6 |
| `payload_configured` | `xgboost` | `0-5%` | `unknown` | 2 |
| `payload_configured` | `xgboost` | `10-20%` | `unknown` | 16 |
| `payload_configured` | `xgboost` | `10-20%` | `health` | 6 |
| `payload_configured` | `xgboost` | `10-20%` | `reproductive` | 2 |
| `payload_configured` | `xgboost` | `20-35%` | `reproductive` | 10 |
| `payload_configured` | `xgboost` | `20-35%` | `unknown` | 10 |
| `payload_configured` | `xgboost` | `20-35%` | `health` | 9 |
| `payload_configured` | `xgboost` | `20-35%` | `economic` | 6 |
| `payload_configured` | `xgboost` | `35-50%` | `unknown` | 20 |
| `payload_configured` | `xgboost` | `35-50%` | `reproductive` | 13 |
| `payload_configured` | `xgboost` | `35-50%` | `health` | 8 |
| `payload_configured` | `xgboost` | `35-50%` | `economic` | 3 |
| `payload_configured` | `xgboost` | `5-10%` | `reproductive` | 4 |
| `payload_configured` | `xgboost` | `5-10%` | `unknown` | 3 |
| `payload_configured` | `xgboost` | `50-100%` | `unknown` | 97 |
| `payload_configured` | `xgboost` | `50-100%` | `reproductive` | 68 |
| `payload_configured` | `xgboost` | `50-100%` | `health` | 14 |
| `payload_configured` | `xgboost` | `50-100%` | `economic` | 12 |
| `strict_validation_no_source` | `catboost` | `0-5%` | `unknown` | 5 |
| `strict_validation_no_source` | `catboost` | `10-20%` | `unknown` | 11 |
| `strict_validation_no_source` | `catboost` | `10-20%` | `health` | 6 |
| `strict_validation_no_source` | `catboost` | `10-20%` | `reproductive` | 6 |
| `strict_validation_no_source` | `catboost` | `20-35%` | `reproductive` | 17 |
| `strict_validation_no_source` | `catboost` | `20-35%` | `unknown` | 13 |
| `strict_validation_no_source` | `catboost` | `20-35%` | `health` | 10 |
| `strict_validation_no_source` | `catboost` | `20-35%` | `economic` | 2 |
| `strict_validation_no_source` | `catboost` | `35-50%` | `unknown` | 21 |
| `strict_validation_no_source` | `catboost` | `35-50%` | `health` | 10 |
| `strict_validation_no_source` | `catboost` | `35-50%` | `reproductive` | 10 |
| `strict_validation_no_source` | `catboost` | `35-50%` | `economic` | 5 |
| `strict_validation_no_source` | `catboost` | `5-10%` | `reproductive` | 8 |
| `strict_validation_no_source` | `catboost` | `5-10%` | `unknown` | 3 |
| `strict_validation_no_source` | `catboost` | `50-100%` | `unknown` | 95 |
| `strict_validation_no_source` | `catboost` | `50-100%` | `reproductive` | 62 |
| `strict_validation_no_source` | `catboost` | `50-100%` | `economic` | 14 |
| `strict_validation_no_source` | `catboost` | `50-100%` | `health` | 11 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `reproductive` | 26 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `unknown` | 24 |
| `strict_validation_no_source` | `lightgbm` | `0-5%` | `health` | 5 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `unknown` | 15 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `health` | 5 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `reproductive` | 3 |
| `strict_validation_no_source` | `lightgbm` | `10-20%` | `economic` | 2 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `unknown` | 11 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `health` | 7 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `reproductive` | 4 |
| `strict_validation_no_source` | `lightgbm` | `20-35%` | `economic` | 1 |
| `strict_validation_no_source` | `lightgbm` | `35-50%` | `reproductive` | 13 |
| `strict_validation_no_source` | `lightgbm` | `35-50%` | `unknown` | 6 |
| `strict_validation_no_source` | `lightgbm` | `35-50%` | `economic` | 2 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `unknown` | 15 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `health` | 7 |
| `strict_validation_no_source` | `lightgbm` | `5-10%` | `reproductive` | 3 |
| `strict_validation_no_source` | `lightgbm` | `50-100%` | `unknown` | 77 |
| `strict_validation_no_source` | `lightgbm` | `50-100%` | `reproductive` | 54 |

## Decision

- Calibrated scores are preferred for decision thresholds because Brier/ECE are lower.
- Uncalibrated XGBoost may rank animals better, but its raw probability scale is not reliable enough for direct economic reward use.
- Risk bands can feed MDP smoke tests only as scenario inputs, not final policy thresholds.
