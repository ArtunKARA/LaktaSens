# Faz 3: Eğitim Veri Seti Oluşturma

Bu fazın amacı model eğitmek değildir. Amaç, Faz 2.1'de üretilen kanonik
event adaylarından model girişi olacak aylık hayvan snapshot veri setini
hazırlamaktır.

DB tarafındaki hedef tablo mevcut DDL'deki
`suru_karar.feat_inek_aylik_snapshot` tablosudur. Dry-run çalışma ise
`data/processed/training/inek_aylik_snapshot.csv` dosyasını üretir.

## Grain

Her satır:

```text
1 hayvan x 1 ay sonu referans_tarih
```

Snapshot üretimi hayvanın ilk gözlenen event ayından başlar. Hayvanın culling
tarihi varsa bu tarihten sonraki aylar üretilmez. Feature hesapları sadece
`event_date <= referans_tarih` koşuluyla yapılır; gelecek bilgi feature tarafına
sızdırılmaz.

## Feature Seti

| Feature | Tanım |
|---|---|
| `laktasyon_no` | Referans tarihinden önceki son doğurma event'indeki laktasyon numarası. |
| `parite` | Referans tarihinden önceki son doğurma event'indeki parite. |
| `dim` | Son doğurma tarihi ile referans tarihi arasındaki gün farkı. |
| `yas_gun` | Güvenilir inek doğum tarihi varsa hesaplanır; dry-run'da güvenilir cow birth yoksa null kalır. |
| `gebe_mi` | Son positive pregnancy diagnosis sonrası calving/loss yoksa true; loss/calving sonrası false; belirsizse null. |
| `servis_sayisi` | Son doğurmadan sonra referans tarihine kadar görülen insemination sayısı. |
| `son_servis_gun` | Son insemination üzerinden geçen gün. |
| `gebelik_kaybi_flag` | Son 365 günde pregnancy_loss varsa true. |
| `son30_saglik_olay_sayisi` | Son 30 günde health event sayısı. |
| `mastitis_flag` | Son 30 günde mastitis health event varsa true. |
| `lameness_flag` | Son 30 günde lameness health event varsa true. |
| `son30_ortalama_sut` | Son 30 günde ortalama süt kg. |
| `sut_trend_7g` | Son 7 gün ortalaması eksi önceki 7 gün ortalaması. |

## Label Seti

Dry-run CSV'de label kolonları:

- `cull_within_30d`
- `cull_within_60d`
- `cull_within_90d`
- `label_30d_observed`
- `label_60d_observed`
- `label_90d_observed`

DB tablosundaki karşılıkları:

- `cull_30g`
- `cull_60g`
- `cull_90g`

Label kuralı:

- `referans_tarih < culling_tarihi <= referans_tarih + horizon` ise label `1`.
- Bu aralıkta culling yoksa ve gözlem sonu horizon'ı kapsıyorsa label `0`.
- Gözlem horizon'ı kapsamıyorsa label null bırakılır.

Culling gözlenmeyen kaynaklarda otomatik olarak "cull yok" varsayımı yapılmaz.
Yalnızca hayvanın olay akışı horizon sonrasını gerçekten kapsıyorsa negatif
label verilir.

## Train/Test Split

`model_ready` veri seti yalnızca 30/60/90 label'ları gözlenebilir olan
satırlardan oluşur. Split rastgele değildir; satırlar `referans_tarih` sırasına
göre ayrılır. İlk yaklaşık %80 train, kalan %20 test olarak işaretlenir.

## Çalıştırma

```bash
python scripts/10_build_training_snapshots.py
```

Üretilen çıktılar:

- `data/processed/training/inek_aylik_snapshot.csv`
- `data/processed/training/inek_aylik_snapshot_model_ready.csv`
- `data/processed/training/train_test_split.csv`
- `reports/training_feature_list.md`
- `reports/training_dataset_review.md`
