# RL Experiment Code

Bu klasor RL deneylerini notebook veya terminal uzerinden tekrar calistirmak
icin model kodlarini ve hafif orchestration katmanini tutar. Bu klasorde
`--mode model` ile calisan modeller artik `scripts/` dosyalarina paslamaz;
egitim/cozum mantigi dogrudan `models/*.py` icindedir.

## Yapi

- `training_environment.py`: tek merkezi egitim ortami. Path, config, cikti
  okuma ve Gymnasium uyumlu `CowReplacementGymEnv` burada durur.
- `models/`: egitilebilir/cozulur model kodlari. Her model kendi `run()`
  fonksiyonunu ve algoritma mantigini dogrudan icerir.
- `models/common.py`: model dosyalari arasinda paylasilan MDP/veri yardimcilari.
- `model_registry.py`: model listesini ve tek model calistirma fonksiyonunu
  saglar.
- `experiment_runner.py`: CLI ve notebook tarafindan kullanilan runner.
- `experiment_parameters.yaml`: notebook/CLI parametre dosyasi.

## Model Tanim Dosyalari

Model kodlari ailelere gore klasorlendi:

- `models/model_based/mdp_value_iteration.py`
- `models/tabular/q_learning.py`
- `models/tabular/ppo_smoke.py`
- `models/approximate/dqn_style_fqi.py`
- `models/stable_baselines/ppo.py`
- `models/stable_baselines/dqn.py`
- `models/stable_baselines/ppo_dqn.py`
- `models/offline/placeholders.py`

Eski ust seviye dosyalar (`models/sb3_ppo.py` gibi) compatibility wrapper
olarak kalir; yeni kod eklerken aile klasorlerinin altina eklemek tercih edilir.

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

Model listesini gormek:

```bash
python Model/rl/code/run_all_experiments.py --mode list-models
```

Tek model calistirmak:

```bash
python Model/rl/code/run_all_experiments.py --mode model --model mdp_value_iteration
python Model/rl/code/run_all_experiments.py --mode model --model sb3_ppo --sb3-python /tmp/laktasens-rl-venv/bin/python
python Model/rl/code/run_all_experiments.py --mode model --model sb3_dqn --sb3-python /tmp/laktasens-rl-venv/bin/python
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

Notebook, bu klasordeki `experiment_runner.py` ve `model_registry.py`
modullerini kullanir. Yeni model eklemek icin uygun aile klasorunde yeni bir
dosya olusturup `definition()` fonksiyonunu `model_registry.py` icine eklemek
yeterli.
