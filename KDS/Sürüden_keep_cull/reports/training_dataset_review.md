# Training Dataset Review

## Summary

- Animals with observed events: `14624`
- Snapshot rows: `313266`
- Model-ready rows: `271550`
- Snapshot date range: `1999-11-30` - `2020-04-30`
- Model-ready date range: `1999-11-30` - `2020-01-31`
- Split cutoff date: `2016-09-30`

## Label Distribution

| Label | 0 | 1 | null |
|---|---:|---:|---:|
| cull_within_30d | 298836 | 321 | 14109 |
| cull_within_60d | 284431 | 643 | 28192 |
| cull_within_90d | 270590 | 960 | 41716 |

## Source Distribution

| Source | Snapshot rows | Model-ready rows |
|---|---:|---:|
| chiozza_lameness | 90626 | 75554 |
| embryo_losses_mendeley | 208547 | 181926 |
| marcenat_inrae | 12390 | 12376 |
| primiparous_social_env | 1703 | 1694 |

## Train/Test Split

| Split | Rows |
|---|---:|
| train | 214406 |
| test | 57144 |

## Notes

- `model_ready` excludes rows where any 30/60/90 day label is unknown.
- Negative labels are assigned only when the animal is observed through the horizon end.
- `yas_gun` is null in dry-run because current candidate events do not provide a reliable cow birth date.
