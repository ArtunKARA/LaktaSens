# Faz 4.4 - Primiparous Survival + CatBoost + Reason Audit

## Kapsam

Bu paket mevcut payload-enriched risk modelini uc ek iyilestirmeyle test eder:

- Primiparous `survival` sheet icinden static, leakage-safe feature ekleme
- CatBoost modelini baseline adaylarina ekleme
- Culling reason segmentlerine gore error/capture audit uretme

Survival outcome (`1st lactation survival`) ve `exit age` model feature'i
degildir. Bu alanlar yalnizca audit icin
`data/processed/primiparous_survival_labels.csv` dosyasina yazilir.

## Eklenen Feature'lar

| Feature | Tip | Not |
|---|---|---|
| `has_primiparous_survival_record` | numeric | Survival sheet kaydi var/yok. |
| `primiparous_mother_code` | numeric | Survival sheet static alanidir. |
| `primiparous_housing` | categorical | `G` / `I` housing grubu. |
| `primiparous_breed` | categorical | `H` / `C` breed kodu. |

Primiparous tarafinda `1418` snapshot satiri survival static feature kapsamina
girdi. `276` snapshot satirinda survival sheet kaydi bulunmadi.

## Overall Model Sonucu

| Karsilastirma | Model | 90g PR-AUC | 90g ROC-AUC | F1 | Recall | Precision |
|---|---|---:|---:|---:|---:|---:|
| Onceki payload-enriched best | XGBoost | 0.3768 | 0.7983 | 0.3730 | 0.3398 | 0.4134 |
| Yeni best | CatBoost | 0.3786 | 0.7690 | 0.3951 | 0.3625 | 0.4341 |

Net etki:

- PR-AUC: `+0.0018`
- F1: `+0.0221`
- Recall: `+0.0227`
- Precision: `+0.0207`
- ROC-AUC: `-0.0293`

Yorum: CatBoost siralama performansinda kucuk PR-AUC artisi ve daha iyi
threshold metrikleri verdi, fakat ROC-AUC dustu. Bu iyilesme gercek ama sinirli.

## Strict Validation

| Policy | Onceki best PR-AUC | Yeni best model | Yeni best PR-AUC | Delta |
|---|---:|---|---:|---:|
| `animal_hash_holdout` | 0.4469 | LightGBM | 0.4584 | +0.0115 |
| `animal_recent_cohort_holdout:2007-11-09` | 0.3995 | Logistic Regression | 0.3745 | -0.0250 |
| `phase_3_split` | 0.3269 | CatBoost | 0.3392 | +0.0123 |
| `source_holdout:marcenat_inrae` | 0.1185 | LightGBM | 0.1089 | -0.0096 |
| `source_holdout:primiparous_social_env` | 0.1275 | LightGBM | 0.1275 | +0.0000 |

Yorum: hayvan-holdout ve time split iyilesti; cohort/source transfer tarafinda
genel problem devam ediyor.

## Reason-Specific Audit

| Reason group | Positive rows | PR-AUC | Recall | Precision | Avg positive risk |
|---|---:|---:|---:|---:|---:|
| `reproductive` | 103 | 0.2179 | 0.4466 | 0.5349 | 0.5926 |
| `unknown` | 148 | 0.1646 | 0.3716 | 0.4015 | 0.6111 |
| `economic` | 21 | 0.0465 | 0.4286 | 0.4737 | 0.7010 |
| `health` | 37 | 0.0177 | 0.0541 | 0.1250 | 0.4145 |

Yorum: model reproductive ve unknown/status culling olaylarini daha iyi
yakaliyor. Health culling segmenti zayif; mastitis/lameness/SCC kaynaklarini
tabular hale getirmek bu noktada en kritik veri iyilestirmesi.

## Survival-Style Baseline Guncellemesi

| Model | 30g hazard PR-AUC | 90g proxy PR-AUC | C-index |
|---|---:|---:|---:|
| Logistic Regression | 0.1525 | 0.3464 | 0.7499 |
| CatBoost | 0.1508 | 0.3356 | 0.6906 |
| LightGBM | 0.1144 | 0.2393 | 0.6657 |

Yorum: survival-style siralamada Logistic Regression halen en iyi. CatBoost
binary 90g riskte iyi olsa da time-to-event siralamada en iyi degil.

## Karar

Bu paket risk modelini az da olsa iyilestirdi, ama policy-ready hale getirmedi.
MDP smoke-test icin kullanilabilir skor seti mevcut; gercek policy icin kaynak
transferi ve health-culling kapsami zayif kalmaya devam ediyor.

Sonraki en faydali iyilestirme: SCC/organic/calving kaynaklarini tabular hale
getirip health ve culling reason segmentini guclendirmek.
