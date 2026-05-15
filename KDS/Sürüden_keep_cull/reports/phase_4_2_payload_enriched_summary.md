# Faz 4.2 - Payload-Enriched Baseline Summary

## Amaç

Bu turda yeni veri indirmeden mevcut raw/event payload alanlarından daha fazla
leakage-safe feature çıkarıldı. Amaç modelin kaynak kimliği shortcut'ı yerine
hayvan düzeyi üretim, aktivite, laktasyon ve dry-off sinyallerinden öğrenip
öğrenmediğini ölçmektir.

## Eklenen Feature Kaynakları

- Primiparous daily payload: canlı ağırlık, aktivite, conductivity, sağım süresi,
  günlük DIM, laktasyon numarası ve grup değişimi.
- Marcenat payload: doğum tarihi, ilk buzağılama yaşı, breed, son doğum payload
  bilgileri ve sadece gözlem penceresi geçmiş süt/BCS/BW özetleri.
- `event_kuru`: dry-off sayısı, son dry-off üzerinden geçen gün ve dry-off varlık
  flag'i.

## Leakage Guard

Aşağıdaki alanlar modele alınmadı: `Date Reforme`, `Lifespan`,
`Productive lifespan`, `Durée Lactation`, `Cumulative DIM`,
`Avg DIM per lactation`, `Date tarrissement`, tamamlanmış laktasyon toplam sütü
ve culling sonrası bilinebilecek alanlar.

Marcenat 4 hafta, 3 ay, 6 ay ve 305 gün özetleri yalnızca ilgili biyolojik
gözlem penceresi `referans_tarih` itibarıyla geçmişse feature olarak açıldı.

## Karşılaştırma

| Set | Validasyon | En iyi model | 90g ROC-AUC | 90g PR-AUC | F1 | Recall | Precision | Brier | ECE |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Engineered | time split, no source | LightGBM | 0.7905 | 0.3662 | 0.3388 | 0.2686 | 0.4586 | 0.1723 | 0.1952 |
| Payload-enriched | time split, configured feature set | XGBoost | 0.7983 | 0.3768 | 0.3730 | 0.3398 | 0.4134 | 0.1824 | 0.2336 |
| Payload-enriched | time split, no source | XGBoost | 0.7893 | 0.3711 | 0.3869 | 0.4013 | 0.3735 | 0.1704 | 0.2108 |
| Payload-enriched calibrated | time split, no source | Calibrated LightGBM | 0.7890 | 0.3275 | 0.3787 | 0.4142 | 0.3488 | 0.0900 | 0.0408 |

## Source-Holdout Kontrolü

| Held-out source | Önceki engineered PR-AUC | Payload-enriched PR-AUC | Not |
|---|---:|---:|---|
| `marcenat_inrae` | 0.0978 | 0.1185 | Transfer hâlâ zayıf, ama artış var. |
| `primiparous_social_env` | 0.1054 | 0.1374 | PR-AUC arttı; F1 eşiği bu holdout'ta hâlâ kırılgan. |

## Karar

Payload enrichment ölçülebilir bir iyileştirme sağladı ve `source_code`
çıkarıldığında performans tamamen çökmedi. Buna rağmen source-holdout transfer
hâlâ düşük olduğu için model MDP/RL policy bileşeni olarak kullanılmamalıdır.

Şimdilik en doğru kullanım:

- diagnostik risk skoru,
- MDP smoke-test için yardımcı risk bileşeni,
- feature/label kalitesi geliştirme göstergesi.

Sonraki veri iyileştirme için en yüksek etki beklenen işler:

- culling reason sınıflarını parse edip ekonomik/sürüden çıkarma tipi ayrımını
  netleştirmek,
- SCC/organic/calving PDF/DOCX/RAR kaynaklarını manuel tabular formata çevirmek,
- kaynaklar arası ortak süt/sağlık/üreme event kapsamını büyütmek,
- train/test split'i yalnız zamana değil, kaynak ve hayvan kohortlarına göre de
  raporlayan daha sert validation setleri eklemek.
