# Project A Eğitim Dataseti Audit

Kontrol tarihi: 2026-06-07  
Son güncelleme: 2026-06-07 (longitudinal sentetik üretici `v2_normalized` sonrası)

## Son Durum

| Kaynak | İnek | Gün/inek | Cow-day | Açıklama |
|---|---:|---:|---:|---|
| `mmcows_observed_with_proxy` | 16 | 15 | 240 | Süt/CBT/THI ve kısmi wearable gözlemleri; birçok alan ve tüm risk etiketleri proxy |
| `synthetic_longitudinal_v1` | 120 | 180 | 21.600 | Ayrı işaretlenmiş longitudinal sentetik geliştirme kohortu |
| Toplam | 136 | - | 21.840 | İnek bazlı train/validation/test split için kullanılabilir |

## Longitudinal Sentetik Üretim (`06_generate_synthetic_project_a_longitudinal.sql`)

Güncel kohort `synthetic_project_a_longitudinal_v2_normalized` generator'ı ile
üretilir ve tam `norm_* → feat_*` zincirini doldurur:

- `norm_cow_profile`, `norm_lactation_daily`, `norm_milk_daily`,
  `norm_feeding_daily`, `norm_sensor_daily`, `norm_environment_daily`,
  `norm_health_event`
- `feat_cow_day_snapshot`, `feat_milk_trend`, `feat_health_risk_label`,
  `feat_feeding_need_label`, `feat_model_input_a`, `feat_prediction_a`

Önceki sürüm feature tablolarına doğrudan yazıyordu; normalize katman boş
kalıyordu. Bu sürüm güncel model şemasıyla uyumludur.

Sağlık etiketleri (`ketosis_*`, `mastitis_*`, `asidosis_*`, `metritis_*`)
aynı gün eşiği yerine `norm_health_event` üzerinden ileri 7/14 günlük pencere
ile üretilir (`label_origin='synthetic_longitudinal_forward_event_v1'`).
`energy_deficit_risk` hâlâ latent risk skorundan türetilir.

## Kritik Bulgular

- MmCows ham sensör hacmi büyük olsa da bağımsız hedef birimi `cow-day` olduğu için gerçek omurga yalnızca 240 satırdır.
- MmCows tarih aralığında hizalanmış klinik teşhis bulunmadığından gerçek supervised sağlık etiketi yoktur.
- MmCows risk etiketleri `synthetic_project_a_v1_proxy_rule` kökenlidir.
- Longitudinal kohort latent risk ile korele süt/sensör özellikleri üretir; klinik olay etiketleri ileri pencere mantığıyla işaretlenir.
- Datasetin tamamı sentetik/proxy etiket içerir. Model metrikleri gerçek çiftlik performansı olarak kullanılamaz.

## Dağılım

| Risk | Satır |
|---|---:|
| High | 988 |
| Medium | 4.158 |
| Low | 16.694 |

> **Not:** Yukarıdaki hedef dağılımı ve aşağıdaki model metrikleri, pipeline
> düzeltmesinden **önce** koşulan deneylere aittir. `v2_normalized` kohort
> üretildikten sonra eğitim yeniden çalıştırılmalıdır; yeni metrikler bu
> raporda güncellenmelidir.

## Doğrulama

- Toplam snapshot: 21.840
- Tekil inek: 136
- Duplicate `(cow_id, record_date)`: 0
- Longitudinal kohort normalize + trend + model-input katmanları: 21.600 / 21.600 / 21.600
- Cow-stratified split: train/validation/test arasında inek çakışması 0
- Smoke split: 12.000 train, 4.380 validation, 5.460 test
- Smoke pozitif sayıları: 542 train, 194 validation, 252 test
- Bağımsız label belirsizliği sonrası ilk smoke test F1 aralığı: 0,62-0,64
- Güncel model seçimi: 5-fold cow-group CV PR-AUC
- Güncel seçilen model: `linear_discriminant_analysis`
- Güncel seçilen model CV PR-AUC: 0,7418 ± 0,0280 *(önceki pipeline)*
- Güncel seçilen model test PR-AUC: 0,7048 *(önceki pipeline)*
- Güncel seçilen model kalibrasyon sonrası test Brier Score: 0,0274 *(önceki pipeline)*
- En iyi dört model için 5 tekrar x 5 fold doğrulama tamamlandı *(önceki pipeline)*
- Ayrıntılı sonuç ve yorumlar:
  `project_a_advanced_experiment_results_20260607.md`

## Kullanım Kararı

- Sentetik kohort model kodu, feature pipeline, model karşılaştırması ve regresyon testi için uygundur.
- Modelin gerçek saha doğrulaması için daha uzun dönem gerçek süt/sensör verisi ve hizalanmış klinik sağlık olayları gereklidir.
- Longitudinal kohort üretimi idempotent'tir; script ~3,5 dakika sürer ve `04_generate_synthetic_project_a_features.sql` sonrasında çalıştırılmalıdır.
