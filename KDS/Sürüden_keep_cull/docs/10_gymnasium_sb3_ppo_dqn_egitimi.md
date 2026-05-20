# 10 - Gymnasium + Stable-Baselines3 PPO/DQN Egitimi

Bu adim Faz 7.1 olarak eklenmistir. Onceki Faz 7, tabular/smoke benchmark ve
offline RL uygunluk audit'i uretiyordu. Bu dokuman ise gercek Gymnasium wrapper
ve Stable-Baselines3 PPO/DQN train/eval loop'unu tanimlar.

## Kapsam

- `CowReplacementGymEnv`
- Action space: `Discrete(2)`
  - `0 = keep`
  - `1 = cull`
- Observation space: dense `Box`
  - state numeric kolonlari
  - state bucket kategorilerinin one-hot encode edilmis hali
- Training algorithms:
  - PPO
  - DQN
- Evaluation:
  - deterministic policy evaluation
  - MDP value iteration policy ile state bazli karsilastirma

## Dosyalar

- `scripts/cow_replacement_gym_env.py`
- `scripts/36_train_sb3_ppo_dqn.py`
- `requirements-rl.txt`
- `data/processed/rl/sb3_training_results.csv`
- `data/processed/rl/sb3_policy_table.csv`
- `data/processed/rl/sb3_eval_episodes.csv`
- `reports/sb3_ppo_dqn_training_report.md`
- `Model/rl/sb3/`

## Kurulum

Bu paketler agir opsiyonel bagimlilik olarak ayrildi. Ana `requirements.txt`
icine konulmadi.

Linux CPU-only PyTorch icin tercih edilen kurulum:

```bash
python -m venv /tmp/laktasens-rl-venv
/tmp/laktasens-rl-venv/bin/python -m pip install --upgrade pip wheel
/tmp/laktasens-rl-venv/bin/python -m pip install -r requirements-rl.txt
```

Not: Normal PyPI `torch` kurulumu Linux'ta CUDA paketlerini de indirebilir ve cok
buyuk olabilir. `requirements-rl.txt` CPU-only PyTorch index'ini ve
`torch==2.12.0+cpu` pin'ini icerir.

## Calistirma

Faz 6 ciktisi guncel degilse once:

```bash
python scripts/31_build_mdp_reward_table.py
python scripts/32_solve_mdp_value_iteration.py
python scripts/33_analyze_mdp_policy_scenarios.py
```

Sonra:

```bash
/tmp/laktasens-rl-venv/bin/python scripts/36_train_sb3_ppo_dqn.py
```

Paketler eksikse script hata ile dusmez; `missing_dependency` raporu yazar.

## Yorumlama

Bu adim gercek PPO/DQN egitimi yapar, fakat policy yine de production-ready
sayilmaz. Sebep: egitim yapilan ortam empirical/prototype simulator'dur. Ana
referans hala model-based MDP value iteration sonucudur.

## Ilk Calisma Sonucu

CPU ortaminda ilk prototip egitim varsayilan olarak `5000` timestep PPO ve
`5000` timestep DQN calistirir. Ciktilar:

- PPO model: `Model/rl/sb3/ppo_cow_replacement.zip`
- DQN model: `Model/rl/sb3/dqn_cow_replacement.zip`
- PPO eval mean reward: yaklasik `-145.58`
- DQN eval mean reward: yaklasik `-401.86`

Bu sonuc ilk calisir train/eval loop dogrulamasidir. Daha uzun egitim icin
`config/rl_env_rules.yaml` altindaki `stable_baselines3.algorithms.*.total_timesteps`
degerleri artirilabilir.
