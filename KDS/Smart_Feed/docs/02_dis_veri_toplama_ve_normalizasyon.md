# 02 - Dış Veri Toplama, ETL ve Normalizasyon

## Faz Amacı

Bu fazın amacı model eğitmek veya rasyon optimizasyonu çalıştırmak değildir. Amaç,
`ml_smart_feed` şemasını besleyecek dış veri kaynaklarını kataloglamak, ham veri
toplama planını netleştirmek, kolon anlamlarını ayırmak ve verinin `raw_*`,
`norm_*`, `feat_*`, `opt_*` ve `sim_*` katmanlarına nasıl akacağını tanımlamaktır.

Tek bir mükemmel veri seti beklenmeyecek. Smart Feed için hibrit veri havuzu şu
katmanlardan kurulacak:

1. **Ana omurga veri:** İnek-zaman ekseninde süt, sensör, çevre, sağlık veya
   laktasyon sinyallerini birlikte taşıyan kaynaklar.
2. **Yardımcı sağlık/üreme/sensör veri:** Ana omurgadaki eksikleri tamamlayan,
   özellikle metabolik risk, davranış ve laktasyon ilişkisini güçlendiren
   kaynaklar.
3. **Besin/rasyon referans parametreleri:** Yem hammaddesi, besin değeri, DMI ve
   rasyon kısıtı sağlayan kaynaklar.
4. **Ekonomik reward parametreleri:** Süt fiyatı, yem fiyatı, sağlık cezası ve
   reward katsayılarını besleyen piyasa veya referans kaynakları.

Bu yaklaşım `KDS/Sürüden_keep_cull` içindeki dış veri toplama mantığıyla aynı
prensibi izler: önce kaynak kataloğu, sonra ham landing, sonra kolon anlamı,
sonra raw tablo yükleme ve en son kanonik akış.

## ETL Tanımı

Bu fazdaki ETL beş kontrollü adıma ayrılır:

1. **Extract / Catalog:** Kaynak metadata'sı `config/data_sources.yaml` içinde
   tutulur. Kaynak linki, rolü, beklenen formatı, manuel indirme gereksinimi ve
   hedef tablolar burada izlenir.
2. **Landing:** Küçük açıklama dosyaları ve erişilebilir örnekler
   `Data/external/<source_code>/` altına alınır. Büyük dosyalar, API anahtarı
   isteyen kaynaklar veya lisans kontrolü gerektiren indirmeler
   `Data/manual_downloads/README.md` içinde tarif edilir.
3. **Inspection:** Kaynakların kolon anlamları `reports/column_semantic_review.md`
   içinde ayrılır. Her kolon ailesi hayvan kimliği, tarih/zaman, olay,
   snapshot, sonuç veya parametre olarak etiketlenir.
4. **Transform / Normalize:** Tarih, hayvan kimliği, olay tipi, birim ve yem adı
   standartları uygulanır. Mapping tabloları `map_external_cow`,
   `map_health_event_type`, `map_sensor_type`, `map_feed_type` ve `map_unit`
   üzerinden yönetilir.
5. **Load:** Ham kayıtlar önce `raw_*` tablolarına, sonra uygun `norm_*`,
   `feat_*`, `opt_*` ve `sim_*` tablolarına akar.

## 2.1 Dış Veri Kaynaklarını Belirleme

Birincil karar:

- **Ana cow-day omurga:** `mmcows_multimodal`
- **Ana sağlık/metabolik label omurgası:** `transition_cow_part2`
- **Yardımcı sağlık/üreme/sensör kaynakları:** `czech_production_repro`,
  `plos_rumiwatch_calving`, `agroscope_activity_zenodo`
- **Besin/rasyon parametre kaynakları:** `ns_dairy_cattle`,
  `nasem_2021_ncbi`, `feedipedia`
- **Çevre parametresi:** `nasa_power_environment`
- **Reward/ekonomik parametre kaynakları:** `usda_ams_dairy`,
  `eu_agri_food_milk`, `ulusal_sut_konseyi`, `turib_feed_commodities`

| Kaynak | Rol | Link | Neden seçildi |
|---|---|---|---|
| `mmcows_multimodal` | Ana omurga | https://github.com/neis-lab/mmcows | Aynı zaman penceresinde sensör, süt, çevre ve sınırlı sağlık kaydı verir; `feat_cow_day_snapshot` için en iyi başlangıç omurgasıdır. |
| `transition_cow_part2` | Ana sağlık/metabolik label omurgası | https://data.mendeley.com/datasets/n9r22yzj5d/2 | NEFA, BHB, Hp, CK, DA, ME305 ve üreme çıktıları ile sağlık-risk label üretimini destekler. |
| `czech_production_repro` | Yardımcı süt/üreme | https://data.mendeley.com/datasets/6vy2tvv7jn/1 | Breed, parity, süt bileşenleri ve üreme sonuçlarıyla laktasyon bağlamını güçlendirir. |
| `plos_rumiwatch_calving` | Yardımcı davranış/sağlık | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0264834 | RumiWatch davranış ölçümleri, hastalık tanı kriterleri ve geçiş dönemi rasyon özetleri sağlar. |
| `agroscope_activity_zenodo` | Yardımcı sensör | https://zenodo.org/records/15005885 | 1 dakikalık aktivite ve alan kullanımı CSV'leriyle sensör normalizasyonunu test eder. |
| `ns_dairy_cattle` | Besin ihtiyacı parametresi | https://data.mendeley.com/datasets/hvc7smjjb7/4 | DMI, enerji ve besin ihtiyacı hesapları için model/workbook sağlar. |
| `nasem_2021_ncbi` | Besin değeri/kısıt referansı | https://www.ncbi.nlm.nih.gov/books/NBK600601/ | Yem kompozisyonu ve rasyon sınırları için ana bilimsel referanstır. |
| `feedipedia` | Yardımcı yem kompozisyonu | https://www.feedipedia.org/content/feed-databases | Yerel/alternatif yem adlarını ve kompozisyon boşluklarını tamamlamak için kullanılır. |
| `nasa_power_environment` | Çevre parametresi | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | Çiftlik koordinatına göre günlük sıcaklık/nem serileri ve THI türetimi sağlar. |
| `usda_ams_dairy` | Ekonomik reward | https://www.ams.usda.gov/market-news/dairy | ABD süt, dairy commodity ve feedstuff piyasa serileri için resmi kaynaktır. |
| `eu_agri_food_milk` | Ekonomik reward | https://agridata.ec.europa.eu/extensions/API_Documentation/milk.html | AB çiğ süt ve dairy price API katmanı sağlar. |
| `ulusal_sut_konseyi` | Türkiye süt fiyatı | https://ulusalsutkonseyi.org.tr/yillara-gore-cig-sut-fiyatlari-2194/ | Türkiye çiğ süt tavsiye fiyatı için ana yerel parametre kaynağıdır. |
| `turib_feed_commodities` | Türkiye yem fiyat proxy | https://www.turib.com.tr/ | Arpa, mısır, buğday gibi yem hammaddeleri için yerel fiyat proxy kaynağıdır. |

## 2.2 Ham Veri İndirme / Toplama

İndirilen küçük dosyalar:

- `Data/external/agroscope_activity_zenodo/data_documentation.md`
- `Data/external/agroscope_activity_zenodo/activity_all_cows_sample_probe.csv`
- `Data/external/plos_rumiwatch_calving/s1_raw_data.xlsx`
- `Data/external/plos_rumiwatch_calving/s1_ration_table.docx`
- `Data/external/plos_rumiwatch_calving/s2_activity_definitions.docx`
- `Data/external/plos_rumiwatch_calving/s3_diagnosis_criteria.docx`

Büyük veya manuel kaynaklar:

| Kaynak | Toplama şekli | Dosya beklentisi | Not |
|---|---|---|---|
| `mmcows_multimodal` | Manuel / HuggingFace veya Kaggle | `sensor_data.zip`, opsiyonel `visual_data.zip` | Çok büyük dosyalar git çalışma alanına otomatik indirilmemeli. İlk ETL için sadece sensör, süt, çevre ve health kayıtları çekilmeli. |
| `transition_cow_part2` | Manuel / Mendeley | Tabular Mendeley dosyaları | Dosya isimleri ve kolonlar indirildikten sonra doğrulanacak. |
| `czech_production_repro` | Manuel / Mendeley | Tabular Mendeley dosyaları | Cow/lactation/test-day ayrımı dosya incelemesinden sonra netleşecek. |
| `ns_dairy_cattle` | Manuel / Mendeley | Spreadsheet / workbook | Formül ve referans tabloları ayrı çıkarılmalı. |
| `nasem_2021_ncbi` | Manuel parser | HTML/PDF tablo | `raw_feed_ingredient` ve `opt_ration_constraint` için tablo çıkarımı gerekir. |
| `feedipedia` | Manuel/parser | HTML/feed table | Her yem sayfasının lisansı ve birim anlamı ayrı doğrulanmalı. |
| `nasa_power_environment` | API | CSV/JSON | Çiftlik koordinatı olmadan nihai veri çekilemez; örnek query şablonu tutulacak. |
| `usda_ams_dairy` | API/PDF parser | JSON/PDF | MyMarketNews API ve haftalık PDF raporları ayrı pipeline olmalı. |
| `eu_agri_food_milk` | API | JSON/Excel | `/api/rawMilk/prices` ve `/api/dairy/prices` endpointleri kullanılacak. |
| `ulusal_sut_konseyi` | HTML parser | HTML tablo | Tarih aralıkları gün bazına expand edilecek. |
| `turib_feed_commodities` | HTML parser | Piyasa verisi | Snapshot ise tarih/saat ile saklanacak. |

## 2.3 Kolon ve Anlam İncelemesi

Kolon anlamı dört tip olarak ayrılır:

- **Kimlik alanı:** `cow_id`, `cow_name`, `animal_id`, `external_cow_id`,
  `farm_id`, `group_id`
- **Zaman alanı:** `record_date`, `record_datetime`, `timestamp`,
  `time_stamp`, `calving_date`, `event_date`, `parameter_date`
- **Ölçüm/snapshot alanı:** süt, sensör, çevre, DMI, BCS, BW, THI, yem miktarı
- **Olay/sonuç/parametre alanı:** health diagnosis, calving, dry-off,
  pregnancy outcome, disease label, price, nutrient value, ration constraint

Önemli kaynak gözlemleri:

| Kaynak | Hayvan kimliği | Tarih alanı | Veri tipi | Kritik kolon/alan aileleri |
|---|---|---|---|---|
| `mmcows_multimodal` | Cow ID / sensor ID | Timestamp + deployment day | Cow-day ve high-frequency snapshot | UWB, IMMU, CBT, ankle, indoor THI, weather, milk yield, health records |
| `transition_cow_part2` | Cow/herd ID beklenir | Prepartum/postpartum gün, test day, outcome tarihi | Cohort outcome + label | NEFA, BHB, Hp, CK, DA, ME305, reproductive outcome |
| `czech_production_repro` | Cow ID beklenir | 2018 / lactation veya test-day tarihleri | Cow/lactation sonucu | Breed, parity, milk yield, fat, protein, lactose, reproduction parameters |
| `plos_rumiwatch_calving` | İndirilen S1 raw dosyada bireysel cow ID yok | `wk -2`, `wk -1`, `wk +1`, `dd-2`, `dd-1`, `dd0` göreli zaman | Grup-level sonuç | Eating time, ruminating time, chews, lying time, strides, disease criteria, ration table |
| `agroscope_activity_zenodo` | `cow_name` | `time_stamp` veya `timestamp` | 1 dakikalık sensör snapshot | `mi`, `steps`, `area` |
| `ns_dairy_cattle` | Yok | Model versiyonu/effective date | Parametre/model | DMI, energy, protein, mineral requirement |
| `nasem_2021_ncbi` | Yok | Yayın/effective date | Referans tablo | feed name, DM, NEL, CP, NDF, starch, minerals |
| `feedipedia` | Yok | Kaynak tarihi/effective date | Referans tablo | feed name, chemical composition, digestibility, energy/protein values |
| `nasa_power_environment` | Farm/location | API date | Günlük çevre snapshot | T2M, RH2M, T2M_MAX, T2M_MIN, derived THI |
| Ekonomik kaynaklar | Yok | price/effective date | Parametre serisi | milk price, feed price, currency, unit, market region |

## 2.4 Raw Tablolara Yerleştirme Planı

| Kaynak | Hedef raw tablo | Hedef norm/feature/opt tablo | Not |
|---|---|---|---|
| `mmcows_multimodal` | `raw_cow`, `raw_milk`, `raw_sensor`, `raw_environment`, `raw_health` | `norm_*`, `feat_cow_day_snapshot`, `feat_health_risk_label`, `sim_state` | Birincil cow-day omurga. |
| `transition_cow_part2` | `raw_cow`, `raw_lactation`, `raw_health`, `raw_milk` | `norm_health_event`, `feat_health_risk_label`, `feat_feeding_need_label` | Sağlık/metabolik label üretiminde ana kaynak. |
| `czech_production_repro` | `raw_cow`, `raw_lactation`, `raw_milk` | `norm_cow_profile`, `norm_lactation_daily`, `feat_milk_trend` | Test-day/lactation summary ayrımı yapılmalı. |
| `plos_rumiwatch_calving` | `raw_sensor`, `raw_health`, `raw_feed` | `norm_sensor_daily`, `norm_health_event`, `feat_health_risk_label`, `opt_ration_constraint` | İndirilen raw data özet olduğu için cow-day training satırı gibi kullanılmayacak. |
| `agroscope_activity_zenodo` | `raw_sensor` | `norm_sensor_daily`, `feat_cow_day_snapshot` | Aktivite/alan kullanımı günlük özete çevrilir. |
| `ns_dairy_cattle` | `raw_feed`, `raw_feed_ingredient` | `norm_feeding_daily`, `feat_feeding_need_label`, `opt_ration_constraint` | Model çıktıları ve kısıtlar versiyonlanmalı. |
| `nasem_2021_ncbi` | `raw_feed_ingredient` | `opt_feed_ingredient`, `opt_feed_nutrient_value`, `opt_ration_constraint` | Referans tablo parser gerekir. |
| `feedipedia` | `raw_feed_ingredient` | `opt_feed_ingredient`, `opt_feed_nutrient_value` | Eksik yem kompozisyonlarını tamamlar. |
| `nasa_power_environment` | `raw_environment` | `norm_environment_daily`, `feat_cow_day_snapshot`, `sim_state` | Çiftlik koordinatı ile çekilir. |
| `usda_ams_dairy` | `raw_economic_parameter` | `opt_feed_price`, `opt_milk_price`, `sim_reward_parameter` | ABD fiyat/reward senaryoları. |
| `eu_agri_food_milk` | `raw_economic_parameter` | `opt_milk_price`, `sim_reward_parameter` | AB fiyat/reward senaryoları. |
| `ulusal_sut_konseyi` | `raw_economic_parameter` | `opt_milk_price`, `sim_reward_parameter` | Türkiye süt fiyatı. |
| `turib_feed_commodities` | `raw_economic_parameter` | `opt_feed_price`, `sim_reward_parameter` | Türkiye yem fiyat proxy. |

## 2.5 Normalizasyon Kuralları

### Tarih Formatı

- DB içinde tüm tarih alanları ISO `YYYY-MM-DD` olarak tutulacak.
- Timestamp alanları `YYYY-MM-DD HH:MM:SS` formatına çevrilecek.
- Kaynak local time bilgisi yoksa `timezone_source='unknown'` payload içinde
  korunacak.
- Göreli zaman alanları (`wk -1`, `dd0`, `days_from_calving`) doğrudan tarih
  gibi yazılmayacak; `relative_day`, `relative_window`, `anchor_event` olarak
  payload veya norm kolonlarına alınacak.

### Hayvan Kimliği Standardı

Kanonik dış ID:

```text
{source_code}:{external_cow_id}
```

Örnek:

```text
agroscope_activity_zenodo:Heidi
mmcows_multimodal:cow_07
```

`map_external_cow` içinde ham ID, kaynak ID, normalize `cow_id`, opsiyonel
`core_inek_id` ve güven skoru tutulacak. Aynı isim farklı kaynaklarda çakışsa
bile canonical ID çakışmayacak.

### Olay Tipi Standardı

Kanonik sağlık/olay sözlüğü v1:

```text
calving
dryoff
pregnancy_positive
pregnancy_loss
milk_measurement
sensor_activity
sensor_rumination
sensor_lying
sensor_body_temperature
environment_measurement
feed_delivery
ration_change
health_ketosis
health_mastitis
health_metritis
health_lameness
health_displaced_abomasum
health_asidosis
health_energy_deficit
other
```

### Eksik Veri Yaklaşımı

- Zorunlu kimlik veya tarih yoksa satır raw tabloya alınmaz; `rejected_rows`
  benzeri raporda kaynak, dosya, satır ve gerekçe ile izlenir.
- Ölçüm kolonu eksikse satır korunur; ilgili normalizasyon çıktısı null kalır.
- Özet/sonuç veri setleri cow-day event gibi genişletilmez. Örneğin PLOS S1 raw
  dosyasındaki grup-level mean/SD değerleri yalnızca risk kuralı veya referans
  pencere üretiminde kullanılacak.
- Eksik DMI/BCS/BW gibi alanlar sentetik doldurulacaksa `imputation_method`,
  `source_confidence` ve `synthetic_flag` tutulacak.

### Ortak Kolon İsimleri

| Kaynak varyantları | Kanonik kolon |
|---|---|
| `cow`, `cow_name`, `animal_id`, `CowID`, `id` | `external_cow_id` |
| `timestamp`, `time_stamp`, `datetime`, `record time` | `record_datetime` |
| `date`, `record_date`, `test_day` | `record_date` |
| `milk yield`, `daily milk`, `Yield`, `milk_kg` | `daily_milk_yield_kg` |
| `fat`, `milk fat`, `fat_percent` | `milk_fat_percent` |
| `protein`, `milk protein`, `protein_percent` | `milk_protein_percent` |
| `SCC`, `somatic cell count` | `scc` |
| `BHB`, `BHBA` | `bhb_mmol_l` |
| `NEFA` | `nefa_mmol_l` |
| `mi`, `motion index`, `activity index` | `activity_level` |
| `steps`, `step_count` | `steps` |
| `area`, `zone`, `barn area` | `barn_area` |
| `temperature`, `T2M` | `temperature_c` |
| `humidity`, `RH2M` | `humidity_percent` |
| `feed_name`, `ingredient`, `commodity` | `feed_name` |
| `DM`, `dry matter` | `dry_matter_percent` |
| `CP`, `crude protein` | `cp_percent_dm` |
| `NDF` | `ndf_percent_dm` |
| `starch` | `starch_percent_dm` |
| `price`, `value` | `parameter_value` |
| `unit`, `uom` | `unit` |
| `currency`, `currency_code` | `currency_code` |

## 2.6 Kanonik Olay Akışına Dönüştürme

Akış:

```text
raw_cow
raw_milk
raw_lactation
raw_health
raw_feed
raw_feed_ingredient
raw_sensor
raw_environment
raw_economic_parameter
        ↓
map_external_cow
map_health_event_type
map_feed_type
map_sensor_type
map_unit
        ↓
norm_cow_profile
norm_lactation_daily
norm_milk_daily
norm_health_event
norm_feeding_daily
norm_sensor_daily
norm_environment_daily
        ↓
feat_cow_day_snapshot
feat_milk_trend
feat_health_risk_label
feat_feeding_need_label
        ↓
opt_feed_ingredient
opt_feed_nutrient_value
opt_feed_price
opt_milk_price
opt_ration_constraint
        ↓
sim_reward_parameter
sim_state
sim_action
sim_transition
```

Kaynak bazlı dönüşüm:

- `mmcows_multimodal`
  - Sensor timestamp kayıtları `raw_sensor` ve günlük özetle
    `norm_sensor_daily`.
  - Milk yield kayıtları `raw_milk` ve `norm_milk_daily`.
  - Indoor THI/outdoor weather `raw_environment` ve `norm_environment_daily`.
  - Health records varsa `raw_health` ve `norm_health_event`.
  - Birleşik çıktı `feat_cow_day_snapshot`.
- `transition_cow_part2`
  - Biomarker sonuçları doğrudan event değil; risk label inputu.
  - CK/DA gibi tanılar `raw_health` -> `norm_health_event`.
  - ME305 ve reproduction outcome sonuçları `raw_lactation` payload ve
    feature label tarafına gider.
- `czech_production_repro`
  - Breed/parity `raw_cow`.
  - Süt bileşenleri `raw_milk`.
  - Calving/reproduction outcome `raw_lactation`.
- `plos_rumiwatch_calving`
  - RumiWatch activity definitions `map_sensor_type`.
  - Disease criteria `map_health_event_type` ve `feat_health_risk_label` kuralı.
  - Ration table `raw_feed` veya `opt_ration_constraint` seed adayı.
  - S1 raw data özet olduğundan `norm_sensor_daily` içine bireysel kayıt gibi
    yüklenmez.
- `agroscope_activity_zenodo`
  - `time_stamp/timestamp`, `cow_name`, `mi`, `steps`, `area`
    `raw_sensor` içine alınır.
  - Günlük `activity_level_avg`, `steps_sum`, `barn_area_entropy`,
    `lying_area_minutes` gibi özetler `norm_sensor_daily` içine gider.
- Besin/rasyon kaynakları
  - `raw_feed_ingredient` içine kaynak değerler kayıpsız alınır.
  - `map_feed_type` ile canonical `feed_code` üretilir.
  - `opt_feed_nutrient_value` ve `opt_ration_constraint` beslenir.
- Ekonomik kaynaklar
  - Tüm değerler önce `raw_economic_parameter`.
  - Süt fiyatları `opt_milk_price`.
  - Yem fiyatları `opt_feed_price`.
  - Health/ration penalty katsayıları `sim_reward_parameter`.

## 2.7 Çıktı

Bu fazın çıktıları:

- `config/data_sources.yaml`: kaynak kataloğu, linkler, roller, hedef tablolar.
- `reports/dataset_mapping_table.md`: hangi kaynak ne işe yarar, hangi tabloya
  iner.
- `reports/column_semantic_review.md`: kolon anlamı, tarih alanı, hayvan kimliği
  ve olay/snapshot/sonuç ayrımı.
- `reports/raw_load_plan.md`: `raw_*` yükleme ve normalizasyon planı.
- `reports/download_log.csv`: indirilen ve manuel bekleyen veri dosyaları.
- `Data/manual_downloads/README.md`: büyük veya manuel kaynaklar için indirme
  talimatları.
- `sql/01_seed_meta_veri_kaynagi.sql`: `ml_smart_feed.meta_veri_kaynagi`
  için idempotent kaynak metadata seed'i.
- `Data/external/agroscope_activity_zenodo/`: küçük Zenodo doküman/probe dosyası.
- `Data/external/plos_rumiwatch_calving/`: PLOS supplementary XLSX/DOCX dosyaları.

Bu fazdan sonra yapılacak iş, her kaynak için gerçek dosya şeması netleşince
`raw_*` yükleyicileri ve `map_*` seed dosyalarını yazmaktır.
