from __future__ import annotations

from datetime import datetime

import pandas as pd

from rl_mdp_utils import (
    PROJECT_ROOT,
    build_reward_table,
    load_state_and_reward_inputs,
    path_from_root,
    read_rules,
    solve_value_iteration,
)


def scenario_summary_row(
    scenario_name: str,
    scenario: dict,
    policy: pd.DataFrame,
    metadata: dict,
    baseline_policy: pd.DataFrame | None,
) -> dict:
    action_counts = policy["optimal_action"].value_counts().to_dict()
    row = {
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


def write_report(summary: pd.DataFrame, comparison: pd.DataFrame, rules: dict) -> None:
    report_path = path_from_root(rules["output"]["mdp_scenario_report_md"])
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

    changed = comparison[comparison["changed_vs_baseline"].eq(1)].copy()
    lines.extend(
        [
            "",
            "## Most Changed Scenarios",
            "",
            "| Scenario | Changed states | Cull->Keep | Keep->Cull |",
            "|---|---:|---:|---:|",
        ]
    )
    if changed.empty:
        lines.append("| - | 0 | 0 | 0 |")
    else:
        for scenario, group in changed.groupby("scenario"):
            cull_to_keep = int(
                group["baseline_action"].eq("cull").astype(int).mul(group["scenario_action"].eq("keep").astype(int)).sum()
            )
            keep_to_cull = int(
                group["baseline_action"].eq("keep").astype(int).mul(group["scenario_action"].eq("cull").astype(int)).sum()
            )
            lines.append(f"| `{scenario}` | {len(group)} | {cull_to_keep} | {keep_to_cull} |")

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Scenarios use the same empirical transition model; only reward parameters and discount factor change.",
            "- Policy sensitivity is a sanity check for reward assumptions, not final farm economics.",
            "- Large policy changes under price/cost perturbations mean reward calibration needs farm-specific review before real use.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    transition_path = path_from_root(rules["output"]["empirical_transition_model_csv"])
    if not transition_path.exists():
        raise FileNotFoundError(transition_path)
    transition_model = pd.read_csv(transition_path, low_memory=False)
    scenario_rules = rules["mdp"]["scenario_analysis"]["scenarios"]

    summaries = []
    comparisons = []
    baseline_policy: pd.DataFrame | None = None
    state, _ = load_state_and_reward_inputs(rules)
    for scenario_name, scenario in scenario_rules.items():
        _, parameters = load_state_and_reward_inputs(rules, scenario)
        reward_table = build_reward_table(state, rules, parameters, scenario_name=scenario_name)
        policy, metadata = solve_value_iteration(
            reward_table,
            transition_model,
            rules,
            discount_factor=float(scenario.get("discount_factor", rules["mdp"]["discount_factor"])),
        )
        if scenario_name == "baseline":
            baseline_policy = policy[["state_bucket_exact", "optimal_action"]].copy()

        summaries.append(scenario_summary_row(scenario_name, scenario, policy, metadata, baseline_policy))
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
            ].merge(
                baseline_policy,
                on="state_bucket_exact",
                how="left",
                suffixes=("_scenario", "_baseline"),
            )
            compare = compare.rename(
                columns={
                    "optimal_action_scenario": "scenario_action",
                    "optimal_action_baseline": "baseline_action",
                }
            )
            compare.insert(0, "scenario", scenario_name)
            compare["changed_vs_baseline"] = compare["scenario_action"].ne(compare["baseline_action"]).astype(int)
            comparisons.append(compare)

    summary_df = pd.DataFrame(summaries).sort_values("scenario")
    comparison_df = pd.concat(comparisons, ignore_index=True) if comparisons else pd.DataFrame()

    summary_path = path_from_root(rules["output"]["mdp_scenario_results_csv"])
    comparison_path = path_from_root(rules["output"]["mdp_scenario_policy_comparison_csv"])
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_df.to_csv(summary_path, index=False)
    comparison_df.to_csv(comparison_path, index=False)
    write_report(summary_df, comparison_df, rules)

    print(f"wrote {summary_path.relative_to(PROJECT_ROOT)} ({len(summary_df)} rows)")
    print(f"wrote {comparison_path.relative_to(PROJECT_ROOT)} ({len(comparison_df)} rows)")
    print(f"wrote {rules['output']['mdp_scenario_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
