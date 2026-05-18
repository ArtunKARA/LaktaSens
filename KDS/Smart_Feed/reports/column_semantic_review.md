# Smart Feed Kolon ve Anlam İncelemesi

Bu rapor, dış kaynakların beklenen ve yerel olarak görülen kolon ailelerini
`ml_smart_feed` tablolarına göre yorumlar. Henüz indirilmeyen büyük/manuel
kaynaklarda kolon adları "beklenen kolon ailesi" düzeyindedir; dosya geldikten
sonra gerçek kolon adlarıyla güncellenmelidir.

## Genel Sınıflandırma

| Sınıf | Anlam | Örnek kolonlar | Hedef |
|---|---|---|---|
| Kimlik | Hayvan, sürü, çiftlik veya grup anahtarı | `cow_name`, `CowID`, `animal_id`, `herd_id`, `farm_id`, `group_id` | `raw_cow`, `map_external_cow`, `norm_cow_profile` |
| Zaman | Olay veya ölçüm zamanı | `timestamp`, `time_stamp`, `record_date`, `event_date`, `calving_date`, `parameter_date` | Tüm `raw_*` ve `norm_*` tablolar |
| Snapshot | Belirli andaki ölçüm | milk, activity, THI, DMI, BCS, BW | `raw_milk`, `raw_sensor`, `raw_environment`, `norm_*` |
| Olay | Klinik, üreme, rasyon veya laktasyon olayı | ketosis, mastitis, calving, ration change | `raw_health`, `raw_lactation`, `raw_feed`, `norm_health_event` |
| Sonuç | Bir dönem sonunda oluşan performans veya label | ME305, pregnancy outcome, disease group | `feat_health_risk_label`, `feat_feeding_need_label` |
| Parametre | Hayvan-bazlı olmayan referans veya fiyat | nutrient value, milk price, feed price, penalty | `raw_feed_ingredient`, `raw_economic_parameter`, `opt_*`, `sim_reward_parameter` |

## Kaynak Bazlı İnceleme

### `agroscope_activity_zenodo`

Yerel olarak indirilen dosyalar:

- `Data/external/agroscope_activity_zenodo/data_documentation.md`
- `Data/external/agroscope_activity_zenodo/activity_all_cows_sample_probe.csv`

Görülen / dokümante edilen kolonlar:

| Kolon | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| `time_stamp` | Aktivite ölçüm zamanı, 1 dakikalık interval | Evet | Hayır | Snapshot zamanı | `raw_sensor.record_datetime` |
| `timestamp` | Alan kullanımı ölçüm zamanı, 1 dakikalık interval | Evet | Hayır | Snapshot zamanı | `raw_sensor.record_datetime` |
| `cow_name` | Bireysel inek adı/ID | Hayır | Evet | Kimlik | `raw_sensor.external_cow_id`, `map_external_cow` |
| `mi` | Motion index, IceTag aktivite ölçümü | Hayır | Hayır | Ölçüm | `raw_sensor.activity_level` |
| `steps` | Dakika içindeki adım sayısı | Hayır | Hayır | Ölçüm | `raw_sensor.raw_payload.steps` veya feature |
| `area` | SMARTBOW alan/fonksiyonel bölge kategorisi | Hayır | Hayır | Ölçüm/kategori | `raw_sensor.raw_payload.barn_area` |

Kayıt türü: 1 dakikalık sensör snapshot. Olay veya sonuç değil.

Normalizasyon:

- `time_stamp` ve `timestamp` tek kolon adı olarak `record_datetime`.
- `cow_name` canonical ID olarak `agroscope_activity_zenodo:{cow_name}`.
- Günlük özetler: `activity_level_avg`, `steps_sum`, `area_minutes`,
  `area_entropy`, `lying_area_minutes`.

### `plos_rumiwatch_calving`

Yerel olarak indirilen dosyalar:

- `Data/external/plos_rumiwatch_calving/s1_raw_data.xlsx`
- `Data/external/plos_rumiwatch_calving/s1_ration_table.docx`
- `Data/external/plos_rumiwatch_calving/s2_activity_definitions.docx`
- `Data/external/plos_rumiwatch_calving/s3_diagnosis_criteria.docx`

S1 raw data içinde görülen sheet yapısı:

| Sheet | Görülen yapı | Veri tipi | Hedef yaklaşım |
|---|---|---|---|
| `Mean weekly activities` | Healthy/Sick group için `Week -2`, `Week -1`, `Week +1` mean/SD | Grup-level sonuç | Bireysel `raw_sensor` gibi yüklenmez; risk kuralı ve referans penceresi olarak kullanılır. |
| `Comparison with diagnosis` | Group-H/Group-S için `dd-2`, `dd-1`, `dd0` mean/SD | Göreli olay penceresi sonucu | `feat_health_risk_label` ve `map_sensor_type` kural kaynağı olur. |

Beklenen kolon/alan aileleri:

| Alan | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| `Week -2`, `Week -1`, `Week +1` | Calving'e göre göreli hafta | Göreli | Hayır | Sonuç penceresi | `raw_payload.relative_window` |
| `dd-2`, `dd-1`, `dd0` | Hastalık tanısına göre göreli gün | Göreli | Hayır | Sonuç penceresi | `raw_payload.relative_day` |
| `Group-H`, `Group-S` | Sağlıklı/hasta grup | Hayır | Hayır | Label grubu | `feat_health_risk_label` kuralı |
| eating / ruminating / lying / strides | Davranış metrikleri | Hayır | Hayır | Ölçüm özeti | `map_sensor_type`, feature rule |
| disease diagnosis criteria | Hastalık tanı kriterleri | Hayır | Hayır | Olay sözlüğü | `map_health_event_type` |
| ration close-up / fresh | Geçiş dönemi rasyon özeti | Hayır | Hayır | Referans rasyon | `raw_feed`, `opt_ration_constraint` adayı |

Kayıt türü: Grup-level sonuç ve göreli olay penceresi. Cow-day snapshot değil.

### `mmcows_multimodal`

Beklenen kolon/alan aileleri kaynak dokümantasyonundan:

| Alan ailesi | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| cow / tag / sensor id | İnek veya cihaz kimliği | Hayır | Evet | Kimlik | `raw_cow`, `map_external_cow` |
| timestamp / deployment day | Ölçüm zamanı | Evet | Hayır | Snapshot zamanı | `raw_sensor`, `raw_milk`, `raw_environment` |
| UWB location | 3D konum | Hayır | Hayır | Sensor snapshot | `raw_sensor.raw_payload` |
| neck IMMU / ankle acceleration | Aktivite/davranış | Hayır | Hayır | Sensor snapshot | `raw_sensor.activity_level`, `norm_sensor_daily` |
| CBT | Core body temperature | Hayır | Hayır | Sensor snapshot | `raw_sensor.body_temperature` |
| indoor THI / outdoor weather | Çevre | Hayır | Hayır | Çevre snapshot | `raw_environment`, `norm_environment_daily` |
| milk yield | Günlük süt verimi | Hayır | Hayır | Süt snapshot | `raw_milk.daily_milk_yield_kg` |
| health records | Sağlık kaydı | Evet olabilir | Hayır | Olay | `raw_health`, `norm_health_event` |

Kayıt türü: Cow-day ve high-frequency snapshot. Ana omurga.

Not: Görsel/video dosyaları ilk ETL kapsamı dışındadır; `raw_sensor` ve
`raw_milk` için tabular/sensor dosyaları önceliklidir.

### `transition_cow_part2`

Beklenen kolon/alan aileleri:

| Alan ailesi | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| cow id / herd id | İnek ve sürü kimliği | Hayır | Evet | Kimlik | `raw_cow`, `map_external_cow` |
| parity / lactation | Parite/laktasyon bağlamı | Hayır | Hayır | Snapshot/context | `raw_lactation`, `norm_cow_profile` |
| prepartum/postpartum DIM | Calving'e göre gün | Göreli | Hayır | Zaman bağlamı | `raw_lactation.raw_payload` |
| NEFA | Nonesterified fatty acids | Hayır | Hayır | Biomarker sonucu | `feat_health_risk_label` |
| BHB / BHBA | Beta-hydroxybutyrate | Hayır | Hayır | Biomarker sonucu | `feat_health_risk_label` |
| Hp | Haptoglobin | Hayır | Hayır | Biomarker sonucu | `feat_health_risk_label` |
| CK | Clinical ketosis | Evet olabilir | Hayır | Sağlık olayı | `raw_health`, `norm_health_event(health_ketosis)` |
| DA | Displaced abomasum | Evet olabilir | Hayır | Sağlık olayı | `raw_health`, `norm_health_event(health_displaced_abomasum)` |
| ME305 / milk outcome | 305 gün süt performansı | Hayır | Hayır | Sonuç | `raw_milk.raw_payload`, feature target |
| reproductive performance | Üreme sonucu | Evet olabilir | Hayır | Sonuç/olay | `raw_lactation`, feature target |

Kayıt türü: Cow-level cohort, event ve outcome karışımı.

### `czech_production_repro`

Beklenen kolon/alan aileleri:

| Alan ailesi | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| cow id | İnek kimliği | Hayır | Evet | Kimlik | `raw_cow` |
| breed | Irk | Hayır | Hayır | Profil | `norm_cow_profile.breed` |
| parity | Parite | Hayır | Hayır | Profil/laktasyon | `raw_cow.parity` |
| milk yield | Süt verimi | Hayır veya test-day | Hayır | Ölçüm/sonuç | `raw_milk.daily_milk_yield_kg` veya payload |
| fat/protein/lactose | Süt bileşeni | Hayır | Hayır | Ölçüm/sonuç | `raw_milk` |
| calving interval / reproduction parameter | Üreme sonucu | Kısmi | Hayır | Sonuç | `raw_lactation` |

Kayıt türü: Test-day veya laktasyon sonucu; dosya incelemesiyle ayrılacak.

### Besin ve Rasyon Referansları

Kaynaklar: `ns_dairy_cattle`, `nasem_2021_ncbi`, `feedipedia`

| Alan ailesi | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| feed name | Yem/hammadde adı | Hayır | Hayır | Parametre kimliği | `raw_feed_ingredient.feed_name`, `map_feed_type` |
| dry matter | Kuru madde oranı | Hayır | Hayır | Besin değeri | `dry_matter_percent` |
| NEL / ME | Enerji değeri | Hayır | Hayır | Besin değeri | `nel_mcal_kg_dm` |
| CP / MP | Protein değeri | Hayır | Hayır | Besin değeri | `cp_percent_dm`, `mp_percent_dm` |
| NDF / peNDF | Lif değeri | Hayır | Hayır | Besin değeri | `ndf_percent_dm`, `pe_ndf_percent_dm` |
| starch / fat / minerals | Nişasta, yağ, mineral | Hayır | Hayır | Besin değeri | `opt_feed_nutrient_value` |
| requirement rules | Stage/need bazlı sınırlar | Effective date | Hayır | Kısıt | `opt_ration_constraint` |

Kayıt türü: Referans parametre. Hayvan olayı değildir.

### Çevre Kaynağı

Kaynak: `nasa_power_environment`

| Alan ailesi | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| latitude/longitude | Çiftlik konumu | Hayır | Hayır | Lokasyon | `raw_environment.raw_payload` |
| date | Gün | Evet | Hayır | Zaman | `raw_environment.record_datetime` |
| T2M / T2M_MAX / T2M_MIN | Sıcaklık | Hayır | Hayır | Ölçüm | `temperature_c` |
| RH2M | Bağıl nem | Hayır | Hayır | Ölçüm | `humidity_percent` |
| THI | Türetilmiş sıcaklık-nem indeksi | Hayır | Hayır | Feature | `norm_environment_daily.thi` |

Kayıt türü: Location-day çevre snapshot.

### Ekonomik Kaynaklar

Kaynaklar: `usda_ams_dairy`, `eu_agri_food_milk`, `ulusal_sut_konseyi`,
`turib_feed_commodities`

| Alan ailesi | Anlam | Tarih mi? | Hayvan ID mi? | Veri tipi | Hedef |
|---|---|---:|---:|---|---|
| price/effective date | Parametre geçerlilik tarihi | Evet | Hayır | Zaman | `raw_economic_parameter.parameter_date` |
| product/commodity | Süt, arpa, mısır, buğday vb. | Hayır | Hayır | Parametre adı | `parameter_name` |
| price/value | Fiyat | Hayır | Hayır | Parametre değeri | `parameter_value` |
| unit | TL/L, TL/kg, EUR/100kg, USD/cwt vb. | Hayır | Hayır | Birim | `unit`, `map_unit` |
| currency | Para birimi | Hayır | Hayır | Para birimi | `currency_code` |
| region/member state/market | Piyasa veya bölge | Hayır | Hayır | Payload | `raw_payload.region` |

Kayıt türü: Ekonomik zaman serisi veya piyasa snapshot.

## Ortak Normalizasyon Sözlüğü

| Kanonik kolon | Kabul edilen kaynak varyantları |
|---|---|
| `external_cow_id` | `cow`, `cow_name`, `CowID`, `animal_id`, `id` |
| `record_datetime` | `timestamp`, `time_stamp`, `datetime`, `record time` |
| `record_date` | `date`, `record_date`, `test_day`, `day` |
| `event_date` | `diagnosis_date`, `calving_date`, `disease_date`, `event date` |
| `daily_milk_yield_kg` | `milk yield`, `daily milk`, `Yield`, `milk_kg` |
| `activity_level` | `mi`, `motion index`, `activity index` |
| `body_temperature` | `CBT`, `core body temperature`, `temperature` |
| `thi` | `THI`, `temperature humidity index`, `indoor_thi` |
| `feed_name` | `ingredient`, `feed`, `commodity`, `feedstuff` |
| `parameter_value` | `price`, `value`, `rate`, `amount` |

## Riskli Noktalar

- `plos_rumiwatch_calving` dosyası isim olarak "raw data" taşısa da görülen
  içerik bireysel cow-day değil, grup bazlı özet sonuçtur.
- `mmcows_multimodal` çok büyük olduğu için ilk yüklemede sadece tabular/sensor
  ve metadata parçaları seçilmelidir.
- `transition_cow_part2` ve `czech_production_repro` Mendeley dosyaları
  indirildikten sonra gerçek kolon şemalarıyla bu rapor güncellenmelidir.
- Besin/rasyon ve ekonomik kaynaklar hayvan olayı üretmez; doğrudan `event`
  tablosuna çevrilmemelidir.
