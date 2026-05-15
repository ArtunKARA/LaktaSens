# 06 - MDP Öncesi Risk Modeli Sağlamlaştırma

## Amaç

Bu faz, baseline risk modelini MDP geçiş/reward simülasyonuna bağlamadan önce
kontrol eder. Hedef production policy üretmek değildir; veri kalitesi, etiket
kalitesi, validasyon sertliği, time-to-event sinyali ve risk bandı güvenilirliği
ölçülür.

## Çalıştırma Sırası

```bash
python scripts/18_build_data_coverage_audit.py
python scripts/19_enrich_culling_reason_labels.py
python scripts/20_validate_strict_splits.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/21_train_survival_time_to_event_baseline.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/22_build_risk_band_calibration_report.py
```

## 1. Veri Kapsam Auditi

`scripts/18_build_data_coverage_audit.py` şunları üretir:

- `data/processed/audit/source_coverage_summary.csv`
- `data/processed/audit/feature_coverage_by_source.csv`
- `reports/data_coverage_audit.md`

Bu rapor hangi kaynakların tabular olarak işlendiğini, hangilerinin hâlâ manuel
inceleme istediğini ve payload-enriched feature setinde kaynak bazlı kapsama
oranlarını gösterir.

## 2. Culling Reason Enrichment

`scripts/19_enrich_culling_reason_labels.py` Marcenat `JDD_DIB.csv` içinden
culling reason etiketlerini çıkarır. Primiparous için sadece `events.Status`
alanı düşük güvenli audit etiketi olarak tutulur.

Çıktılar:

- `data/processed/culling_reason_labels.csv`
- `data/processed/training/inek_aylik_snapshot_payload_enriched_reason_audit.csv`
- `reports/culling_reason_enrichment_report.md`

Bu kolonlar model feature listesine eklenmez. Culling nedeni culling anında veya
sonrasında bilindiği için predictive feature olarak kullanılması leakage olur.

## 3. Sert Validation

`scripts/20_validate_strict_splits.py` ana 90 günlük hedef için şu validasyonları
çalıştırır:

- time split
- animal hash holdout
- recent cohort holdout
- source holdout

Çıktılar:

- `data/processed/models/payload_enriched/strict_validation_metrics.csv`
- `data/processed/models/payload_enriched/strict_validation_risk_scores.csv`
- `reports/strict_validation_payload_enriched_report.md`

Sert validation sonucu model hayvan/kohort holdout üzerinde sinyal taşır, fakat
source-holdout performansı hâlâ düşüktür. Bu modelin henüz policy bileşeni
olmadığını gösterir.

## 4. Survival-Style Baseline

`scripts/21_train_survival_time_to_event_baseline.py` full survival paketi
eklemeden discrete-time 30 günlük hazard modeli kurar. Amaç “culling olacak mı”
sorusuna ek olarak “culling ne kadar yakın” sinyalini ölçmektir.

Çıktılar:

- `data/processed/models/payload_enriched/survival_discrete_hazard_metrics.csv`
- `data/processed/models/payload_enriched/survival_discrete_hazard_scores.csv`
- `reports/survival_time_to_event_baseline_report.md`

Bu model Cox/Random Survival Forest yerine hafif bir ön kontroldür. C-index
değeri MDP transition tasarımına geçmeden önce zaman sıralama sinyalini gösterir.

## 5. Risk Bandı ve Kalibrasyon

`scripts/22_build_risk_band_calibration_report.py` risk skorlarını bandlara
ayırır:

- 0-5%
- 5-10%
- 10-20%
- 20-35%
- 35-50%
- 50-100%

Çıktılar:

- `data/processed/models/payload_enriched/risk_band_calibration.csv`
- `data/processed/models/payload_enriched/risk_band_reason_distribution.csv`
- `reports/risk_band_calibration_payload_enriched_report.md`

Kalibre skorlar karar bandı için ham XGBoost skorlarından daha uygundur. Ham
skorlar sıralamada iyi olabilir, fakat doğrudan ekonomik reward olasılığı gibi
kullanılmamalıdır.

## Karar

Bu faz sonunda risk modeli MDP smoke-test girdisi olarak kullanılabilir. Ancak
source-holdout transfer zayıf olduğu için gerçek policy bileşeni olarak
kullanılamaz. MDP fazında risk skoru yalnız senaryo simülasyonu ve pipeline
kontrolü için bağlanmalıdır.
