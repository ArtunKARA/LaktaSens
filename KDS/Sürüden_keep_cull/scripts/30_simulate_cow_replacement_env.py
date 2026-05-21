from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "rl_env_rules.yaml"


def read_rules(path: Path = RULES_PATH) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if np.isnan(number):
        return default
    return number


def load_reward_parameters(path: Path) -> dict[str, float]:
    df = pd.read_csv(path, low_memory=False)
    values: dict[str, float] = {}
    for _, row in df.iterrows():
        values[str(row["parameter"])] = safe_float(row["value"])
    return values


@dataclass
class StepResult:
    observation: dict[str, Any]
    reward: float
    terminated: bool
    truncated: bool
    info: dict[str, Any]


class CowReplacementEnv:
    """Small Gymnasium-style smoke-test environment.

    This prototype intentionally avoids a hard dependency on gymnasium. It keeps
    the same reset/step semantics and can later be wrapped in a real Gymnasium
    Env class.
    """

    def __init__(
        self,
        state_table: pd.DataFrame,
        transition_model: pd.DataFrame,
        rules: dict[str, Any],
        reward_parameters: dict[str, float],
        seed: int = 42,
    ) -> None:
        self.rules = rules
        self.reward_parameters = reward_parameters
        self.rng = np.random.default_rng(seed)
        self.state_table = state_table.copy()
        self.state_table["referans_tarih"] = pd.to_datetime(self.state_table["referans_tarih"], errors="coerce")
        self.state_by_snapshot = {
            str(row["snapshot_id"]): row for _, row in self.state_table.iterrows()
        }
        self.state_bucket_groups = {
            bucket: group.reset_index(drop=True)
            for bucket, group in self.state_table.groupby("state_bucket_exact", dropna=False)
        }
        self.transition_model = transition_model.copy()
        self.transition_model["probability"] = pd.to_numeric(self.transition_model["probability"], errors="coerce").fillna(0)
        self.fallback_order = rules["transition"]["fallback_order"]
        self.numeric_columns = rules["state"]["numeric_columns"]
        self.categorical_columns = rules["state"]["categorical_columns"]
        self.max_episode_months = int(rules["time"]["max_episode_months"])
        self.current_state: pd.Series | None = None
        self.episode_canonical_animal_id = ""
        self.steps = 0

    def initial_states(self) -> pd.DataFrame:
        ordered = self.state_table.sort_values(["canonical_animal_id", "referans_tarih"])
        return ordered.groupby("canonical_animal_id", as_index=False).head(1).reset_index(drop=True)

    def reset(self, snapshot_id: str | None = None) -> tuple[dict[str, Any], dict[str, Any]]:
        if snapshot_id is None:
            initial = self.initial_states()
            row = initial.iloc[int(self.rng.integers(0, len(initial)))]
        else:
            row = self.state_by_snapshot[str(snapshot_id)]
        self.current_state = row
        self.episode_canonical_animal_id = str(row.get("canonical_animal_id"))
        self.steps = 0
        return self.observation(row), self.info(row, terminal_reason="")

    def observation(self, row: pd.Series) -> dict[str, Any]:
        observation: dict[str, Any] = {}
        for column in self.numeric_columns:
            observation[column] = safe_float(row.get(column), default=0.0)
        for column in self.categorical_columns:
            value = row.get(column, "unknown")
            observation[column] = "unknown" if pd.isna(value) else str(value)
        return observation

    def info(self, row: pd.Series, terminal_reason: str, fallback_used: str = "") -> dict[str, Any]:
        return {
            "snapshot_id": row.get("snapshot_id"),
            "canonical_animal_id": self.episode_canonical_animal_id or row.get("canonical_animal_id"),
            "state_source_canonical_animal_id": row.get("canonical_animal_id"),
            "source_code": row.get("source_code"),
            "referans_tarih": row.get("referans_tarih").date().isoformat()
            if not pd.isna(row.get("referans_tarih"))
            else "",
            "risk_band": row.get("risk_band"),
            "state_bucket_exact": row.get("state_bucket_exact"),
            "terminal_reason": terminal_reason,
            "fallback_used": fallback_used,
        }

    def reward_components(self, row: pd.Series, action: int) -> dict[str, float]:
        days = float(self.rules["reward"]["days_in_month"])
        coefficients = self.rules["reward"].get("coefficients", {})
        milk_price = self.reward_parameters.get("sut_fiyati", 0.0)
        maintenance_daily = self.reward_parameters.get("gunluk_bakim_maliyeti", 0.0)
        treatment_cost = self.reward_parameters.get("tedavi_maliyeti", 0.0)
        insemination_cost = self.reward_parameters.get("basarisiz_tohumlama_maliyeti", 0.0)
        replacement_cost = self.reward_parameters.get("replacement_maliyeti", 0.0)
        cull_sale_value = self.reward_parameters.get("cull_satis_degeri", 0.0)
        disposal_cost = safe_float(self.rules["reward"].get("disposal_or_transaction_cost"), 0.0)

        if action == 1:
            cull_reward = cull_sale_value - replacement_cost - disposal_cost
            return {
                "milk_revenue_month": 0.0,
                "maintenance_cost_month": 0.0,
                "health_risk_cost_month": 0.0,
                "reproduction_risk_cost_month": 0.0,
                "expected_culling_risk_cost_month": 0.0,
                "cull_sale_value": cull_sale_value,
                "replacement_cost": replacement_cost,
                "disposal_or_transaction_cost": disposal_cost,
                "reward": cull_reward,
            }

        daily_milk_kg = max(safe_float(row.get("daily_milk_kg")), 0.0)
        milk_revenue = daily_milk_kg * days * milk_price
        maintenance = maintenance_daily * days
        health_events_month = safe_float(row.get("health_count_90")) * float(coefficients.get("health_event_monthly_fraction", 1 / 3))
        health_cost = health_events_month * treatment_cost
        health_cost += safe_float(row.get("mastitis_flag")) * treatment_cost * float(coefficients.get("mastitis_flag_cost_fraction", 0.25))
        health_cost += safe_float(row.get("lameness_flag")) * treatment_cost * float(coefficients.get("lameness_flag_cost_fraction", 0.25))
        health_cost += safe_float(row.get("cell_risk_flag")) * treatment_cost * float(coefficients.get("cell_risk_flag_cost_fraction", 0.15))

        extra_service_threshold = float(coefficients.get("extra_service_threshold", 2))
        extra_services = max(safe_float(row.get("servis_sayisi")) - extra_service_threshold, 0.0)
        reproduction_cost = extra_services * insemination_cost
        open_cow_dim_threshold = float(coefficients.get("open_cow_dim_threshold", 150))
        gebe_mi = safe_float(row.get("gebe_mi"), default=0.0)
        if gebe_mi < 0.5 and safe_float(row.get("dim")) > open_cow_dim_threshold:
            reproduction_cost += insemination_cost * float(coefficients.get("open_cow_penalty_service_equivalent", 1.0))

        expected_culling_cost = (
            safe_float(row.get("cull_risk_30d"))
            * replacement_cost
            * float(coefficients.get("expected_culling_risk_cost_fraction", 0.25))
        )
        reward = milk_revenue - maintenance - health_cost - reproduction_cost - expected_culling_cost
        return {
            "milk_revenue_month": milk_revenue,
            "maintenance_cost_month": maintenance,
            "health_risk_cost_month": health_cost,
            "reproduction_risk_cost_month": reproduction_cost,
            "expected_culling_risk_cost_month": expected_culling_cost,
            "cull_sale_value": 0.0,
            "replacement_cost": 0.0,
            "disposal_or_transaction_cost": 0.0,
            "reward": reward,
        }

    def sample_keep_transition(self, row: pd.Series) -> tuple[pd.Series | None, str, str]:
        for bucket_column in self.fallback_order:
            current_bucket = "global" if bucket_column == "global" else str(row.get(bucket_column, "unknown"))
            candidates = self.transition_model[
                self.transition_model["action_name"].eq("keep")
                & self.transition_model["bucket_column"].eq(bucket_column)
                & self.transition_model["current_bucket"].astype(str).eq(current_bucket)
            ].copy()
            if candidates.empty:
                continue
            probabilities = candidates["probability"].to_numpy(dtype=float)
            probabilities = probabilities / probabilities.sum()
            selected = candidates.iloc[int(self.rng.choice(len(candidates), p=probabilities))]
            if selected["outcome_type"] == "terminal":
                terminal_reason = selected.get("outcome_terminal_reason")
                terminal_reason = "unknown_terminal" if pd.isna(terminal_reason) or not terminal_reason else str(terminal_reason)
                return None, terminal_reason, bucket_column
            next_bucket = selected.get("outcome_state_bucket_exact")
            if pd.isna(next_bucket) or not str(next_bucket):
                return None, "missing_next_state_bucket", bucket_column
            state_candidates = self.state_bucket_groups.get(str(next_bucket))
            if state_candidates is None or state_candidates.empty:
                return None, "next_state_bucket_not_found", bucket_column
            next_row = state_candidates.iloc[int(self.rng.integers(0, len(state_candidates)))]
            return next_row, "", bucket_column
        return None, "no_transition_available", "none"

    def step(self, action: int) -> StepResult:
        if self.current_state is None:
            raise RuntimeError("reset() must be called before step().")
        if action not in {0, 1}:
            raise ValueError("Action must be 0=keep or 1=cull.")

        row = self.current_state
        components = self.reward_components(row, action)
        self.steps += 1

        if action == 1:
            info = self.info(row, terminal_reason="agent_cull")
            info.update(components)
            return StepResult(self.observation(row), components["reward"], True, False, info)

        next_row, terminal_reason, fallback_used = self.sample_keep_transition(row)
        truncated = self.steps >= self.max_episode_months
        if next_row is None or truncated:
            reason = terminal_reason or "max_episode_length"
            info = self.info(row, terminal_reason=reason, fallback_used=fallback_used)
            info.update(components)
            return StepResult(self.observation(row), components["reward"], True, truncated, info)

        self.current_state = next_row
        info = self.info(next_row, terminal_reason="", fallback_used=fallback_used)
        info.update(components)
        return StepResult(self.observation(next_row), components["reward"], False, False, info)


def policy_action(policy_name: str, observation: dict[str, Any], env: CowReplacementEnv, rules: dict[str, Any]) -> int:
    policies = rules["simulation"]["policies"]
    if policy_name == "keep_all":
        return 0
    if policy_name == "cull_all_now":
        return 1
    if policy_name == "risk_threshold":
        threshold = float(policies["risk_threshold"].get("threshold", 0.35))
        risk_col = policies["risk_threshold"].get("risk_column", "cull_risk_90d")
        return int(safe_float(observation.get(risk_col)) >= threshold)
    if policy_name == "milk_margin_threshold":
        row = env.current_state
        assert row is not None
        components = env.reward_components(row, 0)
        margin = components["milk_revenue_month"] - components["maintenance_cost_month"]
        return int(margin < float(policies["milk_margin_threshold"].get("min_monthly_margin", 0.0)))
    if policy_name == "random_policy":
        probability = float(policies["random_policy"].get("cull_probability", 0.05))
        return int(env.rng.random() < probability)
    raise ValueError(f"Unknown policy: {policy_name}")


def simulate_policy(policy_name: str, env: CowReplacementEnv, initial_states: pd.DataFrame, rules: dict[str, Any]) -> tuple[pd.DataFrame, pd.DataFrame]:
    trace_rows: list[dict[str, Any]] = []
    episode_rows: list[dict[str, Any]] = []
    for episode_idx, initial in initial_states.iterrows():
        observation, info = env.reset(str(initial["snapshot_id"]))
        total_reward = 0.0
        terminal_reason = ""
        cull_actions = 0
        for step_idx in range(env.max_episode_months):
            action = policy_action(policy_name, observation, env, rules)
            cull_actions += int(action == 1)
            result = env.step(action)
            total_reward += result.reward
            terminal_reason = result.info.get("terminal_reason", "")
            trace_rows.append(
                {
                    "policy": policy_name,
                    "episode_id": f"{policy_name}:{episode_idx + 1}",
                    "step": step_idx + 1,
                    "snapshot_id": info.get("snapshot_id"),
                    "canonical_animal_id": info.get("canonical_animal_id"),
                    "state_source_canonical_animal_id": info.get("state_source_canonical_animal_id"),
                    "action": action,
                    "reward": result.reward,
                    "terminated": int(result.terminated),
                    "truncated": int(result.truncated),
                    "terminal_reason": terminal_reason or "non_terminal",
                    "fallback_used": result.info.get("fallback_used", ""),
                    "risk_band": info.get("risk_band"),
                    "cull_risk_90d": safe_float(observation.get("cull_risk_90d")),
                    "milk_revenue_month": result.info.get("milk_revenue_month", 0.0),
                    "maintenance_cost_month": result.info.get("maintenance_cost_month", 0.0),
                    "health_risk_cost_month": result.info.get("health_risk_cost_month", 0.0),
                    "reproduction_risk_cost_month": result.info.get("reproduction_risk_cost_month", 0.0),
                    "expected_culling_risk_cost_month": result.info.get("expected_culling_risk_cost_month", 0.0),
                    "cull_sale_value": result.info.get("cull_sale_value", 0.0),
                    "replacement_cost": result.info.get("replacement_cost", 0.0),
                }
            )
            observation = result.observation
            info = result.info
            if result.terminated or result.truncated:
                episode_rows.append(
                    {
                        "policy": policy_name,
                        "episode_id": f"{policy_name}:{episode_idx + 1}",
                        "steps": step_idx + 1,
                        "total_reward": total_reward,
                        "terminal_reason": terminal_reason,
                        "cull_action_rate": cull_actions / float(step_idx + 1),
                        "initial_snapshot_id": initial["snapshot_id"],
                        "initial_canonical_animal_id": initial["canonical_animal_id"],
                    }
                )
                break
    return pd.DataFrame(trace_rows), pd.DataFrame(episode_rows)


def summarize_episodes(episodes: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for policy, group in episodes.groupby("policy"):
        terminal_counts = group["terminal_reason"].value_counts().to_dict()
        rows.append(
            {
                "policy": policy,
                "episodes": int(len(group)),
                "mean_total_reward": float(group["total_reward"].mean()),
                "median_total_reward": float(group["total_reward"].median()),
                "mean_steps": float(group["steps"].mean()),
                "median_steps": float(group["steps"].median()),
                "mean_cull_action_rate": float(group["cull_action_rate"].mean()),
                "agent_cull_episodes": int(terminal_counts.get("agent_cull", 0)),
                "observed_cull_episodes": int(terminal_counts.get("observed_cull_within_30d", 0)),
                "end_observation_episodes": int(terminal_counts.get("end_of_observation", 0)),
                "max_episode_episodes": int(terminal_counts.get("max_episode_length", 0)),
                "other_terminal_episodes": int(
                    len(group)
                    - terminal_counts.get("agent_cull", 0)
                    - terminal_counts.get("observed_cull_within_30d", 0)
                    - terminal_counts.get("end_of_observation", 0)
                    - terminal_counts.get("max_episode_length", 0)
                ),
            }
        )
    return pd.DataFrame(rows).sort_values("mean_total_reward", ascending=False)


def write_report(summary: pd.DataFrame, trace: pd.DataFrame, rules: dict[str, Any]) -> None:
    report_path = path_from_root(rules["output"]["cow_replacement_env_report_md"])
    lines = [
        "# CowReplacementEnv Smoke-Test Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Environment: `{rules['environment_name']}`",
        f"- State table: `{rules['output']['mdp_state_table_csv']}`",
        f"- Transition model: `{rules['output']['empirical_transition_model_csv']}`",
        f"- Reward scenario: `{rules['reward']['scenario_code']}`",
        "",
        "## Policy Summary",
        "",
        "| Policy | Episodes | Mean reward | Median reward | Mean steps | Cull action rate | Agent cull | Observed cull | End obs | Max len | Other |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in summary.to_dict("records"):
        lines.append(
            f"| `{row['policy']}` | {int(row['episodes'])} | {float(row['mean_total_reward']):.2f} | "
            f"{float(row['median_total_reward']):.2f} | {float(row['mean_steps']):.2f} | "
            f"{float(row['mean_cull_action_rate']):.4f} | {int(row['agent_cull_episodes'])} | "
            f"{int(row['observed_cull_episodes'])} | {int(row['end_observation_episodes'])} | "
            f"{int(row['max_episode_episodes'])} | {int(row['other_terminal_episodes'])} |"
        )

    reward_components = [
        "milk_revenue_month",
        "maintenance_cost_month",
        "health_risk_cost_month",
        "reproduction_risk_cost_month",
        "expected_culling_risk_cost_month",
    ]
    lines.extend(["", "## Average Step Reward Components", "", "| Policy | " + " | ".join(reward_components) + " |", "|---" + "|---:" * len(reward_components) + "|"])
    for policy, group in trace.groupby("policy"):
        values = [float(pd.to_numeric(group[column], errors="coerce").mean()) for column in reward_components]
        lines.append(f"| `{policy}` | " + " | ".join(f"{value:.2f}" for value in values) + " |")

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- This is a stochastic smoke-test, not a learned RL policy.",
            "- `action=1` is deterministic terminal culling.",
            "- `action=0` samples from empirical transition probabilities with configured fallback.",
            "- Episodes keep a stable `canonical_animal_id`; sampled model states expose `state_source_canonical_animal_id` for audit.",
            "- Reward values use the current prototype scenario. Replacement/cull-sale/treatment assumptions are not production-grade economics.",
            "- Policy ranking is sensitive to reward assumptions and should be treated as a pipeline sanity check.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    state_path = path_from_root(rules["output"]["mdp_state_table_csv"])
    transition_path = path_from_root(rules["output"]["empirical_transition_model_csv"])
    reward_path = path_from_root(rules["input"]["reward_baseline_csv"])
    if not state_path.exists():
        raise FileNotFoundError(state_path)
    if not transition_path.exists():
        raise FileNotFoundError(transition_path)
    if not reward_path.exists():
        raise FileNotFoundError(reward_path)

    state = pd.read_csv(state_path, low_memory=False)
    transition_model = pd.read_csv(transition_path, low_memory=False)
    rewards = load_reward_parameters(reward_path)
    env = CowReplacementEnv(
        state_table=state,
        transition_model=transition_model,
        rules=rules,
        reward_parameters=rewards,
        seed=int(rules["simulation"].get("random_seed", 42)),
    )
    initial_states = env.initial_states().head(int(rules["simulation"].get("max_episodes", 332))).copy()

    trace_frames: list[pd.DataFrame] = []
    episode_frames: list[pd.DataFrame] = []
    for policy_name, policy_rules in rules["simulation"]["policies"].items():
        if not policy_rules.get("enabled", False):
            continue
        trace, episodes = simulate_policy(policy_name, env, initial_states, rules)
        trace_frames.append(trace)
        episode_frames.append(episodes)

    trace_df = pd.concat(trace_frames, ignore_index=True)
    episodes_df = pd.concat(episode_frames, ignore_index=True)
    summary = summarize_episodes(episodes_df)

    results_path = path_from_root(rules["output"]["policy_simulation_results_csv"])
    trace_path = path_from_root(rules["output"]["policy_simulation_trace_csv"])
    results_path.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(results_path, index=False)
    trace_df.to_csv(trace_path, index=False)
    write_report(summary, trace_df, rules)

    print(f"wrote {results_path.relative_to(PROJECT_ROOT)} ({len(summary)} rows)")
    print(f"wrote {trace_path.relative_to(PROJECT_ROOT)} ({len(trace_df)} rows)")
    print(f"wrote {rules['output']['cow_replacement_env_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
