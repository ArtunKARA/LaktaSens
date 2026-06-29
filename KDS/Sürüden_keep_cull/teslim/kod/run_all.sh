#!/usr/bin/env bash
# Uçtan uca teslim üretimi: eğitim -> hiperparametre taraması -> değerlendirme -> grafikler.
# Kullanım:
#   bash run_all.sh            # full profil (asıl teslim koşusu)
#   bash run_all.sh smoke      # hızlı sanity (dakikalar)
set -euo pipefail
cd "$(dirname "$0")"

PROFILE="${1:-full}"
EVAL_EPISODES="${2:-500}"

echo "=== [1/4] Çok-seed eğitim (qlearning + dqn) | profil=$PROFILE ==="
python train.py --algos qlearning,dqn --profile "$PROFILE"

echo "=== [2/4] Hiperparametre taraması (epsilon_start x alpha) ==="
python sweep.py --profile "$PROFILE"

echo "=== [3/4] Değerlendirme + sonuclar.csv (${EVAL_EPISODES} episode/seed) ==="
python evaluate.py --eval-episodes "$EVAL_EPISODES"

echo "=== [4/4] 5 standart grafik + yorumlar ==="
python plotting.py

echo "=== Tamamlandı. Çıktılar: ../sonuclar/ ve ../sunum/grafikler/ ==="
