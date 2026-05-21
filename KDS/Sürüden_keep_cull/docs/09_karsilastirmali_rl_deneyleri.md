# 09 - Karsilastirmali RL Deneyleri

Bu fazda Faz 6 model-based MDP cozumunu diger RL yaklasimlariyla
karsilastiriyoruz. Karsilastirma iki seviyeye ayrilir:

1. Veri uygunlugu audit'i
2. Empirical simulator uzerinde benchmark

Bu ayrim zorunludur. CQL/IQL/BCQ gibi offline RL algoritmalari gercek logged
action verisi ister. Mevcut transition dataset icindeki `agent_cull` satirlari
generated satirlardir; gercek tarihsel karar aksiyonu sayilmaz.

## Kapsam

Calistirilan/raporlanan yontemler:

- Model-based MDP value iteration
- Keep-all heuristic
- Cull-all-now heuristic
- Risk-threshold heuristic
- Milk-margin-threshold heuristic
- Random policy
- Tabular Q-learning simulator benchmark
- Tabular PPO-style smoke benchmark
- DQN-style fitted Q iteration with sklearn MLP
- Stable-Baselines3 PPO/DQN real train/eval loop Faz 7.1 olarak ayrica
  eklendi
- CQL/IQL/BCQ eligibility-only
- TD3/SAC not applicable

## Cikti Dosyalari

- `data/processed/rl/rl_algorithm_readiness.csv`
- `reports/rl_algorithm_readiness_report.md`
- `data/processed/rl/rl_algorithm_comparison_results.csv`
- `data/processed/rl/rl_algorithm_policy_table.csv`
- `reports/rl_algorithm_comparison_report.md`
- `reports/sb3_ppo_dqn_training_report.md`

## Calistirma Sirasi

```bash
python scripts/34_audit_rl_algorithm_readiness.py
python scripts/35_compare_rl_algorithms.py
```

Faz 6 MDP ciktisi guncel degilse once:

```bash
python scripts/31_build_mdp_reward_table.py
python scripts/32_solve_mdp_value_iteration.py
python scripts/33_analyze_mdp_policy_scenarios.py
```

## Sonuc Ozeti

Mevcut benchmark'ta referans cozum model-based MDP value iteration'dir. Baseline
MDP policy `144` keep ve `18` cull state uretir.

Karsilastirma sonucunda:

- `model_based_mdp_value_iteration` en yuksek mean initial value degerini verdi.
- `keep_all` ve DQN-style fitted Q ayni policy davranisini uretip MDP'nin `18`
  cull state'ini kacirdi.
- Tabular Q-learning ve PPO-style smoke test calisir, ancak simulator benchmark
  olarak yorumlanmalidir.
- Stable-Baselines3 PPO/DQN egitimi `docs/10_gymnasium_sb3_ppo_dqn_egitimi.md`
  altinda gercek Gymnasium wrapper ile calisir hale getirildi.
- CQL/IQL/BCQ calistirilmadi; gercek logged action yok.
- TD3/SAC calistirilmadi; aksiyon uzayi discrete keep/cull.

## Karar

Bu faz, "tum RL algoritmalari production-ready" sonucunu vermez. Dogru sonuc:
model-based MDP su an ana cozumdur; simulator RL benchmark'lari sanity check
olarak kullanilir; offline RL icin once gercek logged action/veri toplama
gereklidir.
