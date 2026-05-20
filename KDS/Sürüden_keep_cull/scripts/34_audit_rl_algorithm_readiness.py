from __future__ import annotations

from datetime import datetime
from importlib.util import find_spec

import pandas as pd

from rl_mdp_utils import PROJECT_ROOT, path_from_root, read_rules


def package_available(name: str) -> bool:
    return find_spec(name) is not None


def audit_context(rules: dict) -> dict:
    transition_path = path_from_root(rules["output"]["mdp_transition_dataset_csv"])
    state_path = path_from_root(rules["output"]["mdp_state_table_csv"])
    empirical_path = path_from_root(rules["output"]["empirical_transition_model_csv"])
    policy_path = path_from_root(rules["output"]["optimal_policy_table_csv"])

    context = {
        "state_rows": 0,
        "transition_rows": 0,
        "empirical_transition_rows": 0,
        "policy_rows": 0,
        "keep_rows": 0,
        "generated_cull_rows": 0,
        "observed_cull_terminal_rows": 0,
        "logged_action_rows": 0,
        "action_space": "discrete_keep_cull",
        "has_simulator_inputs": False,
        "has_real_logged_actions": False,
    }
    if state_path.exists():
        state = pd.read_csv(state_path, low_memory=False)
        context["state_rows"] = int(len(state))
    if transition_path.exists():
        transitions = pd.read_csv(transition_path, low_memory=False)
        context["transition_rows"] = int(len(transitions))
        context["keep_rows"] = int(transitions["action_name"].eq("keep").sum()) if "action_name" in transitions else 0
        context["generated_cull_rows"] = int(transitions["terminal_reason"].eq("agent_cull").sum()) if "terminal_reason" in transitions else 0
        context["observed_cull_terminal_rows"] = (
            int(pd.to_numeric(transitions.get("observed_cull_terminal", 0), errors="coerce").fillna(0).sum())
            if len(transitions)
            else 0
        )
        context["logged_action_rows"] = 0
        context["has_real_logged_actions"] = False
    if empirical_path.exists():
        empirical = pd.read_csv(empirical_path, low_memory=False)
        context["empirical_transition_rows"] = int(len(empirical))
    if policy_path.exists():
        policy = pd.read_csv(policy_path, low_memory=False)
        context["policy_rows"] = int(len(policy))

    context["has_simulator_inputs"] = all(
        [
            context["state_rows"] > 0,
            context["empirical_transition_rows"] > 0,
            context["policy_rows"] > 0,
        ]
    )
    return context


def build_readiness_rows(rules: dict, context: dict) -> list[dict]:
    sklearn_ok = package_available("sklearn")
    rows = [
        {
            "algorithm": "model_based_mdp_value_iteration",
            "family": "model_based_mdp",
            "eligible_now": context["has_simulator_inputs"],
            "run_status": "ready",
            "production_valid": False,
            "reason": "Empirical transition model and reward table exist; output remains prototype policy.",
            "recommended_use": "Primary current benchmark.",
        },
        {
            "algorithm": "tabular_q_learning",
            "family": "online_rl_on_simulator",
            "eligible_now": context["has_simulator_inputs"],
            "run_status": "ready",
            "production_valid": False,
            "reason": "Can train on the empirical simulator; useful as sanity benchmark, not as farm policy.",
            "recommended_use": "Simulator benchmark.",
        },
        {
            "algorithm": "tabular_ppo_smoke",
            "family": "policy_gradient_on_simulator",
            "eligible_now": context["has_simulator_inputs"],
            "run_status": "ready",
            "production_valid": False,
            "reason": "Can run a tabular PPO-style smoke test on the simulator without external RL dependencies.",
            "recommended_use": "Simulator benchmark only.",
        },
        {
            "algorithm": "dqn_style_fitted_q_mlp",
            "family": "value_rl_on_simulator",
            "eligible_now": context["has_simulator_inputs"] and sklearn_ok,
            "run_status": "ready" if sklearn_ok else "blocked",
            "production_valid": False,
            "reason": "Uses sklearn MLP fitted Q-iteration as a DQN-style approximation; not a full replay-buffer DQN.",
            "recommended_use": "Approximate simulator benchmark.",
        },
        {
            "algorithm": "ppo_stable_baselines",
            "family": "policy_gradient_on_simulator",
            "eligible_now": False,
            "run_status": "deferred",
            "production_valid": False,
            "reason": "Needs a stable Gymnasium wrapper and dependency decision; current tabular PPO smoke covers this phase.",
            "recommended_use": "Later, after simulator API stabilizes.",
        },
        {
            "algorithm": "cql",
            "family": "offline_rl",
            "eligible_now": False,
            "run_status": "not_eligible",
            "production_valid": False,
            "reason": "Real logged keep/cull actions and behavior-policy support are missing; generated cull rows are not logged actions.",
            "recommended_use": "Eligibility-only until logged action data exists.",
        },
        {
            "algorithm": "iql",
            "family": "offline_rl",
            "eligible_now": False,
            "run_status": "not_eligible",
            "production_valid": False,
            "reason": "Offline trajectory data with real actions is missing.",
            "recommended_use": "Eligibility-only until logged action data exists.",
        },
        {
            "algorithm": "bcq",
            "family": "offline_rl",
            "eligible_now": False,
            "run_status": "not_eligible",
            "production_valid": False,
            "reason": "Behavior policy/action support cannot be estimated without real logged actions.",
            "recommended_use": "Eligibility-only until logged action data exists.",
        },
        {
            "algorithm": "td3",
            "family": "continuous_action_rl",
            "eligible_now": False,
            "run_status": "not_applicable",
            "production_valid": False,
            "reason": "Current action space is discrete: 0=keep, 1=cull.",
            "recommended_use": "Only relevant if future action space becomes continuous.",
        },
        {
            "algorithm": "sac",
            "family": "continuous_action_rl",
            "eligible_now": False,
            "run_status": "not_applicable",
            "production_valid": False,
            "reason": "Current action space is discrete: 0=keep, 1=cull.",
            "recommended_use": "Only relevant if future action space becomes continuous.",
        },
    ]
    return rows


def write_report(readiness: pd.DataFrame, context: dict, rules: dict) -> None:
    report_path = path_from_root(rules["output"]["rl_algorithm_readiness_report_md"])
    lines = [
        "# RL Algorithm Readiness Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Output: `{rules['output']['rl_algorithm_readiness_csv']}`",
        "",
        "## Data Context",
        "",
        f"- State rows: `{context['state_rows']}`",
        f"- Transition rows: `{context['transition_rows']}`",
        f"- Empirical transition rows: `{context['empirical_transition_rows']}`",
        f"- Policy rows: `{context['policy_rows']}`",
        f"- Keep transition rows: `{context['keep_rows']}`",
        f"- Generated cull rows: `{context['generated_cull_rows']}`",
        f"- Observed cull terminal rows: `{context['observed_cull_terminal_rows']}`",
        f"- Real logged action rows: `{context['logged_action_rows']}`",
        "",
        "## Algorithm Eligibility",
        "",
        "| Algorithm | Family | Eligible now | Status | Production valid | Recommended use | Reason |",
        "|---|---|---:|---|---:|---|---|",
    ]
    for row in readiness.to_dict("records"):
        lines.append(
            f"| `{row['algorithm']}` | `{row['family']}` | {bool(row['eligible_now'])} | "
            f"`{row['run_status']}` | {bool(row['production_valid'])} | {row['recommended_use']} | {row['reason']} |"
        )
    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- Current valid core remains model-based MDP value iteration.",
            "- Q-learning, tabular PPO smoke, and DQN-style fitted Q can be used as simulator benchmarks.",
            "- CQL/IQL/BCQ are not valid yet because real logged actions are absent.",
            "- TD3/SAC are not applicable while action space is discrete keep/cull.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    context = audit_context(rules)
    readiness = pd.DataFrame(build_readiness_rows(rules, context))
    output_path = path_from_root(rules["output"]["rl_algorithm_readiness_csv"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    readiness.to_csv(output_path, index=False)
    write_report(readiness, context, rules)
    print(f"wrote {output_path.relative_to(PROJECT_ROOT)} ({len(readiness)} rows)")
    print(f"wrote {rules['output']['rl_algorithm_readiness_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
