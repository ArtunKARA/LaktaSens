# Reward Baseline US 2025 Review

- DB scenario: `baseline_us_2025_mixed_source_v1`
- Validity: `2025-01-01` to `2025-12-31`
- This is a prototype baseline, not a production financial recommendation.
- Source-derived values are separated from synthetic assumptions below.

## DB Parameters

| Parametre | Deger | Birim | Kaynak durumu |
|---|---:|---|---|
| `sut_fiyati` | 0.4668 | USD/kg | NASS source-derived |
| `gunluk_bakim_maliyeti` | 8.5337 | USD/cow/day | ERS source-derived |
| `replacement_maliyeti` | 2500.00 | USD/head | synthetic assumption |
| `cull_satis_degeri` | 1200.00 | USD/head | synthetic assumption |
| `tedavi_maliyeti` | 150.00 | USD/event | synthetic assumption |
| `basarisiz_tohumlama_maliyeti` | 35.00 | USD/service | synthetic assumption |
| `dusuk_verim_cezasi` | 2.33 | USD/day | NASS price + synthetic 5 kg/day gap |

## Source-Derived Calculations

- NASS file: `data/external/usda_nass_milk_price/USDA NASS.xlsx`
- NASS 2025 US TOTAL monthly row count: `12`
- NASS average milk price: `21.175` USD/cwt
- Conversion: `1 cwt = 45.359237` kg
- Milk price inserted: `0.4668` USD/kg

- ERS file: `data/external/usda_ers_milk_cost/MilkState2021base.csv`
- ERS output per cow: `22653.00` lb/year = `226.53` cwt/year
- ERS operating cost: `13.75` USD/cwt
- Operating daily cost inserted: `8.5337` USD/cow/day
- Reference total costs listed: `14.5041` USD/cow/day
- Reference feed cost: `6.0946` USD/cow/day

## Remaining Manual Review

- USDA AMS cull-cow PDFs still need a market-class parser before they can replace `cull_satis_degeri`.
- Iowa State heifer PDF still needs manual table extraction before it can replace `replacement_maliyeti`.
- Treatment and insemination costs are farm protocol parameters; they are intentionally synthetic in this prototype.
