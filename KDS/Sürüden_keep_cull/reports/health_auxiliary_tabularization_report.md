# Health Auxiliary Tabularization Report

- Generated at: `2026-05-16T18:00:14`
- Scope: SCC grazing cows RAR, organic SCM DOCX, Chiozza lameness XLSX.

## Outputs

| Source | Status | Rows | File | Notes |
|---|---|---:|---|---|
| `scc_grazing_cows` | `tabularized` | 822797 | `data/processed/tabular_health_sources/scc_grazing_cows/milk_yield.csv` | Extracted from RAR inside SCC grazing cows ZIP. |
| `scc_grazing_cows` | `tabularized` | 802066 | `data/processed/tabular_health_sources/scc_grazing_cows/conception.csv` | Extracted from RAR inside SCC grazing cows ZIP. |
| `scc_grazing_cows` | `tabularized` | 918284 | `data/processed/tabular_health_sources/scc_grazing_cows/insemination_rate.csv` | Extracted from RAR inside SCC grazing cows ZIP. |
| `organic_scm` | `tabularized` | 7 | `data/processed/tabular_health_sources/organic_scm/organic_scm_table_1.csv` | Extracted from DOCX table. Aggregate farm-level supplemental table, not animal-level model input. |
| `chiozza_lameness` | `tabularized` | 8035 | `data/processed/tabular_health_sources/chiozza_lameness/chiozza_lameness_raw_hoja1.csv` | Raw Hoja1 converted from XLSX. |
| `chiozza_lameness` | `tabularized` | 8035 | `data/processed/tabular_health_sources/chiozza_lameness/chiozza_lameness_normalized.csv` | Normalized lameness/milk/reproduction summary. No culling labels available. |

## Modeling Decision

- SCC and Chiozza are useful health/SCC/lameness auxiliary sources, but they do not provide observed culling labels in the current pipeline.
- Organic SCM supplemental DOCX exposes aggregate farm-level descriptive statistics; it is not animal-level training data.
- These files are tabularized for schema review, feature design and future raw/event integration. They are not converted into negative culling labels.
