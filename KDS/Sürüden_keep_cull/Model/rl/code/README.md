# RL Experiment Code

Bu klasor RL deneylerini notebook veya terminal uzerinden tekrar calistirmak
icin hafif orchestration kodlarini tutar. Asil pipeline scriptleri `scripts/`
altinda kalir; bu katman parametre degistirme, sirali calistirma ve cikti
okuma isini kolaylastirir.

## Parametre Dosyasi

- `Model/rl/code/experiment_parameters.yaml`

Buradan su degerleri degistirebilirsin:

- MDP discount factor
- Tabular Q-learning episode sayisi
- Tabular PPO smoke iteration sayisi
- SB3 PPO/DQN timestep sayisi
- SB3 evaluation episode sayisi

## Terminalden Calistirma

```bash
cd KDS/Sürüden_keep_cull
python Model/rl/code/run_all_experiments.py --mode mdp
python Model/rl/code/run_all_experiments.py --mode compare
python Model/rl/code/run_all_experiments.py --mode sb3 --sb3-python /tmp/laktasens-rl-venv/bin/python
```

Tum pipeline:

```bash
python Model/rl/code/run_all_experiments.py --mode all
```

Hizli timestep override:

```bash
python Model/rl/code/run_all_experiments.py --mode sb3 \
  --sb3-python /tmp/laktasens-rl-venv/bin/python \
  --ppo-steps 10000 \
  --dqn-steps 10000 \
  --eval-episodes 200
```

## Notebook

Notebook runner:

- `notebooks/rl_experiment_runner.ipynb`

Notebook, bu klasordeki `experiment_runner.py` modülünü kullanir.
