# MDP Scenario Analysis Report

- Generated at: `2026-06-01T13:54:41`
- Scenario results: `data/processed/rl/mdp_scenario_results.csv`
- Policy comparison: `data/processed/rl/mdp_scenario_policy_comparison.csv`

## Scenario Summary

| Scenario | Description | Gamma | Keep states | Cull states | Cull rate | Changed vs baseline | Mean V |
|---|---|---:|---:|---:|---:|---:|---:|
| `baseline` | Base reward parameters from reward_baseline_us_2025.csv | 0.97 | 144 | 18 | 0.1111 | 0 | -550.68 |
| `high_cull_sale_value` | Cull sale value +20% | 0.97 | 135 | 27 | 0.1667 | 9 | -421.75 |
| `high_milk_price` | Milk price +20% | 0.97 | 162 | 0 | 0.0000 | 18 | 412.11 |
| `high_replacement_cost` | Replacement cost +20% | 0.97 | 150 | 12 | 0.0741 | 6 | -862.90 |
| `higher_discount` | Higher long-term value weight | 0.99 | 134 | 28 | 0.1728 | 10 | -683.85 |
| `low_cull_sale_value` | Cull sale value -20% | 0.97 | 155 | 7 | 0.0432 | 11 | -610.87 |
| `low_milk_price` | Milk price -20% | 0.97 | 84 | 78 | 0.4815 | 60 | -1149.43 |
| `low_replacement_cost` | Replacement cost -20% | 0.97 | 138 | 24 | 0.1481 | 6 | -195.97 |
| `lower_discount` | Lower long-term value weight | 0.90 | 162 | 0 | 0.0000 | 18 | -272.35 |

## Most Changed Scenarios

| Scenario | Changed states | Cull->Keep | Keep->Cull |
|---|---:|---:|---:|
| `high_cull_sale_value` | 9 | 0 | 9 |
| `high_milk_price` | 18 | 18 | 0 |
| `high_replacement_cost` | 6 | 6 | 0 |
| `higher_discount` | 10 | 0 | 10 |
| `low_cull_sale_value` | 11 | 11 | 0 |
| `low_milk_price` | 60 | 0 | 60 |
| `low_replacement_cost` | 6 | 0 | 6 |
| `lower_discount` | 18 | 18 | 0 |

## Notes

- Scenarios use the same empirical transition model; only reward parameters and discount factor change.
