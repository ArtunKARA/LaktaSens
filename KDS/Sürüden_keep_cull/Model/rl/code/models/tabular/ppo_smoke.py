from __future__ import annotations

import numpy as np

from models.base import ModelRunSpec
from models.common import (
    ACTION_CULL,
    direct_result,
    evaluate_policy_row,
    load_tabular_mdp,
    optimal_actions_from_policy,
    sample_initial_state,
    sample_keep_next_state,
    update_rl_algorithm_outputs,
)
from training_environment import CommandResult, RLTrainingEnvironment


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / exp.sum()


def train_tabular_ppo_smoke(mdp, rules: dict) -> tuple[np.ndarray, np.ndarray, str]:
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
                episode.append({"state_idx": state_idx, "action": action, "reward": reward, "old_prob": float(probs[action])})
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
                logits[state_idx] += learning_rate * clipped_ratio * advantage * (one_hot - current_probs)
                logits[state_idx] += learning_rate * entropy_bonus * (np.full(2, 0.5) - current_probs)

    probs = np.vstack([softmax(row) for row in logits])
    actions = probs.argmax(axis=1).astype("int64")
    return actions, probs, f"Direct tabular PPO-style smoke test; iterations={iterations}."


def run(env: RLTrainingEnvironment, default_python: str, sb3_python: str | None, check: bool) -> list[CommandResult]:
    rules = env.load_config()
    mdp = load_tabular_mdp(env, rules)
    optimal_actions = optimal_actions_from_policy(env, rules, mdp.states)
    actions, probs, notes = train_tabular_ppo_smoke(mdp, rules)
    row, policy = evaluate_policy_row(
        "tabular_ppo_smoke",
        rules["rl_experiments"]["algorithms"]["tabular_ppo_smoke"].get("experiment_type", "simulator_rl"),
        mdp,
        probs,
        optimal_actions,
        rules,
        notes,
    )
    update_rl_algorithm_outputs(env, rules, [row], [policy])
    return direct_result(
        "tabular_ppo_smoke",
        stdout=f"trained tabular_ppo_smoke states={len(mdp.states)} cull_states={int((actions == ACTION_CULL).sum())}",
    )


def definition() -> ModelRunSpec:
    return ModelRunSpec(
        key="tabular_ppo_smoke",
        display_name="Tabular PPO-Style Smoke",
        family="simulator_rl",
        description="Direct lightweight PPO-style tabular policy optimization.",
        runner=run,
        config_overrides={"rl_experiments.algorithms.tabular_ppo_smoke.enabled": True},
        notes="PPO-style sanity benchmark, not Stable-Baselines PPO.",
    )
