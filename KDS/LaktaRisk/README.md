# LaktaRisk

LaktaRisk, süt verimi, sağlık riski ve besleme ihtiyacı tahmini yapan Proje A
kodlarının teslim kopyasıdır.

## Kapsam

- `model/`: Proje A eğitim kodu, notebook, araştırma notları ve IEEE raporu.
- `scripts/`: MmCows sensör verisini günlük özelliklere dönüştüren kod.
- `sql/`: Veritabanı şeması, dış veri yükleme ve sentetik Proje A veri üretimi.

## Çalıştırma

```bash
python KDS/LaktaRisk/scripts/build_mmcows_daily_sensor_features.py
psql -d <db_name> -f KDS/LaktaRisk/sql/ml_smart_feed_create.sql
psql -d <db_name> -f KDS/LaktaRisk/sql/01_seed_meta_veri_kaynagi.sql
psql -d <db_name> -f KDS/LaktaRisk/sql/02_load_external_project_a.sql
psql -d <db_name> -f KDS/LaktaRisk/sql/04_generate_synthetic_project_a_features.sql
```

Model eğitimi:

```bash
python -m pip install -r KDS/LaktaRisk/model/code/requirements.txt
python KDS/LaktaRisk/model/code/run_training.py
```

## Veri Notu

Bu teslim klasörü kodu içerir; büyük veri dosyaları kopyalanmamıştır. Script ve
SQL dosyalarındaki veri yolları mevcut `KDS/Smart_Feed/Data/` klasörünü
kullanmaya devam eder.
