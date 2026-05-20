# 08 - Ana RL Cozumu: Model-Based MDP

Bu fazda `CowReplacementEnv` icin uretilen state bucket, reward ve empirical
transition ciktisi model-based MDP cozumune baglanir. Hedef production policy
degildir. Hedef, mevcut veri ve ekonomik varsayimlarla her ayrik state icin
`keep` veya `cull` aksiyonunun degerini hesaplayan ilk calisir politika
prototipini uretmektir.

## Kapsam

- Yontem: value iteration
- Zaman adimi: 1 ay
- State: `state_bucket_exact`
- Aksiyonlar:
  - `keep`
  - `cull`
- Terminal aksiyon: `cull`
- Discount factor baseline: `0.97`
- Transition: Faz 5'te uretilen empirical transition probability table
- Reward: Faz 5 reward sozlesmesindeki aylik gelir/maliyet bilesenleri

Policy iteration bu fazda zorunlu tutulmadi; plan `policy iteration veya value
iteration` oldugu icin ilk cozum value iteration ile kapatildi.

## Girdi Dosyalari

- `data/processed/rl/mdp_state_table.csv`
- `data/processed/rl/empirical_transition_model.csv`
- `data/processed/reward_baseline_us_2025.csv`
- `config/rl_env_rules.yaml`

## Reward Mantigi

`keep` aksiyonu icin immediate reward:

```text
milk_revenue_month
- maintenance_cost_month
- health_risk_cost_month
- reproduction_risk_cost_month
- expected_culling_risk_cost_month
```

`cull` aksiyonu icin immediate reward:

```text
cull_sale_value
- replacement_cost
- disposal_or_transaction_cost
```

Bu degerler prototip varsayimidir. `sut_fiyati`, `replacement_maliyeti`,
`cull_satis_degeri` ve benzeri parametreler kesin ciftlik ekonomisi gibi
yorumlanmamalidir. Senaryo analizi bu nedenle fazin zorunlu parcasidir.

## Transition Mantigi

`keep` aksiyonu icin gelecek deger empirical transition tablosundan hesaplanir.
Exact state destegi yetersizse fallback sirasi kullanilir:

1. `state_bucket_exact`
2. `state_bucket_no_risk`
3. `state_bucket_stage_parity`
4. `global`

`cull` aksiyonu terminaldir ve gelecek degeri `0` kabul edilir.

## Calistirma Sirasi

```bash
python scripts/28_build_mdp_transition_dataset.py
python scripts/29_build_empirical_transition_model.py
python scripts/31_build_mdp_reward_table.py
python scripts/32_solve_mdp_value_iteration.py
python scripts/33_analyze_mdp_policy_scenarios.py
```

Smoke-test policy simulasyonu da istenirse Faz 5 komutu tekrar calistirilabilir:

```bash
python scripts/30_simulate_cow_replacement_env.py
```

## Uretilen Ciktilar

- `data/processed/rl/mdp_reward_table.csv`
- `reports/mdp_reward_table_review.md`
- `data/processed/rl/mdp_value_iteration_result.csv`
- `data/processed/rl/optimal_policy_table.csv`
- `reports/mdp_policy_decision_report.md`
- `data/processed/rl/mdp_scenario_results.csv`
- `data/processed/rl/mdp_scenario_policy_comparison.csv`
- `reports/mdp_scenario_analysis_report.md`

## Ilk Sonuc Yorumu

Baseline ekonomide cozum `144` state icin `keep`, `18` state icin `cull`
onerdi. Senaryo analizinde sut fiyati dustugunde `cull` state sayisi artar;
sut fiyati yukseldiginde veya discount factor dustugunde baseline'daki cull
state'lerin bir kismi tekrar `keep` aksiyonuna doner. Bu sonuc MDP cekirdeginin
calistigini, fakat reward kalibrasyonunun karar davranisini dogrudan
belirledigini gosterir.

## Kabul Kriterleri

- MDP reward tablosu uretilir.
- Value iteration converge olur.
- Her state icin `q_keep`, `q_cull`, `state_value` ve `optimal_action` uretilir.
- Optimal policy tablosu ayrica disari yazilir.
- Milk price, replacement cost, cull sale value ve discount factor senaryolari
  baseline policy ile karsilastirilir.

## Sonraki Adim

Bir sonraki teknik adim, ciftlik/bolge ekonomisine gore reward parametrelerini
kalibre etmek ve policy sonucunu bu kalibrasyonla tekrar cozmek olmalidir. Daha
sonra policy iteration, learned transition model veya offline RL denemeleri
eklenebilir.
