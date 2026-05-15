# 05 - Baseline Risk Modeli

## Amaç

Bu fazda RL politikasına geçmeden önce supervised culling risk sinyali ölçülür.
Soru şudur: Faz 3'te üretilen aylık inek snapshot veri seti, yakın dönem
sürüden çıkarma riskini tahmin edebilecek kadar sinyal taşıyor mu?

Bu çalışma RL değildir. Çıktı bir `keep/cull` kararı değil, denetlenebilir bir
risk skoru baseline'ıdır.

## Girdi

Ana girdi:

- `data/processed/training/inek_aylik_snapshot_model_ready.csv`

Split:

- Faz 3'te üretilen zaman bazlı `split` kolonu kullanılır.
- Rastgele split yapılmaz.
- Train/test ayrımı kaynak sırasını ve zaman sırasını bozmaz.
- Eğer Faz 3 test tarafında ilgili horizon için pozitif culling örneği yoksa,
  metrikler hesaplanamayacağı için script hedef bazında zaman sırasını koruyan
  `positive_aware_time_split` fallback'i uygular ve cutoff tarihini rapora yazar.

## Hedefler

Her hedef ayrı binary supervised problem olarak eğitilir:

- `cull_within_30d`
- `cull_within_60d`
- `cull_within_90d`

İlk model seçimi için ana hedef `cull_within_90d` olarak kullanılır. Bunun
sebebi 30 günlük pozitif sayısının daha düşük olması ve ilk baseline'da daha
stabil sinyal ölçmek istememizdir.

## Feature Seti

Kullanılan feature'lar Faz 3 feature listesiyle sınırlıdır:

- `laktasyon_no`
- `parite`
- `dim`
- `yas_gun`
- `gebe_mi`
- `servis_sayisi`
- `son_servis_gun`
- `gebelik_kaybi_flag`
- `son30_saglik_olay_sayisi`
- `mastitis_flag`
- `lameness_flag`
- `son30_ortalama_sut`
- `sut_trend_7g`
- `source_code`

Kimlik, tarih, gözlem sonu ve label kolonları feature olarak kullanılmaz.

## Modeller

`scripts/12_train_baseline_risk_models.py` şu modelleri dener:

- Logistic Regression
- Random Forest
- XGBoost, paket kuruluysa
- LightGBM, paket kuruluysa

Opsiyonel paket yoksa script hata vermez; ilgili modeli raporda `skipped` olarak
işaretler.

## Metrikler

Her model/hedef için:

- ROC-AUC
- PR-AUC
- F1
- Recall
- Precision
- Brier score
- Expected calibration error

Pozitif sınıf çok nadir olduğu için model seçimi ROC-AUC yerine PR-AUC ile
yapılır. Eşik değeri train set üzerinde precision-recall eğrisinden maksimum F1
ile seçilir, test set üzerinde raporlanır.

## Çıktılar

- `data/processed/models/baseline_model_metrics.csv`
- `data/processed/models/baseline_risk_scores.csv` seçilen en iyi primary modelin test risk skorları
- `data/processed/models/baseline_feature_importance.csv`
- `data/processed/models/baseline_best_model_metadata.json`
- `Model/baseline_risk/*.joblib`
- `reports/baseline_model_report.md`
- `reports/baseline_feature_importance.md`

Robustluk kontrolü için:

- `scripts/13_validate_baseline_robustness.py`
- `data/processed/models/baseline_robustness_metrics.csv`
- `data/processed/models/baseline_no_source_feature_importance.csv`
- `data/processed/models/baseline_robustness_metadata.json`
- `reports/baseline_robustness_report.md`

Bu kontrol `source_code` feature'ını çıkarır ve ayrıca culling pozitifi olan
kaynaklar için source-holdout validasyon yapar. Amaç modelin veri seti kimliği
shortcut'ına yaslanıp yaslanmadığını anlamaktır.

## Label Kalitesi Düzeltmesi

İlk baseline sonrası görülen temel problem modelin az eğitilmesi değil, culling
label gözlenebilirliğidir. Bazı kaynaklarda hiç `event_suruden_cikarma` yoktur.
Bu kaynaklardaki satırları otomatik negatif kabul etmek, modele "bu kaynakta
culling olmaz" gibi yanlış bir shortcut öğretir.

Bu nedenle `scripts/14_build_culling_observable_training_set.py` eklendi:

- Culling event'i görülen kaynakları culling-observable kabul eder.
- Culling event'i hiç görülmeyen kaynaklardaki culling label'larını unknown yapar.
- `data/processed/training/inek_aylik_snapshot_culling_observable_model_ready.csv`
  çıktısını üretir.
- `reports/culling_label_quality_audit.md` ve
  `reports/training_dataset_culling_observable_review.md` raporlarını yazar.

Bu düzeltilmiş set için ayrı model kuralları:

- `config/baseline_model_culling_observable_rules.yaml`
- `reports/baseline_model_culling_observable_report.md`
- `reports/baseline_robustness_culling_observable_report.md`
- `reports/baseline_culling_observable_comparison.md`

## Faz 4.1: Feature Engineering ve Kalibrasyon

`scripts/15_engineer_culling_observable_features.py` culling-observable snapshot
üzerine yeni leakage-safe feature'lar ekler:

- son 90/180 gün servis sayıları
- son 60/90 gün sağlık olay sayıları
- son 30/60/90 gün süt gözlem sayıları ve süt ortalamaları
- son gözlemden geçen günler
- laktasyon evresi ve parite grubu
- eksik veri flag'leri

`scripts/16_train_calibrated_engineered_baseline.py` engineered no-source feature
setinde sigmoid kalibrasyonlu Logistic Regression ve LightGBM modellerini
dener. Özet rapor:

- `reports/engineered_feature_review.md`
- `reports/baseline_model_engineered_report.md`
- `reports/baseline_robustness_engineered_report.md`
- `reports/baseline_calibration_engineered_report.md`
- `reports/phase_4_1_engineered_baseline_summary.md`

Bu aşamanın kararı: engineered feature set time-split performansını belirgin
iyileştirir ve `source_code` çıkarıldığında performans korunur. Ancak
source-holdout transfer hâlâ sınırlı olduğu için model MDP/RL policy bileşeni
olarak değil, şimdilik diagnostik risk modeli ve MDP smoke-test adayı olarak
kullanılmalıdır.

## Faz 4.2: Payload-Enriched Veri İyileştirmesi

`scripts/17_engineer_payload_enriched_features.py` mevcut raw/event payload
alanlarından ek leakage-safe feature'lar çıkarır:

- Primiparous günlük payload: canlı ağırlık, aktivite, conductivity, sağım
  süresi, günlük DIM, laktasyon numarası ve grup değişimi.
- Marcenat payload: doğum tarihi, ilk buzağılama yaşı, breed, doğum payload
  değerleri ve yalnız gözlem penceresi geçmiş laktasyon özetleri.
- `event_kuru`: dry-off sayısı, son dry-off üzerinden geçen gün ve dry-off
  varlık flag'i.

Kasten dışarıda bırakılan alanlar: culling tarihi, reform tarihi, lifespan,
productive lifespan, tamamlanmış laktasyon toplamları ve gelecekte bilinen
özetler. Marcenat 4 hafta, 3 ay, 6 ay ve 305 gün değerleri sadece ilgili süre
`referans_tarih` itibarıyla geçmişse açılır.

Yeni kurallar:

- `config/baseline_model_payload_enriched_rules.yaml`

Yeni çıktılar:

- `data/processed/training/inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv`
- `data/processed/models/payload_enriched/baseline_model_metrics.csv`
- `data/processed/models/payload_enriched/baseline_robustness_metrics.csv`
- `data/processed/models/payload_enriched/calibrated_model_metrics.csv`
- `reports/payload_enriched_feature_review.md`
- `reports/baseline_model_payload_enriched_report.md`
- `reports/baseline_robustness_payload_enriched_report.md`
- `reports/baseline_calibration_payload_enriched_report.md`
- `reports/phase_4_2_payload_enriched_summary.md`

Faz 4.2 sonucu: payload feature'ları 90 günlük no-source time-split PR-AUC'yi
`0.3711` seviyesine çıkardı. Kalibre LightGBM PR-AUC'de daha düşük kaldı
(`0.3275`) ama Brier/ECE değerlerini belirgin iyileştirdi (`0.0900` / `0.0408`).
Source-holdout performansı Marcenat ve Primiparous kaynaklarında artmış olsa da
hâlâ zayıftır. Bu nedenle model hâlâ policy bileşeni değil, diagnostik risk
skoru ve MDP smoke-test girdisi olarak değerlendirilmelidir.

## Faz 4.3: MDP Öncesi Sağlamlaştırma

MDP geçiş/reward simülasyonuna bağlamadan önce şu ek kontroller yapılır:

- `scripts/18_build_data_coverage_audit.py`
- `scripts/19_enrich_culling_reason_labels.py`
- `scripts/20_validate_strict_splits.py`
- `scripts/21_train_survival_time_to_event_baseline.py`
- `scripts/22_build_risk_band_calibration_report.py`

Bu adım veri coverage, culling reason audit etiketleri, animal/cohort/source
holdout validasyon, survival-style hazard baseline ve risk band kalibrasyonunu
tamamlar. Özet rapor `reports/phase_4_3_pre_mdp_readiness_summary.md`, ayrıntılı
doküman `docs/06_mdp_oncesi_risk_model_saglamlastirma.md` içindedir.

## Yorumlama

Bu fazdaki iyi sonuç, culling sinyalinin supervised olarak öğrenilebilir olduğunu
gösterir. Bu sinyal daha sonra model-based MDP içinde geçiş/risk bileşeni olarak
kullanılabilir. Kötü sonuç ise RL'e geçmeden önce feature üretimini ve event
normalizasyonunu iyileştirmek gerektiğini gösterir.
