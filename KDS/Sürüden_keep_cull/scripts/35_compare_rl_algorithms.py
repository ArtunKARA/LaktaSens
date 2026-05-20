from __future__ import annotations

from datetime import datetime
from typing import Any
import warnings

import numpy as np
import pandas as pd

from rl_experiment_utils import (
    ACTION_CULL,
    ACTION_KEEP,
    ACTION_NAMES,
    TabularMdp,
    evaluate_policy_row,
    load_tabular_mdp,
    policy_probabilities_from_actions,
    sample_initial_state,
    sample_keep_next_state,
)
from rl_mdp_utils import PROJECT_ROOT, path_from_root, read_rules


def optimal_actions_from_policy(mdp: TabularMdp, rules: dict[str, Any]) -> np.ndarray:
    policy_path = path_from_root(rules["output"]["optimal_policy_table_csv"])
    if not policy_path.exists():
        raise FileNotFoundError(policy_path)
    policy = pd.read_csv(policy_path, low_memory=False)
    action_by_state = dict(zip(policy["state_bucket_exact"].astype(str), policy["optimal_action"].astype(str)))
    return np.array([ACTION_CULL if action_by_state.get(state) == "cull" else ACTION_KEEP for state in mdp.states], dtype="int64")


def heuristic_actions(mdp: TabularMdp, algorithm: str, rules: dict[str, Any]) -> np.ndarray:
    actions = np.zeros(len(mdp.states), dtype="int64")
    algo_rules = rules["rl_experiments"]["algorithms"].get(algorithm, {})
    if algorithm == "keep_all":
        return actions
    if algorithm == "cull_all_now":
        actions[:] = ACTION_CULL
        return actions
    if algorithm == "risk_threshold":
        threshold = float(algo_rules.get("threshold", 0.35))
        column = str(algo_rules.get("risk_column", "mean_cull_risk_90d"))
        values = pd.to_numeric(mdp.state_info.get(column, 0.0), errors="coerce").fillna(0.0).to_numpy()
        return (values >= threshold).astype("int64")
    if algorithm == "milk_margin_threshold":
        threshold = float(algo_rules.get("min_monthly_margin", 0.0))
        revenue = pd.to_numeric(mdp.state_info.get("milk_revenue_month", 0.0), errors="coerce").fillna(0.0).to_numpy()
        maintenance = pd.to_numeric(mdp.state_info.get("maintenance_cost_month", 0.0), errors="coerce").fillna(0.0).to_numpy()
        return ((revenue - maintenance) < threshold).astype("int64")
    raise ValueError(f"Unknown heuristic: {algorithm}")


def random_policy_probs(mdp: TabularMdp, rules: dict[str, Any]) -> np.ndarray:
    probability = float(rules["rl_experiments"]["algorithms"]["random_policy"].get("cull_probability", 0.05))
    probs = np.zeros((len(mdp.states), 2), dtype="float64")
    probs[:, ACTION_KEEP] = 1.0 - probability
    probs[:, ACTION_CULL] = probability
    return probs


def train_tabular_q_learning(mdp: TabularMdp, rules: dict[str, Any]) -> tuple[np.ndarray, str]:
    cfg = rules["rl_experiments"]["algorithms"]["tabular_q_learning"]
    rng = np.random.default_rng(int(rules["rl_experiments"].get("random_seed", 42)))
    q_values = np.zeros((len(mdp.states), 2), dtype="float64")
    episodes = int(cfg.get("episodes", 4000))
    max_steps = int(cfg.get("max_steps", 60))
    alpha = float(cfg.get("alpha", 0.18))
    epsilon = float(cfg.get("epsilon_start", 0.35))
    epsilon_end = float(cfg.get("epsilon_end", 0.03))
    epsilon_decay = float(cfg.get("epsilon_decay", 0.999))
    for _ in range(episodes):
        state_idx = sample_initial_state(mdp, rng)
        for _step in range(max_steps):
            if rng.random() < epsilon:
                action = int(rng.integers(0, 2))
            else:
                action = int(np.argmax(q_values[state_idx]))
            reward = mdp.rewards[state_idx, action]
            if action == ACTION_CULL:
                target = reward
                q_values[state_idx, action] += alpha * (target - q_values[state_idx, action])
                break
            next_idx = sample_keep_next_state(mdp, state_idx, rng)
            target = reward if next_idx is None else reward + mdp.gamma * float(np.max(q_values[next_idx]))
            q_values[state_idx, action] += alpha * (target - q_values[state_idx, action])
            if next_idx is None:
                break
            state_idx = next_idx
        epsilon = max(epsilon_end, epsilon * epsilon_decay)
    actions = np.argmax(q_values, axis=1).astype("int64")
    notes = f"Tabular Q-learning on empirical simulator; episodes={episodes}, final_epsilon={epsilon:.4f}."
    return actions, notes


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / exp.sum()


def train_tabular_ppo_smoke(mdp: TabularMdp, rules: dict[str, Any]) -> tuple[np.ndarray, np.ndarray, str]:
    cfg = rules["rl_experiments"]["algorithms"]["tabular_ppo_smoke"]
    rng = np.random.default_rng(int(rules["rl_experiments"].get("random_seed", 42)) + 17)
    logits = np.zeros((len(mdp.states), 2), dtype="float64")
    values = np.zeros(len(mdp.states), dtype="float64")
    iterations = int(cfg.get("iterations", 140))
    episodes_per_iteration = int(cfg.get("episodes_per_iteration", 24))
    max_steps = int(cfg.get("max_steps", 48))
    learning_rate = float(cfg.get("learning_rate", 0.015))
    value_learning_rate = float(cfg.get("value_learning_rate", 0.08))
    clip_ratio = float(cfg.get("clip_ratio", 0.2))
    entropy_bonus = float(cfg.get("entropy_bonus", 0.002))

    for _iteration in range(iterations):
        rollouts: list[list[dict[str, float | int]]] = []
        for _episode in range(episodes_per_iteration):
            episode: list[dict[str, float | int]] = []
            state_idx = sample_initial_state(mdp, rng)
            for _step in range(max_steps):
                probs = softmax(logits[state_idx])
                action = int(rng.choice(2, p=probs))
                reward = float(mdp.rewards[state_idx, action])
                episode.append(
                    {
                        "state_idx": state_idx,
                        "action": action,
                        "reward": reward,
                        "old_prob": float(probs[action]),
                    }
                )
                if action == ACTION_CULL:
                    break
                next_idx = sample_keep_next_state(mdp, state_idx, rng)
                if next_idx is None:
                    break
                state_idx = next_idx
            rollouts.append(episode)

        for episode in rollouts:
            return_value = 0.0
            for step in reversed(episode):
                return_value = float(step["reward"]) + mdp.gamma * return_value
                state_idx = int(step["state_idx"])
                action = int(step["action"])
                old_prob = max(float(step["old_prob"]), 1e-8)
                current_probs = softmax(logits[state_idx])
                ratio = float(current_probs[action] / old_prob)
                clipped_ratio = float(np.clip(ratio, 1.0 - clip_ratio, 1.0 + clip_ratio))
                advantage = return_value - values[state_idx]
                values[state_idx] += value_learning_rate * advantage

                one_hot = np.zeros(2, dtype="float64")
                one_hot[action] = 1.0
                policy_grad = one_hot - current_probs
                entropy_grad = np.full(2, 0.5) - current_probs
                logits[state_idx] += learning_rate * clipped_ratio * advantage * policy_grad
                logits[state_idx] += learning_rate * entropy_bonus * entropy_grad

    probs = np.vstack([softmax(row) for row in logits])
    actions = probs.argmax(axis=1).astype("int64")
    notes = f"Tabular PPO-style smoke test on empirical simulator; iterations={iterations}."
    return actions, probs, notes


def state_action_feature_frame(state_info: pd.DataFrame, actions: np.ndarray) -> pd.DataFrame:
    categorical = [
        "laktasyon_evresi",
        "parite_grup",
        "dim_band",
        "milk_level_band",
        "milk_trend_band",
        "health_risk_band",
        "risk_band",
    ]
    numeric = [
        "mean_daily_milk_kg",
        "mean_cull_risk_90d",
        "mean_cull_risk_30d",
        "mean_health_risk_score",
        "mean_dim",
        "state_support",
    ]
    frame = pd.DataFrame(index=np.arange(len(actions)))
    for column in categorical:
        frame[column] = state_info[column].fillna("unknown").astype(str).to_numpy()
    for column in numeric:
        frame[column] = pd.to_numeric(state_info.get(column, 0.0), errors="coerce").fillna(0.0).to_numpy()
    frame["action"] = actions.astype(int)
    return pd.get_dummies(frame, columns=categorical + ["action"], dtype=float)


def train_dqn_style_fqi_mlp(mdp: TabularMdp, rules: dict[str, Any]) -> tuple[np.ndarray | None, str]:
    try:
        from sklearn.exceptions import ConvergenceWarning
        from sklearn.neural_network import MLPRegressor
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError:
        return None, "sklearn is not available; DQN-style fitted Q iteration skipped."

    cfg = rules["rl_experiments"]["algorithms"]["dqn_style_fqi_mlp"]
    fitted_iterations = int(cfg.get("fitted_iterations", 10))
    hidden_layer_sizes = tuple(int(value) for value in cfg.get("hidden_layer_sizes", [32]))
    max_iter = int(cfg.get("max_iter", 250))
    state_count = len(mdp.states)
    actions = np.tile(np.array([ACTION_KEEP, ACTION_CULL], dtype="int64"), state_count)
    state_repeated = pd.concat([mdp.state_info, mdp.state_info], ignore_index=True).sort_index(kind="stable")
    state_repeated = mdp.state_info.loc[np.repeat(np.arange(state_count), 2)].reset_index(drop=True)
    x = state_action_feature_frame(state_repeated, actions)
    q_previous = np.zeros((state_count, 2), dtype="float64")
    model = None
    for iteration in range(fitted_iterations):
        targets = np.zeros(state_count * 2, dtype="float64")
        for state_idx in range(state_count):
            expected_next = 0.0
            for next_idx, probability in mdp.keep_outcomes[state_idx]:
                if next_idx is not None:
                    expected_next += probability * float(np.max(q_previous[next_idx]))
            targets[state_idx * 2 + ACTION_KEEP] = mdp.rewards[state_idx, ACTION_KEEP] + mdp.gamma * expected_next
            targets[state_idx * 2 + ACTION_CULL] = mdp.rewards[state_idx, ACTION_CULL]
        model = make_pipeline(
            StandardScaler(with_mean=False),
            MLPRegressor(
                hidden_layer_sizes=hidden_layer_sizes,
                activation="relu",
                solver="adam",
                random_state=int(rules["rl_experiments"].get("random_seed", 42)) + iteration,
                max_iter=max_iter,
                early_stopping=False,
            ),
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", ConvergenceWarning)
            model.fit(x, targets)
        predictions = model.predict(x).reshape(state_count, 2)
        q_previous = predictions
    actions_out = np.argmax(q_previous, axis=1).astype("int64")
    notes = f"DQN-style fitted Q iteration with sklearn MLP; fitted_iterations={fitted_iterations}, hidden={hidden_layer_sizes}."
    return actions_out, notes


def not_run_row(algorithm: str, experiment_type: str, reason: str) -> dict[str, Any]:
    return {
        "algorithm": algorithm,
        "experiment_type": experiment_type,
        "run_status": "not_run",
        "states": 0,
        "mean_state_value": np.nan,
        "mean_initial_state_value": np.nan,
        "median_state_value": np.nan,
        "cull_state_rate": np.nan,
        "changed_states_vs_mdp_value_iteration": np.nan,
        "changed_state_rate_vs_mdp_value_iteration": np.nan,
        "policy_eval_iterations": np.nan,
        "policy_eval_converged": False,
        "notes": reason,
    }


def write_report(results: pd.DataFrame, policy_table: pd.DataFrame, rules: dict[str, Any]) -> None:
    report_path = path_from_root(rules["output"]["rl_algorithm_comparison_report_md"])
    completed = results[results["run_status"].eq("completed")].sort_values("mean_initial_state_value", ascending=False)
    lines = [
        "# RL Algorithm Comparison Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Results: `{rules['output']['rl_algorithm_comparison_csv']}`",
        f"- Policy table: `{rules['output']['rl_algorithm_policy_table_csv']}`",
        "",
        "## Completed Benchmark Results",
        "",
        "| Algorithm | Type | Mean initial V | Mean state V | Cull state rate | Changed vs MDP | Eval converged | Notes |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for row in completed.to_dict("records"):
        lines.append(
            f"| `{row['algorithm']}` | `{row['experiment_type']}` | {float(row['mean_initial_state_value']):.2f} | "
            f"{float(row['mean_state_value']):.2f} | {float(row['cull_state_rate']):.4f} | "
            f"{int(row['changed_states_vs_mdp_value_iteration'])} | {bool(row['policy_eval_converged'])} | {row['notes']} |"
        )

    not_run = results[~results["run_status"].eq("completed")]
    lines.extend(["", "## Not Run / Not Eligible", "", "| Algorithm | Type | Status | Reason |", "|---|---|---|---|"])
    if not_run.empty:
        lines.append("| - | - | - | - |")
    else:
        for row in not_run.to_dict("records"):
            lines.append(f"| `{row['algorithm']}` | `{row['experiment_type']}` | `{row['run_status']}` | {row['notes']} |")

    if not policy_table.empty:
        summary = (
            policy_table.groupby("algorithm")["selected_action"]
            .value_counts()
            .unstack(fill_value=0)
            .reset_index()
        )
        lines.extend(["", "## Learned/Derived Policy Counts", "", "| Algorithm | Keep states | Cull states |", "|---|---:|---:|"])
        for row in summary.to_dict("records"):
            lines.append(f"| `{row['algorithm']}` | {int(row.get('keep', 0))} | {int(row.get('cull', 0))} |")

    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "- `model_based_mdp_value_iteration` remains the reference solution for this phase.",
            "- Simulator RL rows are benchmark smoke tests over the empirical MDP, not production policies.",
            "- Offline RL algorithms are intentionally not run because real logged actions are missing.",
            "- If simulator RL beats or matches the MDP reference, treat it as an implementation sanity check, not a proof of superiority.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    mdp = load_tabular_mdp(rules)
    optimal_actions = optimal_actions_from_policy(mdp, rules)
    algorithm_rules = rules["rl_experiments"]["algorithms"]
    result_rows: list[dict[str, Any]] = []
    policy_frames: list[pd.DataFrame] = []

    if algorithm_rules["mdp_value_iteration"].get("enabled", True):
        probs = policy_probabilities_from_actions(optimal_actions)
        row, policy = evaluate_policy_row(
            "model_based_mdp_value_iteration",
            "model_based_exact",
            mdp,
            probs,
            optimal_actions,
            rules,
            "Reference policy from value iteration.",
        )
        result_rows.append(row)
        policy_frames.append(policy)

    for algorithm in ["keep_all", "cull_all_now", "risk_threshold", "milk_margin_threshold"]:
        if not algorithm_rules[algorithm].get("enabled", False):
            continue
        actions = heuristic_actions(mdp, algorithm, rules)
        probs = policy_probabilities_from_actions(actions)
        row, policy = evaluate_policy_row(
            algorithm,
            algorithm_rules[algorithm].get("experiment_type", "heuristic"),
            mdp,
            probs,
            optimal_actions,
            rules,
            "Deterministic heuristic baseline.",
        )
        result_rows.append(row)
        policy_frames.append(policy)

    if algorithm_rules["random_policy"].get("enabled", False):
        probs = random_policy_probs(mdp, rules)
        row, policy = evaluate_policy_row(
            "random_policy",
            "heuristic_stochastic",
            mdp,
            probs,
            optimal_actions,
            rules,
            "Stochastic baseline with fixed cull probability.",
        )
        result_rows.append(row)
        policy_frames.append(policy)

    if algorithm_rules["tabular_q_learning"].get("enabled", False):
        actions, notes = train_tabular_q_learning(mdp, rules)
        row, policy = evaluate_policy_row(
            "tabular_q_learning",
            "simulator_rl",
            mdp,
            policy_probabilities_from_actions(actions),
            optimal_actions,
            rules,
            notes,
        )
        result_rows.append(row)
        policy_frames.append(policy)

    if algorithm_rules["tabular_ppo_smoke"].get("enabled", False):
        actions, probs, notes = train_tabular_ppo_smoke(mdp, rules)
        row, policy = evaluate_policy_row(
            "tabular_ppo_smoke",
            "simulator_rl",
            mdp,
            probs,
            optimal_actions,
            rules,
            notes,
        )
        result_rows.append(row)
        policy_frames.append(policy)

    if algorithm_rules["dqn_style_fqi_mlp"].get("enabled", False):
        actions, notes = train_dqn_style_fqi_mlp(mdp, rules)
        if actions is None:
            result_rows.append(not_run_row("dqn_style_fqi_mlp", "simulator_rl_approximate", notes))
        else:
            row, policy = evaluate_policy_row(
                "dqn_style_fqi_mlp",
                "simulator_rl_approximate",
                mdp,
                policy_probabilities_from_actions(actions),
                optimal_actions,
                rules,
                notes,
            )
            result_rows.append(row)
            policy_frames.append(policy)

    for algorithm in ["cql", "iql", "bcq", "td3", "sac"]:
        cfg = algorithm_rules.get(algorithm, {})
        result_rows.append(
            not_run_row(
                algorithm,
                cfg.get("experiment_type", "not_applicable"),
                cfg.get("disabled_reason", "Not enabled for this phase."),
            )
        )

    results = pd.DataFrame(result_rows)
    results = results.sort_values(["run_status", "mean_initial_state_value"], ascending=[True, False], na_position="last")
    policy_table = pd.concat(policy_frames, ignore_index=True) if policy_frames else pd.DataFrame()

    output_path = path_from_root(rules["output"]["rl_algorithm_comparison_csv"])
    policy_path = path_from_root(rules["output"]["rl_algorithm_policy_table_csv"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(output_path, index=False)
    policy_table.to_csv(policy_path, index=False)
    write_report(results, policy_table, rules)

    print(f"wrote {output_path.relative_to(PROJECT_ROOT)} ({len(results)} rows)")
    print(f"wrote {policy_path.relative_to(PROJECT_ROOT)} ({len(policy_table)} rows)")
    print(f"wrote {rules['output']['rl_algorithm_comparison_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
