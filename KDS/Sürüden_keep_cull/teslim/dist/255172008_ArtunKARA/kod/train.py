"""Çok-seed eğitim giriş noktası (teslim paketi).

Kullanım:
    python train.py --algos qlearning,dqn --profile smoke
    python train.py --algos qlearning --profile full

Her (algoritma, seed) için ham loglar ``teslim/sonuclar/loglar/`` altına yazılır:
    qlearning_train_seed<NN>.csv   (seed, episode, train_return, epsilon, steps)
    qlearning_eval_seed<NN>.csv    (seed, episode, eval_return_mean, eval_return_std, ...)
    qlearning_policy_seed<NN>.csv  (state_bucket_exact, action)
    dqn_train_seed<NN>.csv         (seed, episode, timestep, train_return)
    dqn_eval_seed<NN>.csv          (seed, timestep, eval_return_mean, eval_return_std, ...)
    dqn_loss_seed<NN>.csv          (seed, timestep, loss)
    dqn_policy_seed<NN>.csv        (state_bucket_exact, action)

Bu loglar, raporun tüm zorunlu grafiklerinin doğrulanabildiği kaynaktır (teslim kabul şartı).
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime

import pandas as pd

import rl_core
from rl_core import (
    LOG_DIR,
    PKG_ROOT,
    PROFILES,
    PROJECT_ROOT,
    ensure_log_dir,
    get_rules,
    load_mdp,
    load_seeds,
    train_dqn_seed,
    train_q_learning_seed,
)

ACTION_NAMES = {0: "keep", 1: "cull"}


def _save_policy(mdp, actions, path) -> None:
    pd.DataFrame(
        {
            "state_bucket_exact": mdp.states,
            "action": [int(a) for a in actions],
            "action_name": [ACTION_NAMES[int(a)] for a in actions],
        }
    ).to_csv(path, index=False)


def run_qlearning(mdp, rules, seeds, cfg) -> list[dict]:
    rows = []
    for seed in seeds:
        started = time.time()
        result = train_q_learning_seed(mdp, rules, seed, cfg)
        result.train_log.to_csv(LOG_DIR / f"qlearning_train_seed{seed}.csv", index=False)
        result.eval_log.to_csv(LOG_DIR / f"qlearning_eval_seed{seed}.csv", index=False)
        _save_policy(mdp, result.actions, LOG_DIR / f"qlearning_policy_seed{seed}.csv")
        final_eval = float(result.eval_log["eval_return_mean"].iloc[-1]) if not result.eval_log.empty else float("nan")
        cull_states = int((result.actions == 1).sum())
        elapsed = time.time() - started
        print(
            f"  [qlearning seed={seed}] episodes={cfg['episodes']} "
            f"final_eval_return={final_eval:.1f} cull_states={cull_states} ({elapsed:.1f}s)"
        )
        rows.append(
            {
                "algorithm": "qlearning",
                "seed": seed,
                "final_eval_return_mean": final_eval,
                "cull_states": cull_states,
                "elapsed_sec": round(elapsed, 2),
            }
        )
    return rows


def run_dqn(mdp, rules, seeds, cfg) -> list[dict]:
    rows = []
    for seed in seeds:
        started = time.time()
        result = train_dqn_seed(mdp, rules, seed, cfg)
        result.train_log.to_csv(LOG_DIR / f"dqn_train_seed{seed}.csv", index=False)
        result.eval_log.to_csv(LOG_DIR / f"dqn_eval_seed{seed}.csv", index=False)
        result.loss_log.to_csv(LOG_DIR / f"dqn_loss_seed{seed}.csv", index=False)
        _save_policy(mdp, result.actions, LOG_DIR / f"dqn_policy_seed{seed}.csv")
        final_eval = float(result.eval_log["eval_return_mean"].iloc[-1]) if not result.eval_log.empty else float("nan")
        cull_states = int((result.actions == 1).sum())
        elapsed = time.time() - started
        print(
            f"  [dqn seed={seed}] timesteps={cfg['total_timesteps']} "
            f"final_eval_return={final_eval:.1f} cull_states={cull_states} ({elapsed:.1f}s)"
        )
        rows.append(
            {
                "algorithm": "dqn",
                "seed": seed,
                "final_eval_return_mean": final_eval,
                "cull_states": cull_states,
                "elapsed_sec": round(elapsed, 2),
            }
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Çok-seed keep/cull RL eğitimi")
    parser.add_argument("--algos", default="qlearning,dqn", help="Virgülle ayrık: qlearning,dqn")
    parser.add_argument("--profile", default="smoke", choices=sorted(PROFILES), help="smoke | full")
    parser.add_argument("--seeds-file", default=str(rl_core.SEEDS_PATH))
    args = parser.parse_args()

    algos = [a.strip() for a in args.algos.split(",") if a.strip()]
    profile = PROFILES[args.profile]
    seeds = load_seeds(rl_core.Path(args.seeds_file))
    ensure_log_dir()
    rules = get_rules()
    mdp = load_mdp(rules)

    print(f"Profil: {args.profile} | Seedler: {seeds} | Algoritmalar: {algos}")
    print(f"MDP state sayısı: {len(mdp.states)} | gamma={mdp.gamma}")
    print(f"Loglar: {LOG_DIR.relative_to(PKG_ROOT)}")

    summary_rows: list[dict] = []
    started_all = time.time()
    if "qlearning" in algos:
        print("\n=== Tabular Q-Learning ===")
        summary_rows += run_qlearning(mdp, rules, seeds, profile["qlearning"])
    if "dqn" in algos:
        print("\n=== SB3 DQN ===")
        summary_rows += run_dqn(mdp, rules, seeds, profile["dqn"])

    summary = pd.DataFrame(summary_rows)
    summary_path = LOG_DIR / "_train_summary.csv"
    summary.to_csv(summary_path, index=False)

    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "profile": args.profile,
        "algos": algos,
        "seeds": seeds,
        "total_elapsed_sec": round(time.time() - started_all, 2),
        "n_states": len(mdp.states),
    }
    (LOG_DIR / "_train_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\nToplam süre: {manifest['total_elapsed_sec']}s")
    print(f"Özet: {summary_path.relative_to(PKG_ROOT)}")
    if not summary.empty:
        print(summary.to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
