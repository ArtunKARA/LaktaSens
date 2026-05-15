# Culling Reason Enrichment Report

- Generated at: `2026-05-15T10:56:15`
- Purpose: classify observed culling causes for audit and stratified model evaluation.
- Leakage rule: culling reason is not added to predictive model feature lists because it is known at/after culling.

## Label Coverage

- Reason label rows: `222`
- Unique animals with reason labels: `222`

| Source | Labels | Unique animals | Mean confidence |
|---|---:|---:|---:|
| `marcenat_inrae` | 185 | 185 | 0.95 |
| `primiparous_social_env` | 37 | 37 | 0.30 |

## Reason Distribution

| Group | Count |
|---|---:|
| `reproductive` | 109 |
| `health` | 49 |
| `unknown` | 37 |
| `economic` | 27 |

## Primary Reason Top Values

| Primary reason | Count |
|---|---:|
| `Empty` | 84 |
| `unknown` | 37 |
| `Mastitis` | 19 |
| `Lameness` | 17 |
| `Herd renewal` | 16 |
| `Late calving` | 11 |
| `Poor health` | 10 |
| `Poor production performance` | 6 |
| `Abortion` | 6 |
| `Health` | 4 |
| `Old` | 3 |
| `Accidental reason` | 3 |
| `Intestinal occlusion` | 2 |
| `Calving trouble` | 2 |
| `Econo` | 2 |

## 90-Day Positive Snapshot Reason Mix

- Positive 90-day snapshot rows: `960`

| Reason group | Positive snapshot rows |
|---|---:|
| `unknown` | 413 |
| `reproductive` | 322 |
| `health` | 145 |
| `economic` | 80 |

## Decision

- Marcenat reason labels are high-confidence audit labels.
- Primiparous exit status is kept as low-confidence because it does not encode true cause.
- Use this file for error analysis, stratified metrics and future reward design. Do not train culling risk models with reason columns.
