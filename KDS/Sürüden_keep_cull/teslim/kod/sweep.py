"""Hiperparametre duyarlılık taraması (Teslim Grafik-4).

Tabular Q-learning üzerinde ``epsilon_start`` × ``alpha`` ızgarası (>=2 param × >=3 değer),
her hücre >=5 seed. Keşif-sömürü (exploration-exploitation) yorumunun verisini üretir.

Çıktı: teslim/sonuclar/loglar/qlearning_sweep.csv
    (epsilon_start, alpha, seed, final_eval_return, cull_states)

Kullanım:
    python sweep.py --profile smoke
"""

from __future__ import annotations

import argparse
import time

import numpy as np
import pandas as pd

from rl_core import (
    LOG_DIR,
    PKG_ROOT,
    PROFILES,
    PROJECT_ROOT,
    ensure_log_dir,
    get_rules,
    greedy_eval,
    load_mdp,
    load_seeds,
    train_q_learning_seed,
)

# Izgara: 2 parametre × 3 değer (keşif başlangıcı ve öğrenme oranı)
EPSILON_START_GRID = [0.10, 0.35, 0.60]
ALPHA_GRID = [0.05, 0.18, 0.40]

SWEEP_PATH = LOG_DIR / "qlearning_sweep.csv"


def main() -> int:
    parser = argparse.ArgumentParser(description="Q-learning hiperparametre taraması")
    parser.add_argument("--profile", default="smoke", choices=sorted(PROFILES))
    parser.add_argument("--eval-episodes", type=int, default=200)
    args = parser.parse_args()

    ensure_log_dir()
    rules = get_rules()
    mdp = load_mdp(rules)
    seeds = load_seeds()
    base = dict(PROFILES[args.profile]["qlearning"])
    max_steps = int(base["max_steps"])

    rows: list[dict] = []
    started = time.time()
    total_cells = len(EPSILON_START_GRID) * len(ALPHA_GRID)
    print(f"Sweep: {total_cells} hücre × {len(seeds)} seed | profil={args.profile}")
    for eps0 in EPSILON_START_GRID:
        for alpha in ALPHA_GRID:
            for seed in seeds:
                cfg = dict(base)
                cfg["epsilon_start"] = eps0
                cfg["alpha"] = alpha
                # Sweep kendi final greedy_eval'ini yapar; eğitim içi checkpoint eval'ı
                # tek sefere indir (boşa hesaplama yok).
                cfg["eval_every"] = int(cfg["episodes"])
                cfg["eval_episodes"] = 5
                result = train_q_learning_seed(mdp, rules, seed, cfg)
                eval_rng = np.random.default_rng(seed + 333)
                ev = greedy_eval(mdp, result.actions, eval_rng, args.eval_episodes, max_steps)
                rows.append(
                    {
                        "epsilon_start": eps0,
                        "alpha": alpha,
                        "seed": seed,
                        "final_eval_return": float(ev.mean()),
                        "cull_states": int((result.actions == 1).sum()),
                    }
                )
            cell = pd.DataFrame([r for r in rows if r["epsilon_start"] == eps0 and r["alpha"] == alpha])
            print(f"  eps0={eps0:.2f} alpha={alpha:.2f} -> mean_eval={cell['final_eval_return'].mean():.1f}")

    df = pd.DataFrame(rows)
    df.to_csv(SWEEP_PATH, index=False)
    print(f"\nSüre: {time.time() - started:.1f}s")
    print(f"Yazıldı: {SWEEP_PATH.relative_to(PKG_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
