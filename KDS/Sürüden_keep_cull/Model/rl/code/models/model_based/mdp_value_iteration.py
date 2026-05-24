from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

from models.base import ModelRunSpec
from models.common import (
    build_reward_table,
    direct_result,
    evaluate_policy_row,
    load_state_and_reward_inputs,
    load_tabular_mdp,
    policy_probabilities_from_actions,
    project_path,
    solve_value_iteration,
    update_rl_algorithm_outputs,
)
from training_environment import CommandResult, RLTrainingEnvironment


def write_reward_report(reward_table: pd.DataFrame, env: RLTrainingEnvironment, rules: dict[str, Any]) -> None:
    report_path = project_path(env, rules["output"]["mdp_reward_report_md"])
    keep = reward_table[reward_table["action_name"].eq("keep")].copy()
    cull = reward_table[reward_table["action_name"].eq("cull")].copy()
    merged = keep[["state_bucket_exact", "reward"]].merge(
        cull[["state_bucket_exact", "reward"]],
        on="state_bucket_exact",
        suffixes=("_keep", "_cull"),
    )
    merged["immediate_reward_margin_cull_minus_keep"] = merged["reward_cull"] - merged["reward_keep"]
    lines = [
        "# MDP Reward Table Review",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Output: `{rules['output']['mdp_reward_table_csv']}`",
        f"- Scenario: `{rules['reward']['scenario_code']}`",
        "",
        "## Size",
        "",
        f"- State-action rows: `{len(reward_table)}`",
        f"- States: `{reward_table['state_bucket_exact'].nunique()}`",
        "",
        "## Immediate Reward Summary",
        "",
        "| Metric | Keep | Cull | Cull - Keep margin |",
        "|---|---:|---:|---:|",
        f"| Mean | {keep['reward'].mean():.2f} | {cull['reward'].mean():.2f} | {merged['immediate_reward_margin_cull_minus_keep'].mean():.2f} |",
        f"| Median | {keep['reward'].median():.2f} | {cull['reward'].median():.2f} | {merged['immediate_reward_margin_cull_minus_keep'].median():.2f} |",
        f"| Min | {keep['reward'].min():.2f} | {cull['reward'].min():.2f} | {merged['immediate_reward_margin_cull_minus_keep'].min():.2f} |",
        f"| Max | {keep['reward'].max():.2f} | {cull['reward'].max():.2f} | {merged['immediate_reward_margin_cull_minus_keep'].max():.2f} |",
        "",
        "## Notes",
        "",
        "- Reward is state-action immediate reward; future value is handled by value iteration.",
        "- Cull reward is constant in this first prototype because replacement and cull sale values are scenario parameters.",
    ]
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_policy_report(policy: pd.DataFrame, metadata: dict[str, Any], env: RLTrainingEnvironment, rules: dict[str, Any]) -> None:
    report_path = project_path(env, rules["output"]["mdp_policy_report_md"])
    action_counts = policy["optimal_action"].value_counts().to_dict()
    fallback_counts = policy["transition_fallback_used"].value_counts().to_dict()
    top_cull = policy.sort_values("action_margin_cull_minus_keep", ascending=False).head(10)
    top_keep = policy.sort_values("action_margin_cull_minus_keep", ascending=True).head(10)
    lines = [
        "# MDP Policy Decision Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Method: `value_iteration`",
        f"- Discount factor: `{metadata['discount_factor']}`",
        f"- Iterations: `{metadata['iterations']}`",
        f"- Final delta: `{metadata['final_delta']:.8f}`",
        f"- Converged: `{metadata['converged']}`",
        "",
        "## Outputs",
        "",
        f"- Value/action table: `{rules['output']['mdp_value_iteration_result_csv']}`",
        f"- Optimal policy table: `{rules['output']['optimal_policy_table_csv']}`",
        "",
        "## Policy Counts",
        "",
        f"- Keep states: `{int(action_counts.get('keep', 0))}`",
        f"- Cull states: `{int(action_counts.get('cull', 0))}`",
        f"- Total states: `{len(policy)}`",
        "",
        "## Transition Fallback Usage",
        "",
        "| Fallback | States |",
        "|---|---:|",
    ]
    for fallback, count in sorted(fallback_counts.items()):
        lines.append(f"| `{fallback}` | {int(count)} |")
    lines.extend(["", "## Strongest Cull States", "", "| State | Margin cull-keep | Q keep | Q cull | Support | Risk band | Milk band | Health band |", "|---|---:|---:|---:|---:|---|---|---|"])
    for row in top_cull.to_dict("records"):
        lines.append(
            f"| `{row['state_bucket_exact']}` | {row['action_margin_cull_minus_keep']:.2f} | {row['q_keep']:.2f} | "
            f"{row['q_cull']:.2f} | {int(row['transition_support'])} | `{row['risk_band']}` | `{row['milk_level_band']}` | `{row['health_risk_band']}` |"
        )
    lines.extend(["", "## Strongest Keep States", "", "| State | Margin cull-keep | Q keep | Q cull | Support | Risk band | Milk band | Health band |", "|---|---:|---:|---:|---:|---|---|---|"])
    for row in top_keep.to_dict("records"):
        lines.append(
            f"| `{row['state_bucket_exact']}` | {row['action_margin_cull_minus_keep']:.2f} | {row['q_keep']:.2f} | "
            f"{row['q_cull']:.2f} | {int(row['transition_support'])} | `{row['risk_band']}` | `{row['milk_level_band']}` | `{row['health_risk_band']}` |"
        )
    lines.extend(["", "## Notes", "", "- Keep action future value uses empirical transition probabilities and configured fallback."])
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def scenario_summary_row(
    scenario_name: str,
    scenario: dict[str, Any],
    policy: pd.DataFrame,
    metadata: dict[str, Any],
    baseline_policy: pd.DataFrame | None,
) -> dict[str, Any]:
    action_counts = policy["optimal_action"].value_counts().to_dict()
    row: dict[str, Any] = {
        "scenario": scenario_name,
        "description": scenario.get("description", ""),
        "discount_factor": metadata["discount_factor"],
        "iterations": metadata["iterations"],
        "converged": metadata["converged"],
        "states": int(len(policy)),
        "keep_states": int(action_counts.get("keep", 0)),
        "cull_states": int(action_counts.get("cull", 0)),
        "cull_state_rate": float(action_counts.get("cull", 0) / len(policy)) if len(policy) else 0.0,
        "mean_state_value": float(policy["state_value"].mean()),
        "median_state_value": float(policy["state_value"].median()),
        "mean_action_margin_cull_minus_keep": float(policy["action_margin_cull_minus_keep"].mean()),
    }
    if baseline_policy is not None:
        compare = policy[["state_bucket_exact", "optimal_action"]].merge(
            baseline_policy[["state_bucket_exact", "optimal_action"]],
            on="state_bucket_exact",
            how="left",
            suffixes=("", "_baseline"),
        )
        row["changed_states_vs_baseline"] = int(compare["optimal_action"].ne(compare["optimal_action_baseline"]).sum())
        row["changed_state_rate_vs_baseline"] = float(row["changed_states_vs_baseline"] / len(compare)) if len(compare) else 0.0
    else:
        row["changed_states_vs_baseline"] = 0
        row["changed_state_rate_vs_baseline"] = 0.0
    return row


def write_scenario_report(summary: pd.DataFrame, comparison: pd.DataFrame, env: RLTrainingEnvironment, rules: dict[str, Any]) -> None:
    report_path = project_path(env, rules["output"]["mdp_scenario_report_md"])
    lines = [
        "# MDP Scenario Analysis Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Scenario results: `{rules['output']['mdp_scenario_results_csv']}`",
        f"- Policy comparison: `{rules['output']['mdp_scenario_policy_comparison_csv']}`",
        "",
        "## Scenario Summary",
        "",
        "| Scenario | Description | Gamma | Keep states | Cull states | Cull rate | Changed vs baseline | Mean V |",
        "|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for row in summary.to_dict("records"):
        lines.append(
            f"| `{row['scenario']}` | {row['description']} | {float(row['discount_factor']):.2f} | "
            f"{int(row['keep_states'])} | {int(row['cull_states'])} | {float(row['cull_state_rate']):.4f} | "
            f"{int(row['changed_states_vs_baseline'])} | {float(row['mean_state_value']):.2f} |"
        )
    changed = comparison[comparison["changed_vs_baseline"].eq(1)].copy() if not comparison.empty else comparison
    lines.extend(["", "## Most Changed Scenarios", "", "| Scenario | Changed states | Cull->Keep | Keep->Cull |", "|---|---:|---:|---:|"])
    if changed.empty:
        lines.append("| - | 0 | 0 | 0 |")
    else:
        for scenario, group in changed.groupby("scenario"):
            cull_to_keep = int(group["baseline_action"].eq("cull").astype(int).mul(group["scenario_action"].eq("keep").astype(int)).sum())
            keep_to_cull = int(group["baseline_action"].eq("keep").astype(int).mul(group["scenario_action"].eq("cull").astype(int)).sum())
            lines.append(f"| `{scenario}` | {len(group)} | {cull_to_keep} | {keep_to_cull} |")
    lines.extend(["", "## Notes", "", "- Scenarios use the same empirical transition model; only reward parameters and discount factor change."])
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def run(env: RLTrainingEnvironment, default_python: str, sb3_python: str | None, check: bool) -> list[CommandResult]:
    rules = env.load_config()
    state, parameters = load_state_and_reward_inputs(env, rules)
    reward_table = build_reward_table(state, rules, parameters, scenario_name="baseline")
    reward_path = project_path(env, rules["output"]["mdp_reward_table_csv"])
    reward_path.parent.mkdir(parents=True, exist_ok=True)
    reward_table.to_csv(reward_path, index=False)
    write_reward_report(reward_table, env, rules)

    transition_path = project_path(env, rules["output"]["empirical_transition_model_csv"])
    if not transition_path.exists():
        raise FileNotFoundError(transition_path)
    transition_model = pd.read_csv(transition_path, low_memory=False)
    result, metadata = solve_value_iteration(reward_table, transition_model, rules)

    result_path = project_path(env, rules["output"]["mdp_value_iteration_result_csv"])
    policy_path = project_path(env, rules["output"]["optimal_policy_table_csv"])
    result_path.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(result_path, index=False)
    policy_columns = [
        "state_bucket_exact",
        "optimal_action",
        "state_value",
        "q_keep",
        "q_cull",
        "action_margin_cull_minus_keep",
        "transition_fallback_used",
        "transition_support",
        "state_support",
        "laktasyon_evresi",
        "parite_grup",
        "dim_band",
        "milk_level_band",
        "milk_trend_band",
        "health_risk_band",
        "risk_band",
    ]
    result[policy_columns].to_csv(policy_path, index=False)
    write_policy_report(result, metadata, env, rules)
    mdp = load_tabular_mdp(env, rules, transition_model=transition_model)
    mdp_actions = result.set_index("state_bucket_exact").loc[mdp.states, "optimal_action"].map({"keep": 0, "cull": 1}).to_numpy()
    reference_row, reference_policy = evaluate_policy_row(
        "model_based_mdp_value_iteration",
        "model_based_exact",
        mdp,
        policy_probabilities_from_actions(mdp_actions),
        mdp_actions,
        rules,
        "Reference policy from direct value iteration model.",
    )
    update_rl_algorithm_outputs(env, rules, [reference_row], [reference_policy])

    summaries: list[dict[str, Any]] = []
    comparisons: list[pd.DataFrame] = []
    baseline_policy: pd.DataFrame | None = None
    scenario_rules = rules["mdp"]["scenario_analysis"]["scenarios"]
    for scenario_name, scenario in scenario_rules.items():
        _, scenario_parameters = load_state_and_reward_inputs(env, rules, scenario)
        scenario_reward = build_reward_table(state, rules, scenario_parameters, scenario_name=scenario_name)
        policy, scenario_metadata = solve_value_iteration(
            scenario_reward,
            transition_model,
            rules,
            discount_factor=float(scenario.get("discount_factor", rules["mdp"]["discount_factor"])),
        )
        if scenario_name == "baseline":
            baseline_policy = policy[["state_bucket_exact", "optimal_action"]].copy()
        summaries.append(scenario_summary_row(scenario_name, scenario, policy, scenario_metadata, baseline_policy))
        if baseline_policy is not None:
            compare = policy[
                [
                    "state_bucket_exact",
                    "optimal_action",
                    "state_value",
                    "q_keep",
                    "q_cull",
                    "action_margin_cull_minus_keep",
                    "risk_band",
                    "milk_level_band",
                    "health_risk_band",
                ]
            ].merge(baseline_policy, on="state_bucket_exact", how="left", suffixes=("_scenario", "_baseline"))
            compare = compare.rename(
                columns={"optimal_action_scenario": "scenario_action", "optimal_action_baseline": "baseline_action"}
            )
            compare.insert(0, "scenario", scenario_name)
            compare["changed_vs_baseline"] = compare["scenario_action"].ne(compare["baseline_action"]).astype(int)
            comparisons.append(compare)
    summary_df = pd.DataFrame(summaries).sort_values("scenario")
    comparison_df = pd.concat(comparisons, ignore_index=True) if comparisons else pd.DataFrame()
    summary_path = project_path(env, rules["output"]["mdp_scenario_results_csv"])
    comparison_path = project_path(env, rules["output"]["mdp_scenario_policy_comparison_csv"])
    summary_df.to_csv(summary_path, index=False)
    comparison_df.to_csv(comparison_path, index=False)
    write_scenario_report(summary_df, comparison_df, env, rules)

    action_counts = result["optimal_action"].value_counts().to_dict()
    return direct_result(
        "mdp_value_iteration",
        stdout=(
            f"wrote {reward_path.relative_to(env.project_root)} ({len(reward_table)} rows)\n"
            f"wrote {policy_path.relative_to(env.project_root)} ({len(result)} states)\n"
            f"wrote {summary_path.relative_to(env.project_root)} ({len(summary_df)} scenarios)\n"
            f"keep={int(action_counts.get('keep', 0))} cull={int(action_counts.get('cull', 0))}"
        ),
    )


def definition() -> ModelRunSpec:
    return ModelRunSpec(
        key="mdp_value_iteration",
        display_name="Model-Based MDP Value Iteration",
        family="model_based_mdp",
        description="Build reward table, solve value iteration, and run scenario sensitivity.",
        runner=run,
        notes="Current reference policy solver; implemented directly in this model file.",
    )
