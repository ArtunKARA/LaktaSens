# Faz 2.1: Kolon Anlamı, Raw Yerleşim, Normalizasyon ve Kanonik Olay Akışı

Bu doküman, dış veri toplama fazında eksik kalan dört parçayı kapatır:
kolon/anlam incelemesi, `raw_*` tablo yerleşim planı, normalizasyon kuralları ve
kanonik olay akışı. Kapsam DB + dry-run iskeletidir. `.env` ve PostgreSQL şeması
hazırsa aday CSV'ler yüklenebilir; değilse aynı dönüşümler `data/processed/`
altında kalır.

Model eğitimi, feature snapshot ve RL transition üretimi bu fazın kapsamında
değildir.

## 1. Kolon ve Anlam İncelemesi

Kolon anlamları iki seviyede yönetilir:

- `reports/file_inspection_report.md`: indirilen dosyalardan görülen gerçek kolon
  şemalarını ve ilk örnek satırları gösterir.
- `config/canonical_event_rules.yaml`: kaynak/sheet bazlı güvenilir anlam
  kararlarını, birim dönüşümlerini, event kurallarını ve skip gerekçelerini tutar.

Kural görülmeyen kolonlar otomatik heuristic ile sadece öneri alır. Anlamı net
olmayan veya tablo şeması çıkarılamayan kaynaklar `TODO / manual inspection
required` olarak kalır. SCC RAR, organic SCM DOCX ve calving AFC PDF bu sınıftadır.

## 2. Raw Tablo Yerleşim Planı

Raw tabloya yerleşim v1 kuralları:

| Kaynak | Raw yerleşim | Not |
|---|---|---|
| EmbryoLosses | `raw_repro_loss` | Tüm satırlar üreme/gebelik kaybı omurgasıdır. Süt, sağlık ve culling kolonları dosyada doğrudan görülmediği için üretilmez. |
| Primiparous Daily data | `raw_milk` | `Yield(gr)` kg'a çevrilir; `Days_in_Milk` payload'dır, süt miktarı değildir. |
| Primiparous events | event odaklı | `Calving`, `Insemination`, `Dry`, `Exit` uzman event tablolarına; diğerleri `event_normalized` payload'a gider. |
| Chiozza lameness | `raw_health`, koşullu `raw_culling` | Lameness olayları sağlık tablosuna; `baja` yalnızca tarihse culling'e gider. `leche_*` özetleri süt ölçüm olayı değildir. |
| Marcenat / INRAE | koşullu `raw_culling` | Açık `Date Reforme` varsa culling adayıdır. Süt/sağlık/feeding özetleri event'e çevrilmez. |
| USDA NASS / ERS | raw hayvan olayı yok | Sadece ekonomik reward aday raporuna gider. |

Zorunlu alanı eksik satırlar sessizce atılmaz. `data/processed/rejected_rows.csv`
içine kaynak, dosya, sheet, satır, hedef tablo ve gerekçe ile yazılır.

## 3. Normalizasyon Kuralları

Kanonik hayvan ID formatı:

```text
{source_code}:{external_animal_id}
```

Bu format farklı public veri setlerinde aynı hayvan ID değerinin çakışmasını
engeller. `master_inek.external_animal_id` canonical ID'yi, `map_external_inek`
ise kaynak içindeki ham dış ID'yi tutar.

Birim dönüşümleri v1:

- Primiparous `Yield(gr)` -> `sut_miktar_kg = Yield(gr) / 1000`
- USDA NASS ve ERS ekonomik değerleri seed edilmez; `$ / CWT` ve yıllık maliyet
  gibi birimler önce `reports/economic_reward_parameter_review.md` içinde
  incelenir.

Özet kolonlar event yapılmaz:

- Chiozza `leche_150d`, `leche_305d`, `leche_total`
- Primiparous `Days_in_Milk`
- Marcenat feeding, production summary ve count alanları
- Culling reason CSV'sinde event tarihi yoksa `raw_culling` yüklenmez

## 4. Kanonik Olay Akışı

Kanonik event sözlüğü v1:

```text
calving
insemination
pregnancy_diagnosis_positive
pregnancy_loss
dryoff
cull
milk_measurement
health_lameness
group_change
entry
birth
other
```

Kaynak bazlı dönüşüm:

- EmbryoLosses:
  - `fparto` -> `event_dogurma`, `event_normalized(calving)`
  - `fechasf` -> `event_dollenme`, `event_normalized(insemination)`
  - `fechaperd + perdida=1` -> `event_normalized(pregnancy_loss)`
- Primiparous:
  - `Daily data` -> `raw_milk`, `event_sut_olcum`,
    `event_normalized(milk_measurement)`
  - `Calving` -> `event_dogurma`
  - `Insemination` -> `event_dollenme`
  - `Dry` -> `event_kuru`
  - `Exit` -> `event_suruden_cikarma`
  - `PD (+)`, `Change Group`, `Entry`, `Birth`, `Abortion` ve diğerleri genel
    `event_normalized` akışında tutulur
- Chiozza:
  - `FECHA` -> doğurma adayı
  - `primer_servicio`, `ult_servicio` -> döllenme adayı
  - `fecha_renguera/renguera/evento` -> lameness sağlık olayı
  - `secado` -> kuruya çıkarma
  - `baja` tarihse culling
- Marcenat:
  - açık doğum, kuru ve reforme tarihleri event adayıdır
  - reason/payload alanları tarih yoksa event'e çevrilmez

## Çalıştırma

```bash
python scripts/04_inspect_downloaded_files.py
python scripts/05_generate_column_mapping_template.py
python scripts/07_build_column_semantic_review.py
python scripts/08_build_raw_and_event_candidates.py
python scripts/09_load_canonical_to_postgres.py
```

`.env` yoksa `09_load_canonical_to_postgres.py` hata vermeden DB yüklemeyi
atlar ve dry-run çıktı yollarını bildirir.
