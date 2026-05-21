from __future__ import annotations

from datetime import datetime
from importlib.util import find_spec
from typing import Any

import numpy as np
import pandas as pd

from rl_experiment_utils import ACTION_CULL, ACTION_KEEP, load_tabular_mdp
from rl_mdp_utils import PROJECT_ROOT, path_from_root, read_rules


def dependencies_available() -> tuple[bool, list[str]]:
    missing = [name for name in ["gymnasium", "stable_baselines3", "torch"] if find_spec(name) is None]
    return not missing, missing


def optimal_actions(rules: dict[str, Any], mdp_states: list[str]) -> np.ndarray:
    policy_path = path_from_root(rules["output"]["optimal_policy_table_csv"])
    if not policy_path.exists():
        return np.zeros(len(mdp_states), dtype="int64")
    policy = pd.read_csv(policy_path, low_memory=False)
    action_by_state = dict(zip(policy["state_bucket_exact"].astype(str), policy["optimal_action"].astype(str)))
    return np.array([ACTION_CULL if action_by_state.get(state) == "cull" else ACTION_KEEP for state in mdp_states], dtype="int64")


def missing_dependency_outputs(rules: dict[str, Any], missing: list[str]) -> None:
    results_path = path_from_root(rules["output"]["sb3_training_results_csv"])
    policy_path = path_from_root(rules["output"]["sb3_policy_table_csv"])
    episodes_path = path_from_root(rules["output"]["sb3_eval_episodes_csv"])
    report_path = path_from_root(rules["output"]["sb3_training_report_md"])
    results_path.parent.mkdir(parents=True, exist_ok=True)
    reason = "Missing optional RL dependencies: " + ", ".join(missing)
    pd.DataFrame(
        [
            {
                "algorithm": "PPO",
                "run_status": "missing_dependency",
                "total_timesteps": 0,
                "eval_episodes": 0,
                "mean_total_reward": np.nan,
                "median_total_reward": np.nan,
                "mean_steps": np.nan,
                "policy_cull_state_rate": np.nan,
                "changed_states_vs_mdp_value_iteration": np.nan,
                "notes": reason,
            },
            {
                "algorithm": "DQN",
                "run_status": "missing_dependency",
                "total_timesteps": 0,
                "eval_episodes": 0,
                "mean_total_reward": np.nan,
                "median_total_reward": np.nan,
                "mean_steps": np.nan,
                "policy_cull_state_rate": np.nan,
                "changed_states_vs_mdp_value_iteration": np.nan,
                "notes": reason,
            },
        ]
    ).to_csv(results_path, index=False)
    pd.DataFrame().to_csv(policy_path, index=False)
    pd.DataFrame().to_csv(episodes_path, index=False)
    lines = [
        "# Stable-Baselines3 PPO/DQN Training Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Run status: `missing_dependency`",
        f"- Missing packages: `{', '.join(missing)}`",
        "",
        "## Required Install",
        "",
        "```bash",
        "python -m pip install -r requirements-rl.txt",
        "```",
        "",
        "## Notes",
        "",
        "- Gymnasium wrapper and training script are implemented.",
        "- Training is skipped in environments where optional RL dependencies are not installed.",
    ]
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"missing dependencies: {', '.join(missing)}")
    print(f"wrote {results_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {rules['output']['sb3_training_report_md']}")


def make_model(algorithm: str, env: Any, rules: dict[str, Any]) -> Any:
    from stable_baselines3 import DQN, PPO

    cfg = rules["stable_baselines3"]["algorithms"][algorithm]
    seed = int(rules["stable_baselines3"].get("random_seed", 42))
    net_arch = [int(value) for value in cfg.get("net_arch", [64, 64])]
    if algorithm == "PPO":
        return PPO(
            "MlpPolicy",
            env,
            seed=seed,
            gamma=float(rules["mdp"]["discount_factor"]),
            learning_rate=float(cfg.get("learning_rate", 3e-4)),
            n_steps=int(cfg.get("n_steps", 256)),
            batch_size=int(cfg.get("batch_size", 64)),
            n_epochs=int(cfg.get("n_epochs", 10)),
            ent_coef=float(cfg.get("ent_coef", 0.001)),
            policy_kwargs={"net_arch": net_arch},
            verbose=0,
        )
    if algorithm == "DQN":
        return DQN(
            "MlpPolicy",
            env,
            seed=seed,
            gamma=float(rules["mdp"]["discount_factor"]),
            learning_rate=float(cfg.get("learning_rate", 5e-4)),
            buffer_size=int(cfg.get("buffer_size", 20000)),
            learning_starts=int(cfg.get("learning_starts", 1000)),
            batch_size=int(cfg.get("batch_size", 64)),
            train_freq=int(cfg.get("train_freq", 4)),
            target_update_interval=int(cfg.get("target_update_interval", 500)),
            exploration_fraction=float(cfg.get("exploration_fraction", 0.25)),
            exploration_final_eps=float(cfg.get("exploration_final_eps", 0.05)),
            policy_kwargs={"net_arch": net_arch},
            verbose=0,
        )
    raise ValueError(f"Unsupported algorithm: {algorithm}")


def evaluate_model(model: Any, env: Any, algorithm: str, episodes: int) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for episode in range(episodes):
        observation, info = env.reset()
        total_reward = 0.0
        cull_actions = 0
        terminal_reason = ""
        steps = 0
        while True:
            action, _ = model.predict(observation, deterministic=True)
            action = int(action)
            observation, reward, terminated, truncated, info = env.step(action)
            total_reward += float(reward)
            cull_actions += int(action == ACTION_CULL)
            steps += 1
            terminal_reason = info.get("terminal_reason", "") or "non_terminal"
            if terminated or truncated:
                break
        rows.append(
            {
                "algorithm": algorithm,
                "episode": episode + 1,
                "total_reward": total_reward,
                "steps": steps,
                "cull_action_rate": cull_actions / max(steps, 1),
                "terminal_reason": terminal_reason,
            }
        )
    return pd.DataFrame(rows)


def policy_table_for_model(model: Any, env: Any, algorithm: str, mdp_states: list[str], mdp_actions: np.ndarray) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for state_idx, state in enumerate(mdp_states):
        observation = env.observation_for_state_idx(state_idx)
        action, _ = model.predict(observation, deterministic=True)
        action = int(action)
        rows.append(
            {
                "algorithm": algorithm,
                "state_bucket_exact": state,
                "selected_action": "cull" if action == ACTION_CULL else "keep",
                "optimal_action_mdp": "cull" if int(mdp_actions[state_idx]) == ACTION_CULL else "keep",
                "changed_vs_mdp": int(action != int(mdp_actions[state_idx])),
            }
        )
    return pd.DataFrame(rows)


def write_report(results: pd.DataFrame, rules: dict[str, Any]) -> None:
    report_path = path_from_root(rules["output"]["sb3_training_report_md"])
    lines = [
        "# Stable-Baselines3 PPO/DQN Training Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Results: `{rules['output']['sb3_training_results_csv']}`",
        f"- Policy table: `{rules['output']['sb3_policy_table_csv']}`",
        f"- Eval episodes: `{rules['output']['sb3_eval_episodes_csv']}`",
        "",
        "## Results",
        "",
        "| Algorithm | Status | Timesteps | Eval episodes | Mean reward | Median reward | Mean steps | Cull state rate | Changed vs MDP | Notes |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    for row in results.to_dict("records"):
        lines.append(
            f"| `{row['algorithm']}` | `{row['run_status']}` | {int(row['total_timesteps'])} | "
            f"{int(row['eval_episodes'])} | {float(row['mean_total_reward']):.2f} | "
            f"{float(row['median_total_reward']):.2f} | {float(row['mean_steps']):.2f} | "
            f"{float(row['policy_cull_state_rate']):.4f} | {int(row['changed_states_vs_mdp_value_iteration'])} | "
            f"{row['notes']} |"
        )
    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "- This is real Stable-Baselines3 training on the empirical Gymnasium simulator.",
            "- It is still not a production policy because the simulator itself is prototype empirical MDP data.",
            "- Compare against `model_based_mdp_value_iteration`; beating heuristics is useful, matching MDP is the sanity target.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    available, missing = dependencies_available()
    if not available:
        missing_dependency_outputs(rules, missing)
        return 0

    from cow_replacement_gym_env import CowReplacementGymEnv

    mdp = load_tabular_mdp(rules)
    mdp_actions = optimal_actions(rules, mdp.states)
    model_dir = path_from_root(rules["output"]["sb3_model_dir"])
    model_dir.mkdir(parents=True, exist_ok=True)
    eval_episodes = int(rules["stable_baselines3"].get("eval_episodes", 400))
    seed = int(rules["stable_baselines3"].get("random_seed", 42))

    results: list[dict[str, Any]] = []
    policy_frames: list[pd.DataFrame] = []
    episode_frames: list[pd.DataFrame] = []
    for algorithm, cfg in rules["stable_baselines3"]["algorithms"].items():
        if not cfg.get("enabled", False):
            continue
        env = CowReplacementGymEnv(mdp, rules, seed=seed)
        model = make_model(algorithm, env, rules)
        total_timesteps = int(cfg.get("total_timesteps", 30000))
        model.learn(total_timesteps=total_timesteps, progress_bar=False)
        model_path = model_dir / f"{algorithm.lower()}_cow_replacement.zip"
        model.save(model_path)

        eval_env = CowReplacementGymEnv(mdp, rules, seed=seed + 100)
        episodes = evaluate_model(model, eval_env, algorithm, eval_episodes)
        policy = policy_table_for_model(model, eval_env, algorithm, mdp.states, mdp_actions)
        policy_cull_rate = float(policy["selected_action"].eq("cull").mean())
        changed = int(policy["changed_vs_mdp"].sum())
        results.append(
            {
                "algorithm": algorithm,
                "run_status": "completed",
                "total_timesteps": total_timesteps,
                "eval_episodes": eval_episodes,
                "mean_total_reward": float(episodes["total_reward"].mean()),
                "median_total_reward": float(episodes["total_reward"].median()),
                "mean_steps": float(episodes["steps"].mean()),
                "policy_cull_state_rate": policy_cull_rate,
                "changed_states_vs_mdp_value_iteration": changed,
                "notes": f"Saved model: {model_path.relative_to(PROJECT_ROOT)}",
            }
        )
        policy_frames.append(policy)
        episode_frames.append(episodes)

    results_df = pd.DataFrame(results).sort_values("mean_total_reward", ascending=False)
    policy_df = pd.concat(policy_frames, ignore_index=True) if policy_frames else pd.DataFrame()
    episodes_df = pd.concat(episode_frames, ignore_index=True) if episode_frames else pd.DataFrame()

    results_path = path_from_root(rules["output"]["sb3_training_results_csv"])
    policy_path = path_from_root(rules["output"]["sb3_policy_table_csv"])
    episodes_path = path_from_root(rules["output"]["sb3_eval_episodes_csv"])
    results_path.parent.mkdir(parents=True, exist_ok=True)
    results_df.to_csv(results_path, index=False)
    policy_df.to_csv(policy_path, index=False)
    episodes_df.to_csv(episodes_path, index=False)
    write_report(results_df, rules)
    print(f"wrote {results_path.relative_to(PROJECT_ROOT)} ({len(results_df)} rows)")
    print(f"wrote {policy_path.relative_to(PROJECT_ROOT)} ({len(policy_df)} rows)")
    print(f"wrote {episodes_path.relative_to(PROJECT_ROOT)} ({len(episodes_df)} rows)")
    print(f"wrote {rules['output']['sb3_training_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
