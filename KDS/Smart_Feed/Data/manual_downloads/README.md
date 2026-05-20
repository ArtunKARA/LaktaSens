# Smart Feed Manuel İndirme Talimatları

Bu klasör, otomatik indirilmemesi gereken büyük dosyalar, manuel oturum/API
gerektiren kaynaklar ve lisans kontrolü yapılmadan pipeline'a alınmaması gereken
veriler için takip alanıdır.

## Manuel veya Büyük İndirme Gerektiren Kaynaklar

### `mmcows_multimodal`

- Landing: https://github.com/neis-lab/mmcows
- Primary download: https://huggingface.co/datasets/neis-lab/mmcows
- Kaggle mirror: https://www.kaggle.com/datasets/hienvuvg/mmcows
- İlk ETL için indirilecek minimum dosya:
  - `sensor_data.zip`
- `sensor_data.zip` içinden gerekli veri aileleri:
  - `main_data/uwb`
  - `main_data/immu`
  - `main_data/pressure`
  - `main_data/cbt`
  - `main_data/ankle`
  - `main_data/thi`
  - `main_data/weather`
  - `main_data/milk`
  - `sub_data/health_records`
  - Not: Mevcut çıkarılmış kopyada health kayıtları kökte `health_records/`
    klasörü olarak duruyor; bu da kabul edilen yerleşimdir.
  - Gerekirse ikinci adımda `sub_data/uwb_distance`, `sub_data/head_direction`,
    `sub_data/ankle_accel`
- Şimdilik indirilmemesi gerekenler:
  - `visual_data.zip`
  - `uwb_synced_images/`
  - `1s_interval_images/`
  - `1s_interval_images_3hr/`
  - `cow_gallery.zip`
  - `cropped_bboxes.zip`
  - `sensor_model_weights.zip`
  - `trained_models.zip`
- HuggingFace dosya bazlı indirme:
  Komutlar repo kökünden çalıştırılacak şekilde yazılmıştır.

```powershell
cd KDS/Smart_Feed
pip install huggingface_hub
huggingface-cli download neis-lab/mmcows sensor_data.zip --repo-type dataset --local-dir Data/external/mmcows_multimodal
```

- Kaggle ile dosya bazlı indirme (Kaggle API token gerekir):

```powershell
cd KDS/Smart_Feed
pip install kaggle
kaggle datasets download -d hienvuvg/mmcows -f sensor_data.zip -p Data/external/mmcows_multimodal
```

- Not: `sensor_data.zip` yaklaşık 18 GB, `visual_data.zip` yaklaşık 20 GB
  olarak listeleniyor. Bu dosyalar git'e eklenmemeli.
- Yerleşim önerisi: `Data/external/mmcows_multimodal/`

### `transition_cow_part2`done

- Landing: https://data.mendeley.com/datasets/n9r22yzj5d/2
- DOI: https://doi.org/10.17632/n9r22yzj5d.2
- İndirilen dosyalar:
  - `Data/external/transition_cow_part2/supplemental_table_s1.pdf`
  - `Data/external/transition_cow_part2/transition_cow_part2_supplemental_table_s1.csv`
  - `Data/external/transition_cow_part2/mendeley_dataset_metadata.json`
- Not: Mendeley v2 public dosya listesinde tek dosya `Supplemental Table S1.pdf`
  olarak göründü; PDF tablo CSV'ye 15 outcome/model satırı olarak çıkarıldı.
- Beklenen içerik:
  - Cow/herd level tabular dosyalar
  - Biomarker, health disorder, milk yield, reproduction outcome alanları
- Yerleşim önerisi: `Data/external/transition_cow_part2/`
- İlk incelemede aranacak kolonlar:
  - cow/herd ID
  - parity/lactation
  - NEFA, BHB/BHBA, haptoglobin
  - CK, DA ve diğer sağlık olayları
  - milk/reproduction outcome

### `czech_production_repro`done

- Landing: https://data.mendeley.com/datasets/6vy2tvv7jn/1
- Article assets: https://aab.copernicus.org/articles/67/197/2024/aab-67-197-2024-assets.html
- DOI: https://doi.org/10.17632/6vy2tvv7jn.1
- Beklenen içerik:
  - Breed, parity, milk composition, reproduction parameters
- Yerleşim önerisi: `Data/external/czech_production_repro/`
- İlk incelemede test-day mi, laktasyon özeti mi ayrılmalı.

### `ns_dairy_cattle`done

- Landing: https://data.mendeley.com/datasets/hvc7smjjb7/4
- DOI: https://doi.org/10.17632/hvc7smjjb7.4
- Beklenen içerik:
  - Spreadsheet / workbook
  - DMI, energy, protein and nutrient requirement calculations
- Yerleşim önerisi: `Data/external/ns_dairy_cattle/`
- Not: Formül hücreleri ve referans tabloları ayrı çıkarılmalı.

### `nasem_2021_ncbi`done

- National Academies: https://nap.nationalacademies.org/catalog/25806/nutrient-requirements-of-dairy-cattle-eighth-revised-edition
- NCBI feed composition chapter: https://www.ncbi.nlm.nih.gov/books/NBK600601/
- DOI: https://doi.org/10.17226/25806
- CSV çıktıları:
  - `Data/external/nasem_2021_ncbi/nasem_2021_table_19_1_feed_nutrient_composition_long.csv`
  - `Data/external/nasem_2021_ncbi/nasem_2021_table_19_2_feed_aa_fa_composition_long.csv`
  - `Data/external/nasem_2021_ncbi/nasem_2021_table_19_3_mineral_sources_long.csv`
  - Aynı tablolar için raw CSV kopyaları da aynı klasörde tutulur.
- Beklenen içerik:
  - Feed composition tables
  - Requirement constraints
- Yerleşim önerisi:
  - Parser çıktısı: `Data/external/nasem_2021_ncbi/`
  - Ham PDF/HTML kopyaları lisans kontrolünden sonra alınmalı.

### `voederbomen_nutritionalvalues`done

- Landing: https://www.voederbomen.nl/nutritionalvalues/
- Beklenen içerik:
  - Fodder tree / shrub nutritional values
  - General analysis, fibre fractions, macro/micro elements and source references
- Yerleşim önerisi: `Data/external/voederbomen_nutritionalvalues/`
- CSV çıktıları:
  - `Data/external/voederbomen_nutritionalvalues/voederbomen_nutritionalvalues_detail_rows.csv`
  - `Data/external/voederbomen_nutritionalvalues/voederbomen_nutritionalvalues_average_rows.csv`
- Not: Site varsayılan görünümde ilk 100 girdiyi gösterdiği için 92
  group/genus filtresi dolaşıldı; tekrar eden `''` alanları önceki group/species/tree
  part değeriyle dolduruldu.

### `feedipedia`boş sanırım

- Landing: https://feedipedia.org/
- Feed databases: https://www.feedipedia.org/content/feed-databases
- Beklenen içerik:
  - Feed names
  - Chemical composition
  - Digestibility and energy/protein values
- Yerleşim önerisi: `Data/external/feedipedia/`
- Not: Her alt veritabanının lisansı ayrıca kontrol edilmeli.

## API / HTML Parser Gerektiren Kaynaklar

### `nasa_power_environment` limiti var bakılacak

- Docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- API pages: https://power.larc.nasa.gov/api/pages/
- Örnek şablon:

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,T2M_MAX,T2M_MIN&community=AG&longitude={lon}&latitude={lat}&start={yyyymmdd}&end={yyyymmdd}&format=CSV&time-standard=UTC
```

### `usda_ams_dairy`

- Landing: https://www.ams.usda.gov/market-news/dairy
- API FAQ: https://mymarketnews.ams.usda.gov/mymarketnews-api/faqs
- Weekly PDF: https://www.ams.usda.gov/mnreports/dywweeklyreport.pdf
- Not: PDF raporları ayrı parser ister; API varsa önce API kullanılmalı.

### `eu_agri_food_milk` grafik var nasıl alırız bilmiyorum

- Portal: https://agridata.ec.europa.eu/extensions/DataPortal/milk.html
- API docs: https://agridata.ec.europa.eu/extensions/API_Documentation/milk.html
- Raw milk dashboard: https://agridata.ec.europa.eu/extensions/DashboardRawMilk/RawMilkPrices-m.html
- Ana endpointler:
  - `/api/rawMilk/prices`
  - `/api/dairy/prices`

### `ulusal_sut_konseyi` fiyat olarak var tablo mablo yok

- Duyurular: https://ulusalsutkonseyi.org.tr/duyuru/
- Tarihsel fiyatlar: https://ulusalsutkonseyi.org.tr/yillara-gore-cig-sut-fiyatlari-2194/
- Not: Tarih aralığı tablosu günlük `valid_from/valid_to` yapısına expand edilmeli.

### `turib_feed_commodities` yem fiyatları tablo bulamadım

- Landing: https://www.turib.com.tr/
- Arpa sayfası: https://www.turib.com.tr/arpa-fiyatlari/
- Not: Piyasa verisi snapshot ise çekim tarihi ve saatiyle saklanmalı.
