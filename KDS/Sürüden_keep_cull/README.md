# Sürüden Keep/Cull RL-MDP Prototipi

Bu klasör, `suru_karar` PostgreSQL şeması için dış veri toplama ve normalizasyon fazının çalışma alanıdır. Bu fazda model eğitimi yapılmaz; önce veri kaynakları kataloglanır, indirilebilir dosyalar yerleştirilir, dosya şemaları incelenir ve raw/event tablo mapping şablonu üretilir.

## 1. Ortam Kurulumu

```bash
cd KDS/Sürüden_keep_cull
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` içindeki PostgreSQL değerlerini kendi ortamına göre doldur. Gerçek şifre repoya yazılmamalıdır.

## 2. Klasör Hazırlama

```bash
python scripts/01_prepare_directories.py
```

Bu komut `docs/`, `sql/`, `data/`, `data/raw/`, `data/external/`, `data/manual_downloads/`, `data/processed/`, `scripts/`, `notebooks/`, `reports/` ve `config/` klasörlerini idempotent olarak oluşturur.

## 3. SQL Şema Kurulumu

Mevcut DDL:

```bash
psql -d laktasens_poc -f Data/Database/create.sql
```

Yeni `sql/00_schema_suru_karar.sql` dosyası sadece placeholder'dır; mevcut DDL bozulmasın diye gerçek şema `Data/Database/create.sql` içinde bırakıldı.

## 4. Kaynakları Kayıt Etme

```bash
python scripts/02_register_sources.py
```

Bu komut `config/data_sources.yaml` dosyasını okuyup `suru_karar.meta_veri_kaynagi` tablosuna `insert ... on conflict` mantığıyla işler.

Alternatif olarak SQL seed:

```bash
psql -d laktasens_poc -f sql/01_seed_meta_veri_kaynagi.sql
psql -d laktasens_poc -f sql/02_seed_reward_parametre_baseline.sql
```

## 5. Veri İndirme

```bash
python scripts/03_download_sources.py
```

Doğrudan indirilebilen kaynaklar `data/external/<source_code>/` altına yazılır. Manuel işlem gereken kaynaklar `data/manual_downloads/README.md` içine eklenir. Her deneme `reports/download_log.csv` dosyasına kaydedilir.

## 6. Dosya İnceleme

```bash
python scripts/04_inspect_downloaded_files.py
```

CSV, TSV/TAB, XLSX ve ZIP içindeki desteklenen dosyalar taranır. Sonuçlar `reports/file_inspection_report.md` içine yazılır.

## 7. Mapping Template Üretme

```bash
python scripts/05_generate_column_mapping_template.py
```

Her indirilen dosya kolonu için `reports/column_mapping_template.csv` üretilir. Otomatik öneriler başlangıçtır; raw tablo yükleme öncesinde manuel onay gerekir.

## 8. Ekonomik Reward Adaylarını Çıkarma

```bash
python scripts/06_extract_reward_parameter_candidates.py
python scripts/11_build_reward_baseline.py
```

İlk komut USDA NASS ve USDA ERS dosyalarından `feat_reward_parametre` için aday ekonomik değerleri çıkarır. İkinci komut kaynak değerlerinden `baseline_us_2025_mixed_source_v1` senaryosunu üretir:

- `data/processed/reward_baseline_us_2025.csv`
- `reports/reward_baseline_us_2025_review.md`
- `sql/08_seed_reward_parametre_us_2025.sql`

Bu baseline içinde `sut_fiyati` ve `gunluk_bakim_maliyeti` kaynak veriden türetilir; replacement, cull satış, tedavi ve tohumlama maliyetleri açıkça sentetik prototip varsayımı olarak işaretlenir.

PostgreSQL'e yazmak için:

```bash
psql -d laktasens -f sql/08_seed_reward_parametre_us_2025.sql
```

## 9. Kolon Anlamı ve Raw Yerleşim Raporları

```bash
python scripts/07_build_column_semantic_review.py
```

Bu komut `config/canonical_event_rules.yaml` ile mapping template'i birleştirir. `reports/column_semantic_review.md` ve `reports/raw_load_plan.md` üretilir.

## 10. Raw ve Event Candidate CSV Üretimi

```bash
python scripts/08_build_raw_and_event_candidates.py
```

Güvenilir tabular kaynaklardan dry-run çıktılarını üretir:

- `data/processed/raw_candidates/*.csv`
- `data/processed/event_candidates/*.csv`
- `data/processed/event_normalized_candidates.csv`
- `data/processed/map_external_inek_candidates.csv`
- `data/processed/rejected_rows.csv`

## 11. Opsiyonel PostgreSQL Yükleme

```bash
python scripts/09_load_canonical_to_postgres.py
```

`.env` yoksa hata vermeden DB yüklemeyi atlar. `.env` varsa candidate CSV'leri `suru_karar` şemasına kaynak bazlı replace mantığıyla yüklemeye çalışır.

Alternatif olarak candidate CSV'leri doğrudan PostgreSQL'e yüklemek için:

```bash
psql -d laktasens -f sql/06_load_raw_event_candidates_from_csv.sql
```

## 12. Eğitim Veri Seti Snapshot Üretimi

```bash
python scripts/10_build_training_snapshots.py
```

Candidate event CSV'lerinden aylık hayvan snapshot veri setini üretir:

- `data/processed/training/inek_aylik_snapshot.csv`
- `data/processed/training/inek_aylik_snapshot_model_ready.csv`
- `data/processed/training/train_test_split.csv`
- `reports/training_feature_list.md`
- `reports/training_dataset_review.md`

PostgreSQL karşılığı için:

```bash
psql -d laktasens -f sql/03_build_feat_inek_aylik_snapshot.sql
psql -d laktasens -f sql/04_select_training_dataset_with_split.sql
```

Dry-run CSV çıktısını doğrudan PostgreSQL tablosuna yüklemek için:

```bash
psql -d laktasens -f sql/05_load_training_snapshot_from_csv.sql
```

Prototip UI/DB smoke-test için RL tablolarını açıkça sentetik olarak doldurmak için:

```bash
psql -d laktasens -f sql/07_seed_synthetic_smoke_test_records.sql
```

## 13. Ortam Kontrolü

```bash
python scripts/00_check_environment.py
```

Python sürümü, paketler, klasörler, `.env` varlığı ve opsiyonel PostgreSQL bağlantısı kontrol edilir.

## Sonraki Adım

Faz 3 sonunda aylık eğitim snapshot'ı ve zaman bazlı train/test split hazır olur. Sonraki fazda supervised baseline risk modeli veya MDP geçiş veri seti üretimine geçilecek.
