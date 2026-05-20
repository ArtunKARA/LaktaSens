from __future__ import annotations

from datetime import datetime

import pandas as pd

from rl_mdp_utils import PROJECT_ROOT, path_from_root, read_rules, solve_value_iteration


def write_report(policy: pd.DataFrame, metadata: dict, rules: dict) -> None:
    report_path = path_from_root(rules["output"]["mdp_policy_report_md"])
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

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Terminal value is zero; cull reward is immediate sale value minus replacement cost.",
            "- Keep action future value uses empirical transition probabilities and configured fallback.",
            "- This is a model-based MDP solution over discretized state buckets, not a production policy.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    reward_path = path_from_root(rules["output"]["mdp_reward_table_csv"])
    transition_path = path_from_root(rules["output"]["empirical_transition_model_csv"])
    if not reward_path.exists():
        raise FileNotFoundError(reward_path)
    if not transition_path.exists():
        raise FileNotFoundError(transition_path)

    reward_table = pd.read_csv(reward_path, low_memory=False)
    transition_model = pd.read_csv(transition_path, low_memory=False)
    result, metadata = solve_value_iteration(reward_table, transition_model, rules)

    result_path = path_from_root(rules["output"]["mdp_value_iteration_result_csv"])
    policy_path = path_from_root(rules["output"]["optimal_policy_table_csv"])
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
    write_report(result, metadata, rules)

    print(f"wrote {result_path.relative_to(PROJECT_ROOT)} ({len(result)} rows)")
    print(f"wrote {policy_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {rules['output']['mdp_policy_report_md']}")
    print(
        f"states={len(result)} keep={(result['optimal_action']=='keep').sum()} "
        f"cull={(result['optimal_action']=='cull').sum()} iterations={metadata['iterations']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
