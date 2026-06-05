# Smart Feed Synthetic Data Design Notes

Date: 2026-06-05

Purpose: define how synthetic/proxy values are generated for the missing Smart
Feed Project A and Project B fields after the real external loader has populated
`ml_smart_feed.raw_*` and `ml_smart_feed.opt_*` tables.

This file is a method document, not a real data source. Generated rows must stay
traceable with the source code `synthetic_smart_feed_v1` and should not be
presented as observed farm data.

## Sources Used

| Topic | Source | What was used |
|---|---|---|
| Dry matter intake (DMI) and lactating cow nutrition | NASEM 2021, NCBI Bookshelf, Dry Matter Intake: https://www.ncbi.nlm.nih.gov/books/NBK600610/ | DMI increases with milk yield; reference dataset mean values around 23 kg DMI, 32 kg milk, 643 kg BW. NASEM also provides animal/diet factor equations, but full diet variables are not available in our raw data. |
| Practical DMI and ration rules | University of Minnesota Extension, Formulating dairy cow rations: https://extension.umn.edu/dairy-milking-cows/formulating-dairy-cow-rations | DMI lookup by milk yield/body weight; early lactation DMI reduction; NDF, CP, fat, Ca, P guideline ranges by stage. |
| BCS target and biological interpretation | University of Wisconsin Extension, Body Condition Score in Dairy Cattle: https://dairy.extension.wisc.edu/articles/body-condition-score-in-dairy-cattle/ | 1-5 BCS scale; target stage-specific BCS supports energy balance and disease resistance. |
| Milk fat/protein/lactose defaults | NCBI Bookshelf, Factors Affecting the Composition of Milk from Dairy Cows: https://www.ncbi.nlm.nih.gov/books/NBK218193/ | National average milk composition near 3.6% fat, 3.2% protein, 4.7% lactose; milk component percentages vary by breed, diet, health, environment, and lactation stage. |
| Rumination proxy | University of Minnesota Extension, The ruminant digestive system: https://extension.umn.edu/dairy-nutrition/ruminant-digestive-system | Cows can spend 35-40% of each day ruminating; diet affects rumination time. |
| Lying/resting time proxy | Michigan State University Extension, Time management for dairy cows: https://www.canr.msu.edu/news/time_management_for_dairy_cows | Typical lactating cow daily time budget includes 12-14 hours lying/resting. |
| Heat stress and body temperature | University of Minnesota Extension, Heat stress in dairy cattle: https://extension.umn.edu/dairy-milking-cows/heat-stress-dairy-cattle | Adult cow normal body temperature is about 101.5-102.5 F; THI/body temperature context is useful for heat stress and milk production impact. |
| Water intake proxy | NASEM 2021, NCBI Bookshelf, Water: https://www.ncbi.nlm.nih.gov/books/NBK600589/ | Water is the highest-volume nutrient; intake is affected by DMI, diet dry matter, temperature, and milk yield. |
| Ketosis/metabolic risk context | Cornell AHDC clinical pathology panels and UW Extension ketosis notes: https://www.vet.cornell.edu/animal-health-diagnostic-center/veterinary-resources/testing-guidelines/clinical-pathology-panels-and-guidelines and https://dairy.extension.wisc.edu/articles/the-fresh-cow-ketosis/ | BHB/NEFA are transition cow energy markers; ketosis risk is tied to energy balance, high production, early lactation, and body condition. |

## Inference Method

The loaded real data gives a short cow-day backbone:

- cow id
- milk yield
- DIM
- body temperature for 10 of 16 cows
- barn THI and temperature
- raw health history
- feed nutrient references and a small set of feed prices

The missing fields are filled with rule-based synthetic/proxy values. The rules
are deliberately simple and bounded. They are not meant to create publishable
biological truth; they create a complete POC state/action/reward table that can
be replaced by real farm data later.

### Project A Synthetic Rules

| Field | Rule | Reasoning from sources |
|---|---|---|
| `breed` | `Holstein` for MmCows cow ids | MmCows is used as the cow-day dairy backbone; Holstein-like defaults are common in NASEM/extension examples. |
| `parity` | deterministic cow-id based 1-3 | Parity is missing; a deterministic spread avoids all cows being identical. |
| `body_weight_kg` | roughly 610-745 kg by parity and cow id | NASEM DMI examples include mature Holstein BW around 643 kg; parity is used as a proxy for maturity. |
| `bcs` | stage-based 2.7-3.4 | BCS target is biologically tied to energy balance; stage-based values avoid extreme 1 or 5 scores. |
| `pregnancy_status` | `pregnant` when raw DIM is high enough, otherwise `open` | Late lactation cows are more likely to be pregnant; this is only a planning proxy. |
| `lactation_stage` | DIM <=21 transition, <=100 early, <=200 mid, else late | Standard dairy stage simplification for POC. Very high raw DIM is capped to 305 for model features but kept traceable through raw data. |
| milk fat/protein/lactose | centered near 3.6 fat, 3.2 protein, 4.7 lactose with small stage/yield adjustments | NCBI milk composition defaults and known yield-component inverse relationship. |
| SCC/conductivity | low baseline with deterministic variation; elevated when milk drop/heat proxy is present | Used only as a synthetic mastitis signal placeholder; real SCC/EC data should replace it. |
| estimated DMI | bounded function of milk yield and BW | NASEM/UMN indicate DMI is driven by milk yield and body weight; full NASEM diet equation cannot be used because diet NDF/fNDFD are missing. |
| rumination | 35-40% day target, reduced by heat stress/high energy demand | UMN ruminant digestion source supports 35-40% of day; heat and diet are noted modifiers. |
| lying time | 12-14 hours/day target, reduced by heat stress | MSU time budget gives 12-14 hours. |
| water intake | function of DMI, milk yield, and temperature | NASEM water chapter supports DMI, diet DM, temperature, and production as drivers. |
| health labels | proxy labels from energy deficit, fat:protein ratio, SCC/EC, body temp, THI | Real clinical diagnoses are not aligned to the milk window, so labels must be marked synthetic/proxy. |

### Project B Synthetic Rules

| Field | Rule | Reasoning from sources |
|---|---|---|
| missing NEL | generated as category/nutrient proxy on a new effective date | Real NEL is missing for all loaded nutrient rows; optimizer requires an energy value. |
| missing feed prices | category proxy from current grain prices; real-priced feeds are carried forward | Only barley/corn/wheat have prices. Forage/mineral/other prices need POC proxies. |
| ration constraints | stage and need-class CP/NDF/starch/fat/Ca/P/DMI/NEL seed rows | UMN ration guidelines provide practical CP/NDF/fat/mineral ranges; NEL is a conservative proxy. |
| reward parameters | TRY penalties for ketosis/mastitis/asidosis/energy deficit/ration change | Needed to make the reward function executable. Values are scenario placeholders. |
| ration candidates | deterministic demo ration for each Project A prediction | Not an optimizer result; it is a feasible seed/action table so the UI/model pipeline can run. |
| sim states/transitions | one state per cow-day and next-day transition where available | Allows MDP/RL plumbing to be tested without claiming logged action-outcome evidence. |

## Guardrails

1. Do not overwrite raw observed data with synthetic values.
2. Use `synthetic_smart_feed_v1` as `kaynak_kod`.
3. Use a separate effective date for synthetic nutrient/price proxy rows.
4. Keep rule version strings in `aciklama`, `rule_version`, `feature_json`, or
   `explanation_json`.
5. Treat generated labels as proxy labels, not clinical ground truth.
6. Re-run scripts only after the external loader has completed.
7. Replace synthetic values when real BCS, parity, DMI, ration, SCC, milk
   components, rumination, lying, water, and action logs become available.

