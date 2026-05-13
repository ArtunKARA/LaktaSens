# Raw Load Plan

Bu plan Faz 2.1 dry-run kararlarını gösterir. DB yükleyici aynı aday CSV'leri kullanır; `.env` yoksa yalnızca dosya üretimi geçerlidir.

## Source/Sheet Plan

| Source | Sheet | Row action | Raw tables | Event outputs | Required columns | Skip/reject rule |
|---|---|---|---|---|---|---|
| embryo_losses_mendeley | Hoja1 | load_all_rows_to_raw_repro_loss | raw_repro_loss | event_dogurma, event_dollenme, event_normalized | id |  |
| primiparous_social_env | Daily data | load_milk_measurements | raw_milk | event_sut_olcum, event_normalized | CowID, Date, Yield(gr) |  |
| primiparous_social_env | events | route_by_event_name | raw_repro_loss, raw_culling, raw_health | event_dogurma, event_dollenme, event_kuru, event_suruden_cikarma, event_normalized | CowID, Date, Event |  |
| primiparous_social_env | survival | skip_summary_sheet |  |  |  | Summary/survival sheet is not canonical event input in v1. |
| primiparous_social_env | service period | skip_summary_sheet |  |  |  | Service period summary lacks one event per row semantics for v1. |
| primiparous_social_env | calfweight | skip_summary_sheet |  |  |  | Calf weight is out of current cow keep/cull canonical event scope. |
| marcenat_inrae | Feuil1 | extract_clear_date_events | raw_culling | event_dogurma, event_kuru, event_suruden_cikarma, event_normalized | Animal ID |  |
| marcenat_inrae | all lactations | skip_summary_sheet |  |  |  | All-lactations file includes production/function summaries; clear row-level event semantics require manual review. |
| marcenat_inrae | JDD_DIB.csv | skip_no_event_date |  |  |  | Culling reason metadata lacks row-level event date; keep as TODO/payload reference. |
| chiozza_lameness | Hoja1 | extract_lameness_repro_cull_events | raw_health, raw_culling | event_dogurma, event_dollenme, event_kuru, event_health, event_suruden_cikarma, event_normalized | ID_ECLO_TAMBO_VACA |  |
| chiozza_lameness | Hoja2 | skip_empty_or_unreadable |  |  |  | No columns detected in inspection. |
| chiozza_lameness | Hoja3 | skip_empty_or_unreadable |  |  |  | No columns detected in inspection. |
| usda_nass_milk_price | Sheet1 | reward_candidate_only |  |  | Year, Period, Value | No animal-level canonical event; reviewed by reward candidate script. |
| usda_ers_milk_cost |  | reward_candidate_only |  |  | Year, Value | No animal-level canonical event; reviewed by reward candidate script. |

## Manual Inspection Sources

| Source | Reason |
|---|---|
| scc_grazing_cows | ZIP contains RAR; tabular schema cannot be inspected in this phase. |
| organic_scm | ZIP contains DOCX supplemental material; tabular schema cannot be inspected safely. |
| calving_afc_culling | ZIP contains PDF supplemental material; table extraction requires manual inspection. |
| usda_ams_cull_cow | PDF report; economic cull value extraction requires manual unit/date review. |
| iowa_state_heifer_cost | PDF report; heifer cost extraction requires manual unit/date review. |

## Reject Rules

- Required animal ID missing: row is rejected.
- Required event date missing: target event/raw row is rejected.
- Required numeric value missing for milk measurement: row is rejected.
- Unsupported archive/document/PDF schemas remain TODO/manual inspection required.
- Economic sources do not create animal-level raw/event rows in this phase.
