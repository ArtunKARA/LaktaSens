# Culling Label Quality Audit

## Question

Could weak source-holdout learning be caused by not training enough?

Short answer: not primarily. The stronger issue is label observability. Some sources have no observed culling events, so treating their post-horizon rows as confirmed negatives creates a source shortcut.

## Culling Event Observability

| Source | Snapshot rows | Culling event rows | Observable for culling labels | 90d positives before correction |
|---|---:|---:|---|---:|
| `chiozza_lameness` | 90626 | 0 | no | 0 |
| `embryo_losses_mendeley` | 208547 | 0 | no | 0 |
| `marcenat_inrae` | 12390 | 998 | yes | 858 |
| `primiparous_social_env` | 1703 | 37 | yes | 102 |

## Correction

- Sources with at least one `event_suruden_cikarma` row are treated as culling-observable: `marcenat_inrae, primiparous_social_env`.
- Rows from sources without culling events are kept in the full corrected snapshot but their culling labels are set to unknown: `299173` rows.
- Corrected model-ready rows: `14070`.

This is conservative. It avoids converting missing culling capture into false negative labels.
