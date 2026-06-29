"""Değerlendirme + seed × metrik özeti (teslim paketi).

``train.py`` çıktısı politikaları (qlearning/dqn) ve baselineları aynı
deterministic/greedy protokolle değerlendirir, ``teslim/sonuclar/sonuclar.csv``
dosyasını üretir.

    sonuclar.csv satırları:
      - (algorithm, seed) bazlı final metrikler
      - (algorithm, "AGG") satırları: seedler arası ortalama ± std

Kullanım:
    python evaluate.py --eval-episodes 500
"""

from __future__ import annotations

import argparse
from datetime import datetime

import numpy as np
import pandas as pd

import rl_core
from rl_core import (
    ACTION_CULL,
    ACTION_KEEP,
    LOG_DIR,
    PKG_ROOT,
    PROJECT_ROOT,
    baseline_policy_fns,
    eval_policy_returns,
    fixed_action_policy,
    get_rules,
    load_mdp,
    load_seeds,
)

SONUCLAR_PATH = PKG_ROOT / "sonuclar" / "sonuclar.csv"


def _actions_from_policy_csv(path, mdp) -> np.ndarray | None:
    if not path.exists():
        return None
    df = pd.read_csv(path)
    action_by_state = dict(zip(df["state_bucket_exact"].astype(str), df["action"].astype(int)))
    return np.array([int(action_by_state.get(str(s), ACTION_KEEP)) for s in mdp.states], dtype="int64")


def _mdp_optimal_actions(mdp, rules) -> np.ndarray | None:
    policy_path = rl_core.PROJECT_ROOT / rules["output"]["optimal_policy_table_csv"]
    if not policy_path.exists():
        return None
    df = pd.read_csv(policy_path, low_memory=False)
    action_by_state = dict(zip(df["state_bucket_exact"].astype(str), df["optimal_action"].astype(str)))
    return np.array(
        [ACTION_CULL if action_by_state.get(str(s)) == "cull" else ACTION_KEEP for s in mdp.states], dtype="int64"
    )


def evaluate_all(eval_episodes: int) -> pd.DataFrame:
    rules = get_rules()
    mdp = load_mdp(rules)
    seeds = load_seeds()
    max_steps = int(rules["stable_baselines3"].get("max_episode_steps", 60))
    baselines = baseline_policy_fns(mdp, rules)
    mdp_actions = _mdp_optimal_actions(mdp, rules)

    rows: list[dict] = []
    for seed in seeds:
        eval_rng = np.random.default_rng(seed + 777)  # eğitimden bağımsız değerlendirme rastgeleliği

        # Eğitilmiş ajanlar
        for algo in ["qlearning", "dqn"]:
            actions = _actions_from_policy_csv(LOG_DIR / f"{algo}_policy_seed{seed}.csv", mdp)
            if actions is None:
                continue
            metrics = eval_policy_returns(mdp, fixed_action_policy(actions), eval_rng, eval_episodes, max_steps)
            rows.append(
                {
                    "algorithm": algo,
                    "kind": "agent",
                    "seed": seed,
                    "cull_states": int((actions == ACTION_CULL).sum()),
                    **metrics,
                }
            )

        # Baselinelar (eğitimsiz kıyas, Grafik-5)
        for name, policy_fn in baselines.items():
            metrics = eval_policy_returns(mdp, policy_fn, eval_rng, eval_episodes, max_steps)
            rows.append({"algorithm": name, "kind": "baseline", "seed": seed, "cull_states": np.nan, **metrics})

        # MDP value-iteration optimum (referans; politikası seedden bağımsız ama eval stokastik)
        if mdp_actions is not None:
            metrics = eval_policy_returns(mdp, fixed_action_policy(mdp_actions), eval_rng, eval_episodes, max_steps)
            rows.append(
                {
                    "algorithm": "mdp_value_iteration",
                    "kind": "reference",
                    "seed": seed,
                    "cull_states": int((mdp_actions == ACTION_CULL).sum()),
                    **metrics,
                }
            )

    per_seed = pd.DataFrame(rows)

    # Seedler arası agregat (mean ± std) — teslim isterindeki "seed × metrik özeti"
    agg_metric_cols = ["eval_return_mean", "eval_return_median", "mean_steps", "cull_episode_rate", "cull_states"]
    agg_frames = []
    for (algo, kind), grp in per_seed.groupby(["algorithm", "kind"]):
        agg_row = {"algorithm": algo, "kind": kind, "seed": "AGG", "eval_episodes": int(grp["eval_episodes"].iloc[0])}
        for col in agg_metric_cols:
            agg_row[f"{col}_mean"] = float(pd.to_numeric(grp[col], errors="coerce").mean())
            agg_row[f"{col}_std"] = float(pd.to_numeric(grp[col], errors="coerce").std(ddof=0))
        agg_row["n_seeds"] = int(grp["seed"].nunique())
        agg_frames.append(agg_row)
    agg = pd.DataFrame(agg_frames)

    return per_seed, agg


def main() -> int:
    parser = argparse.ArgumentParser(description="Politika değerlendirme + sonuclar.csv")
    parser.add_argument("--eval-episodes", type=int, default=500)
    args = parser.parse_args()

    per_seed, agg = evaluate_all(args.eval_episodes)

    SONUCLAR_PATH.parent.mkdir(parents=True, exist_ok=True)
    per_seed.to_csv(SONUCLAR_PATH, index=False)
    agg_path = SONUCLAR_PATH.parent / "sonuclar_agg.csv"
    agg.to_csv(agg_path, index=False)

    print(f"Değerlendirme tamam ({args.eval_episodes} episode/seed).")
    print(f"Yazıldı: {SONUCLAR_PATH.relative_to(PKG_ROOT)}")
    print(f"Yazıldı: {agg_path.relative_to(PKG_ROOT)}")
    print("\n=== Seedler arası ortalama getiri (yüksek = iyi) ===")
    show = agg.sort_values("eval_return_mean_mean", ascending=False)[
        ["algorithm", "kind", "eval_return_mean_mean", "eval_return_mean_std", "cull_episode_rate_mean", "n_seeds"]
    ]
    print(show.to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
