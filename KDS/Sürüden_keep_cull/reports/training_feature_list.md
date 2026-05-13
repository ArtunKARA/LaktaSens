# Training Feature List

| Feature | Type | Window | Source rule | Leakage guard |
|---|---|---|---|---|
| `laktasyon_no` | integer | point-in-time | latest calving laktasyon no | only calving <= referans_tarih |
| `parite` | integer | point-in-time | latest calving parity | only calving <= referans_tarih |
| `dim` | integer | point-in-time | days since latest calving | only calving <= referans_tarih |
| `yas_gun` | integer/null | point-in-time | reliable cow birth date only | null when no reliable cow DOB exists |
| `gebe_mi` | boolean/null | point-in-time | latest positive pregnancy diagnosis minus later calving/loss | only events <= referans_tarih |
| `servis_sayisi` | integer/null | since latest calving | insemination count after latest calving | only services <= referans_tarih |
| `son_servis_gun` | integer/null | point-in-time | days since latest service | only services <= referans_tarih |
| `gebelik_kaybi_flag` | boolean | trailing 365d | pregnancy_loss exists | window ends at referans_tarih |
| `son30_saglik_olay_sayisi` | integer | trailing 30d | event_health count | window ends at referans_tarih |
| `mastitis_flag` | boolean | trailing 30d | mastitis health text | window ends at referans_tarih |
| `lameness_flag` | boolean | trailing 30d | lameness health text | window ends at referans_tarih |
| `son30_ortalama_sut` | float/null | trailing 30d | average milk kg | window ends at referans_tarih |
| `sut_trend_7g` | float/null | last 7d vs previous 7d | avg(last 7d) - avg(previous 7d) | both windows end before/at referans_tarih |

Labels: `cull_within_30d`, `cull_within_60d`, `cull_within_90d` are positive only when culling occurs after `referans_tarih` and inside the horizon.
