# Smart Feed Raw Load ve Normalizasyon Planı

Bu plan dış kaynakların `ml_smart_feed.raw_*` tablolarına nasıl ineceğini ve
hangi kurallarla normalize edileceğini tanımlar. Kapsam ETL tasarımıdır; model
eğitimi ve optimizer çalıştırma bu fazda yoktur.

## Landing Katmanı

| Kaynak | Landing yolu | Durum |
|---|---|---|
| `agroscope_activity_zenodo` | `Data/external/agroscope_activity_zenodo/` | Dokümantasyon ve küçük probe indirildi; tam CSV'ler indirilebilir. |
| `plos_rumiwatch_calving` | `Data/external/plos_rumiwatch_calving/` | S1 raw XLSX ve S1-S3 DOCX dosyaları indirildi. |
| `mmcows_multimodal` | `Data/manual_downloads/README.md` | Çok büyük; manuel indirme planı. |
| `transition_cow_part2` | `Data/manual_downloads/README.md` | Mendeley manuel/API indirme planı. |
| `czech_production_repro` | `Data/manual_downloads/README.md` | Mendeley manuel/API indirme planı. |
| `ns_dairy_cattle` | `Data/manual_downloads/README.md` | Workbook manuel indirme planı. |
| `nasem_2021_ncbi` | Parser çıktısı | HTML/PDF tablo çıkarımı gerekir. |
| `feedipedia` | Parser çıktısı | Kaynak bazlı lisans/format kontrolü gerekir. |
| API/ekonomik kaynaklar | API/HTML parser çıktısı | Koordinat, tarih aralığı ve piyasa seçimiyle çekilecek. |

## Raw Load Kuralları

### `raw_cow`

Kaynaklar:

- `mmcows_multimodal`
- `transition_cow_part2`
- `czech_production_repro`

Zorunlu alanlar:

- `kaynak_id`
- `external_cow_id`

Opsiyonel alanlar:

- `external_farm_id`
- `breed`
- `birth_date`
- `parity`
- `body_weight_kg`
- `bcs`
- `pregnancy_status`

Kural:

- Her kaynakta dış ID canonical olarak `{source_code}:{external_cow_id}` biçimine
  çevrilir.
- Aynı kaynak + aynı dış ID tek `map_external_cow` satırı üretir.

### `raw_milk`

Kaynaklar:

- `mmcows_multimodal`
- `transition_cow_part2`
- `czech_production_repro`

Zorunlu alanlar:

- `external_cow_id`
- `record_date`

Ölçüm alanları:

- `daily_milk_yield_kg`
- `milk_fat_percent`
- `milk_protein_percent`
- `lactose_percent`
- `scc`
- `milk_electrical_conductivity`
- `milk_temperature`

Kural:

- Günlük veri doğrudan `daily_milk_yield_kg`.
- Test-day veya laktasyon özeti ise `raw_payload.record_granularity` alanı
  `test_day` veya `lactation_summary` olmalı; bu satır doğrudan günlük trend
  gibi genişletilmemeli.

### `raw_lactation`

Kaynaklar:

- `transition_cow_part2`
- `czech_production_repro`

Alanlar:

- `calving_date`
- `dry_off_date`
- `expected_calving_date`
- `lactation_no`
- `parity`
- `dim`
- `pregnancy_status`

Kural:

- `dim` varsa `record_date` yoksa tek başına tarih üretmez; calving anchor
  gerekiyorsa payload içinde tutulur.
- `calving interval` gibi sonuçlar açık tarih değilse `raw_payload` içinde
  result olarak kalır.

### `raw_health`

Kaynaklar:

- `mmcows_multimodal`
- `transition_cow_part2`
- `plos_rumiwatch_calving` diagnosis criteria

Alanlar:

- `event_date`
- `event_type`
- `sub_type`
- `severity`
- `treatment_given`
- `treatment_cost`
- `description`

Kural:

- Açık olay tarihi olmayan grup-level kriterler `raw_health` event satırı
  üretmez; `map_health_event_type` ve label kurallarına gider.
- `CK` -> `health_ketosis`
- `DA` -> `health_displaced_abomasum`
- `metritis` -> `health_metritis`
- `mastitis` -> `health_mastitis`
- `lameness` -> `health_lameness`

### `raw_feed`

Kaynaklar:

- `plos_rumiwatch_calving` S1 ration table
- `ns_dairy_cattle` model/workbook

Alanlar:

- `external_cow_id` veya `external_group_id`
- `record_date`
- `ration_name`
- `feed_name`
- `feed_amount_asfed_kg`
- `dry_matter_percent`
- `estimated_dmi_kg`

Kural:

- PLOS close-up/fresh ration tabloları gerçek daily feeding log değil; reference
  ration veya `opt_ration_constraint` seed adayıdır.
- NS Dairy Cattle workbook çıktıları gerçek feed log değil; hesaplanmış ihtiyaç
  ve rasyon parametresi olarak işaretlenir.

### `raw_feed_ingredient`

Kaynaklar:

- `ns_dairy_cattle`
- `nasem_2021_ncbi`
- `feedipedia`

Alanlar:

- `feed_name`
- `feed_category`
- `dry_matter_percent`
- `nel_mcal_kg_dm`
- `cp_percent_dm`
- `ndf_percent_dm`
- `starch_percent_dm`
- `fat_percent_dm`
- mineral alanları

Kural:

- Kaynak değerler kayıpsız `raw_payload` içine de yazılır.
- Standart yem kodu `map_feed_type` ile üretilir.
- Aynı yem farklı kaynaklarda farklı değer taşıyorsa `effective_date`,
  `kaynak_id` ve `source_confidence` ile versionlanır.

### `raw_sensor`

Kaynaklar:

- `mmcows_multimodal`
- `agroscope_activity_zenodo`
- `plos_rumiwatch_calving` sadece kural/özet bağlamında

Alanlar:

- `external_cow_id`
- `record_datetime`
- `sensor_type`
- `rumination_minutes`
- `activity_level`
- `lying_time_minutes`
- `body_temperature`
- `water_intake_liter`

Kural:

- `agroscope_activity_zenodo.mi` -> `activity_level`.
- `agroscope_activity_zenodo.steps` payload veya günlük feature.
- `agroscope_activity_zenodo.area` payload ve günlük alan kullanım özeti.
- PLOS grup mean/SD satırları doğrudan `raw_sensor` cow snapshot'ı değildir.

### `raw_environment`

Kaynaklar:

- `mmcows_multimodal`
- `nasa_power_environment`

Alanlar:

- `external_farm_id`
- `barn_id`
- `record_datetime`
- `temperature_c`
- `humidity_percent`
- `thi`

Kural:

- NASA POWER günlük API çıktısı `record_datetime` için gün başlangıcı ile
  saklanabilir; `raw_payload.time_standard` UTC/LST bilgisini korur.
- THI yoksa sıcaklık/nemden türetilir ve `norm_environment_daily` içinde
  hesaplandığı belirtilir.

### `raw_economic_parameter`

Kaynaklar:

- `usda_ams_dairy`
- `eu_agri_food_milk`
- `ulusal_sut_konseyi`
- `turib_feed_commodities`

Alanlar:

- `parameter_date`
- `parameter_type`
- `parameter_name`
- `parameter_value`
- `unit`
- `currency_code`

Kural:

- Süt fiyatı: `parameter_type='milk_price'`
- Yem fiyatı: `parameter_type='feed_price'`
- Sağlık cezası: `parameter_type='health_penalty'`
- Birim dönüşümleri `map_unit` üzerinden yapılır.
- Para birimi dönüşümü ham yükte yapılmaz; senaryo hesaplarında yapılır.

## Normalize Kuralları

## Tarih ve Zaman

| Ham biçim | Normalize |
|---|---|
| `2020-06-03 10:12:00` | `record_datetime='2020-06-03 10:12:00'` |
| `wk -1` | `relative_window='wk_-1'`, `anchor_event='calving'` |
| `dd0` | `relative_day=0`, `anchor_event='diagnosis'` |
| `1 Mayıs 2026 tarihinden itibaren` | `parameter_date='2026-05-01'`, `valid_from='2026-05-01'` |
| EU `beginDate/endDate` | `valid_from`, `valid_to` payload + `parameter_date=beginDate` |

## Birim

| Kaynak birim | Standart |
|---|---|
| kg milk/day | `kg/day` |
| liter milk | `kg` dönüşümü için senaryo yoğunluk varsayımı gerekir |
| EUR/100KG | `EUR/kg` |
| USD/cwt | `USD/kg` |
| TL/Lt | `TRY/liter`; kg'a dönüşüm senaryo varsayımıyla |
| TL/Kg | `TRY/kg` |
| percent as-fed | `percent_asfed` |
| percent DM | `percent_dm` |

## Kanonik Olay ve Snapshot Akışı

```text
source file/API
  -> raw_* landing
  -> map_* standardization
  -> norm_* daily/event tables
  -> feat_cow_day_snapshot + labels
  -> opt_* nutrition/economic inputs
  -> sim_state/reward/action/transition
```

## Reddedilecek Satır Örnekleri

| Gerekçe | Örnek | Davranış |
|---|---|---|
| Hayvan ID yok | cow-day sensör satırı `cow_name` boş | Raw'a alınmaz, rejected report'a yazılır. |
| Tarih yok | süt ölçüm satırında tarih yok | Raw'a alınmaz, rejected report'a yazılır. |
| Göreli tarih ama anchor yok | `dd-1` var, diagnosis/calving yok | Event üretilmez, payload olarak tutulur. |
| Grup-level özet | PLOS mean/SD satırı | Cow-day gibi yüklenmez, kural/parametre olarak tutulur. |
| Para birimi yok | fiyat değeri var, currency yok | Raw'a alınır, `currency_code=null`, mapping bekler. |

## İlk Uygulama Sırası

1. `agroscope_activity_zenodo` için `raw_sensor` dry-run.
2. `plos_rumiwatch_calving` için `map_sensor_type`, `map_health_event_type` ve
   risk kuralı seed'i.
3. `nasa_power_environment` için örnek çiftlik koordinatıyla `raw_environment`.
4. `ulusal_sut_konseyi` ve `turib_feed_commodities` için `raw_economic_parameter`.
5. `mmcows_multimodal` manuel indirildikten sonra ana cow-day pipeline.
6. `transition_cow_part2` ve `czech_production_repro` indirildikten sonra label
   ve laktasyon zenginleştirme.
7. `nasem_2021_ncbi`, `feedipedia`, `ns_dairy_cattle` ile rasyon referans
   katmanı.
