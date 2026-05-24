from __future__ import annotations

from datetime import datetime
from importlib.util import find_spec
from typing import Any

import numpy as np
import pandas as pd

from models.base import ModelRunSpec
from models.common import ACTION_CULL, direct_result, load_tabular_mdp, optimal_actions_from_policy, project_path
from training_environment import CommandResult, CowReplacementGymEnv, RLTrainingEnvironment


ALGORITHM = "DQN"


def dependencies_available() -> tuple[bool, list[str]]:
    missing = [name for name in ["gymnasium", "stable_baselines3", "torch"] if find_spec(name) is None]
    return not missing, missing


def make_dqn_model(train_env: Any, rules: dict[str, Any]) -> Any:
    from stable_baselines3 import DQN

    cfg = rules["stable_baselines3"]["algorithms"][ALGORITHM]
    return DQN(
        "MlpPolicy",
        train_env,
        seed=int(rules["stable_baselines3"].get("random_seed", 42)),
        gamma=float(rules["mdp"]["discount_factor"]),
        learning_rate=float(cfg.get("learning_rate", 5e-4)),
        buffer_size=int(cfg.get("buffer_size", 20000)),
        learning_starts=int(cfg.get("learning_starts", 1000)),
        batch_size=int(cfg.get("batch_size", 64)),
        train_freq=int(cfg.get("train_freq", 4)),
        target_update_interval=int(cfg.get("target_update_interval", 500)),
        exploration_fraction=float(cfg.get("exploration_fraction", 0.25)),
        exploration_final_eps=float(cfg.get("exploration_final_eps", 0.05)),
        policy_kwargs={"net_arch": [int(value) for value in cfg.get("net_arch", [64, 64])]},
        verbose=0,
    )


def evaluate_model(model: Any, eval_env: CowReplacementGymEnv, episodes: int) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for episode in range(episodes):
        observation, info = eval_env.reset()
        total_reward = 0.0
        cull_actions = 0
        terminal_reason = ""
        steps = 0
        while True:
            action, _ = model.predict(observation, deterministic=True)
            action = int(action)
            observation, reward, terminated, truncated, info = eval_env.step(action)
            total_reward += float(reward)
            cull_actions += int(action == ACTION_CULL)
            steps += 1
            terminal_reason = info.get("terminal_reason", "") or "non_terminal"
            if terminated or truncated:
                break
        rows.append(
            {
                "algorithm": ALGORITHM,
                "episode": episode + 1,
                "total_reward": total_reward,
                "steps": steps,
                "cull_action_rate": cull_actions / max(steps, 1),
                "terminal_reason": terminal_reason,
            }
        )
    return pd.DataFrame(rows)


def policy_table_for_model(model: Any, env: CowReplacementGymEnv, mdp_states: list[str], mdp_actions: np.ndarray) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for state_idx, state in enumerate(mdp_states):
        observation = env.observation_for_state_idx(state_idx)
        action, _ = model.predict(observation, deterministic=True)
        action = int(action)
        rows.append(
            {
                "algorithm": ALGORITHM,
                "state_bucket_exact": state,
                "selected_action": "cull" if action == ACTION_CULL else "keep",
                "optimal_action_mdp": "cull" if int(mdp_actions[state_idx]) == ACTION_CULL else "keep",
                "changed_vs_mdp": int(action != int(mdp_actions[state_idx])),
            }
        )
    return pd.DataFrame(rows)


def write_sb3_report(results: pd.DataFrame, env: RLTrainingEnvironment, rules: dict[str, Any]) -> None:
    report_path = project_path(env, rules["output"]["sb3_training_report_md"])
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
            f"{float(row['policy_cull_state_rate']):.4f} | {int(row['changed_states_vs_mdp_value_iteration'])} | {row['notes']} |"
        )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def update_sb3_outputs(
    env: RLTrainingEnvironment,
    rules: dict[str, Any],
    result_row: dict[str, Any],
    policy: pd.DataFrame,
    episodes: pd.DataFrame,
) -> None:
    results_path = project_path(env, rules["output"]["sb3_training_results_csv"])
    policy_path = project_path(env, rules["output"]["sb3_policy_table_csv"])
    episodes_path = project_path(env, rules["output"]["sb3_eval_episodes_csv"])
    if results_path.exists():
        results = pd.read_csv(results_path, low_memory=False)
        results = results[~results["algorithm"].astype(str).eq(ALGORITHM)]
    else:
        results = pd.DataFrame()
    results = pd.concat([results, pd.DataFrame([result_row])], ignore_index=True).sort_values(
        "mean_total_reward", ascending=False
    )
    if policy_path.exists():
        policy_table = pd.read_csv(policy_path, low_memory=False)
        policy_table = policy_table[~policy_table.get("algorithm", pd.Series(dtype=str)).astype(str).eq(ALGORITHM)]
    else:
        policy_table = pd.DataFrame()
    policy_table = pd.concat([policy_table, policy], ignore_index=True)
    if episodes_path.exists():
        episode_table = pd.read_csv(episodes_path, low_memory=False)
        episode_table = episode_table[~episode_table.get("algorithm", pd.Series(dtype=str)).astype(str).eq(ALGORITHM)]
    else:
        episode_table = pd.DataFrame()
    episode_table = pd.concat([episode_table, episodes], ignore_index=True)
    results_path.parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(results_path, index=False)
    policy_table.to_csv(policy_path, index=False)
    episode_table.to_csv(episodes_path, index=False)
    write_sb3_report(results, env, rules)


def missing_dependency_outputs(env: RLTrainingEnvironment, rules: dict[str, Any], missing: list[str]) -> None:
    reason = "Missing optional RL dependencies: " + ", ".join(missing)
    row = {
        "algorithm": ALGORITHM,
        "run_status": "missing_dependency",
        "total_timesteps": 0,
        "eval_episodes": 0,
        "mean_total_reward": np.nan,
        "median_total_reward": np.nan,
        "mean_steps": np.nan,
        "policy_cull_state_rate": np.nan,
        "changed_states_vs_mdp_value_iteration": np.nan,
        "notes": reason,
    }
    update_sb3_outputs(env, rules, row, pd.DataFrame(), pd.DataFrame())


def run(env: RLTrainingEnvironment, default_python: str, sb3_python: str | None, check: bool) -> list[CommandResult]:
    rules = env.load_config()
    available, missing = dependencies_available()
    if not available:
        missing_dependency_outputs(env, rules, missing)
        return direct_result("sb3_dqn", stdout="missing dependencies: " + ", ".join(missing))

    mdp = load_tabular_mdp(env, rules)
    mdp_actions = optimal_actions_from_policy(env, rules, mdp.states)
    model_dir = project_path(env, rules["output"]["sb3_model_dir"])
    model_dir.mkdir(parents=True, exist_ok=True)
    seed = int(rules["stable_baselines3"].get("random_seed", 42))
    eval_episodes = int(rules["stable_baselines3"].get("eval_episodes", 400))
    cfg = rules["stable_baselines3"]["algorithms"][ALGORITHM]
    total_timesteps = int(cfg.get("total_timesteps", 30000))

    train_env = CowReplacementGymEnv(mdp, rules, seed=seed)
    model = make_dqn_model(train_env, rules)
    model.learn(total_timesteps=total_timesteps, progress_bar=False)
    model_path = model_dir / "dqn_cow_replacement.zip"
    model.save(model_path)

    eval_env = CowReplacementGymEnv(mdp, rules, seed=seed + 100)
    episodes = evaluate_model(model, eval_env, eval_episodes)
    policy = policy_table_for_model(model, eval_env, mdp.states, mdp_actions)
    result_row = {
        "algorithm": ALGORITHM,
        "run_status": "completed",
        "total_timesteps": total_timesteps,
        "eval_episodes": eval_episodes,
        "mean_total_reward": float(episodes["total_reward"].mean()),
        "median_total_reward": float(episodes["total_reward"].median()),
        "mean_steps": float(episodes["steps"].mean()),
        "policy_cull_state_rate": float(policy["selected_action"].eq("cull").mean()),
        "changed_states_vs_mdp_value_iteration": int(policy["changed_vs_mdp"].sum()),
        "notes": f"Saved model: {model_path.relative_to(env.project_root)}",
    }
    update_sb3_outputs(env, rules, result_row, policy, episodes)
    return direct_result(
        "sb3_dqn",
        stdout=f"trained DQN timesteps={total_timesteps} mean_reward={result_row['mean_total_reward']:.2f}",
    )


def definition() -> ModelRunSpec:
    return ModelRunSpec(
        key="sb3_dqn",
        display_name="Stable-Baselines3 DQN",
        family="gymnasium_sb3",
        description="Direct DQN training on CowReplacementGymEnv.",
        runner=run,
        python_role="sb3",
        config_overrides={
            "stable_baselines3.algorithms.PPO.enabled": False,
            "stable_baselines3.algorithms.DQN.enabled": True,
        },
        notes="Real DQN training loop on empirical simulator.",
    )
