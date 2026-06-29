# Keep/Cull RL — Teslim Kodu (255172008_ArtunKARA)

Süt sığırcılığında inek bazlı **elde tutma (keep) / sürüden çıkarma (cull)** kararları için
empirik stokastik MDP ortamı üzerinde pekiştirmeli öğrenme.

Ana ajanlar: **Tabular Q-Learning** (off-policy) ve **SB3 DQN** (off-policy, replay buffer).
Referans: **MDP value iteration** (model-tabanlı optimum). Baselinelar: random / keep_all /
cull_all / risk_threshold.

## Kurulum
```bash
pip install torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

## Tek komutla üretim
```bash
bash run_all.sh full      # asıl teslim koşusu (>=5 seed, 100k DQN timestep)
bash run_all.sh smoke     # hızlı sanity (dakikalar)
```

## Tek tek çalıştırma
```bash
python train.py    --algos qlearning,dqn --profile full   # eğitim + ham loglar
python sweep.py    --profile full                          # hiperparametre taraması (Grafik 4)
python evaluate.py --eval-episodes 500                     # sonuclar.csv (seed x metrik)
python plotting.py                                         # 5 standart grafik + yorumlar
```

## Seedler
`seeds.txt` — `42, 123, 2024, 7, 99` (>=5 seed). Tüm eğitim/değerlendirme bu seedlerde tekrarlanır;
grafiklerde ortalama ± std bandı bu seedlerden gelir.

## Çıktılar
- `../sonuclar/loglar/` — her (algoritma, seed) için **ham CSV log** (eğitim/eval/loss).
  Raporun tüm grafikleri bu loglardan doğrulanabilir (teslim kabul şartı).
- `../sonuclar/sonuclar.csv` — seed × metrik özeti (+ `sonuclar_agg.csv` ortalama±std).
- `../sunum/grafikler/01..05_*.png` — 5 zorunlu standart grafik + `yorumlar.md`.

## Dosyalar
| Dosya | Görev |
|---|---|
| `rl_core.py` | Çok-seed eğitim/eval çekirdeği, baseline politikalar, ham log şeması |
| `train.py` | Q-learning + DQN çok-seed eğitim, ham log üretimi |
| `sweep.py` | epsilon_start × alpha duyarlılık taraması |
| `evaluate.py` | Deterministic/greedy değerlendirme, `sonuclar.csv` |
| `plotting.py` | 5 standart grafik (başlık/birim/lejant/seed/MA/std bandı) |
| `config.yaml` | Ortam, ödül ve algoritma parametreleri (`rl_env_rules.yaml` kopyası) |
| `seeds.txt` | >=5 seed |

## Notlar
- Yasak kontrolü: `import gym` YOK (gymnasium); `np.random.seed`/`np.random.choice` YOK (`np.random.default_rng`).
- Öğrenme/eval eğrilerinde y-ekseni **episode getirisi** (anlık/per-step ödül değil).
- Ortam **stokastik**: `keep` aksiyonu empirik `p(s'|s,a)` dağılımından örneklenir
  (bkz. `cow_replacement_gym_env.py::_sample_keep_next_state`).
