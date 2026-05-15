# Faz 4.3 - MDP Oncesi Risk Modeli Saglamlastirma Ozeti

## Kapsam

Bu paket MDP gecis/reward simulasyonuna baglamadan once risk modelini veri,
etiket, validasyon, time-to-event ve kalibrasyon acisindan kontrol eder.
Model egitimi yapilir, fakat henuz MDP policy uretimine baglanmaz.

## Tamamlanan 5 Adim

| Adim | Cikti | Karar |
|---|---|---|
| Veri kapsam auditi | `reports/data_coverage_audit.md` | SCC RAR, organic DOCX ve calving/AFC PDF halen manuel tabular donusum ister. |
| Culling reason enrichment | `reports/culling_reason_enrichment_report.md` | Marcenat `JDD_DIB.csv` icinden 185 yuksek-guven reason etiketi, Primiparous icin 37 dusuk-guven status etiketi uretildi. |
| Sert validation | `reports/strict_validation_payload_enriched_report.md` | Animal/cohort holdout sinyal tasiyor, source-holdout halen zayif. |
| Survival-style baseline | `reports/survival_time_to_event_baseline_report.md` | 30g hazard modeli culling zaman siralamasinda sinyal tasiyor; C-index `0.7325`. |
| Risk band/calibration | `reports/risk_band_calibration_payload_enriched_report.md` | Kalibre skorlar karar bandi olarak daha guvenli; ham XGBoost olasiligi reward icin dogrudan kullanilmaz. |

## Ana Sayilar

- Payload-enriched model-ready satir: `14070`
- Culling reason label satiri: `222`
- Reason dagilimi: reproductive `109`, health `49`, economic `27`, unknown/status `37`
- Strict animal-hash holdout en iyi 90g PR-AUC: `0.4469`
- Strict recent-cohort holdout en iyi 90g PR-AUC: `0.3995`
- Source-holdout PR-AUC:
  - `marcenat_inrae`: `0.1185`
  - `primiparous_social_env`: `0.1275`
- Survival-style 30g hazard:
  - hazard PR-AUC: `0.1430`
  - 90g proxy PR-AUC: `0.3253`
  - C-index: `0.7325`
- Kalibre 90g risk bandlari:
  - 0-5% band observed: `0.0427`
  - 5-10% band observed: `0.0714`
  - 10-20% band observed: `0.1411`
  - 50-100% band observed: `0.4606`

## Yorum

Risk modeli artik sadece tek time split raporuna dayanmiyor. Hayvan ve kohort
holdout kontrolleri sinyalin tamamen satir ezberinden gelmedigini gosteriyor.
Buna ragmen source-holdout transfer dusuk oldugu icin model halen dogrudan
policy bileseni degil.

Kalibre LightGBM karar bandlari ham XGBoost skorlarindan daha tutarli. Bu
nedenle MDP smoke-test icin risk senaryosu gerekiyorsa kalibre skorlar tercih
edilmeli; ekonomik reward'a dogrudan ham risk olasiligi yazilmamalidir.

## MDP'ye Gecis Icin Hazirlik Durumu

Hazir:

- canonical event candidate set
- aylik snapshot set
- culling-observable label duzeltmesi
- payload-enriched feature set
- baseline risk skor modeli
- culling reason audit label'lari
- strict validation raporlari
- kalibre risk bandlari

Hazir degil:

- source-holdout transfer production seviyesinde degil
- SCC/organic/calving kaynaklari tabular hale gelmedi
- reward parametreleri halen senaryo/prototip varsayimlari iceriyor
- risk skoru policy karari olarak tek basina kullanilamaz

## Sonraki Adim

Sonraki is paketi MDP gecis/reward simulasyonudur. Baslangic icin risk modeli
yalnizca smoke-test girdisi olarak kullanilmali:

- state: aylik snapshot feature gruplari
- action: `keep`, `cull`
- transition: ay sonu snapshot gecisi + culling hazard/risk bandi
- reward: sut geliri, bakim maliyeti, culling/replacement senaryo parametreleri
- policy cikti: prototip senaryo karsilastirmasi, gercek karar onerisi degil
