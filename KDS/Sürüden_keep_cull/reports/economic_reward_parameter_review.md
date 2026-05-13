# Economic Reward Parameter Review

This report lists candidate economic values only. No value is approved for direct insertion into `feat_reward_parametre` until unit conversion and scenario policy are reviewed.

## Summary

- Total candidate rows: `1125`
- ERS candidate rows: `570`
- NASS candidate rows: `555`
- NASS rows with Excel date coercion: `0`

## Interpretation

- `usda_nass_milk_price` should feed `sut_fiyati`; the current file has clean numeric/string price values.
- `usda_ers_milk_cost` contains annual cost/revenue estimates by state and by operation size. The `Value` field is usually in dollars per hundredweight sold for cost rows, so conversion is required before deriving cow-day or cow-month costs.
- `MilkState2021base.csv` is the better first baseline file for a single national/state scenario. `MilkSize2021base.csv` is useful later for size-specific sensitivity analysis.

## Candidate Parameters

| Source | Candidate | Rows | Notes |
|---|---:|---:|---|
| `usda_ers_milk_cost` | `feed_costs_per_cwt` | `95` | manual unit conversion required |
| `usda_ers_milk_cost` | `milk_cows_reference` | `95` | manual unit conversion required |
| `usda_ers_milk_cost` | `operating_costs_per_cwt` | `95` | manual unit conversion required |
| `usda_ers_milk_cost` | `output_per_cow_reference` | `95` | manual unit conversion required |
| `usda_ers_milk_cost` | `sut_fiyati_reference_per_cwt` | `95` | manual unit conversion required |
| `usda_ers_milk_cost` | `total_costs_listed_per_cwt` | `95` | manual unit conversion required |
| `usda_nass_milk_price` | `sut_fiyati_per_cwt` | `555` | clean current file; still requires scenario/date convention review |
