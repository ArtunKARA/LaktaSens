from __future__ import annotations

from datetime import datetime

import pandas as pd

from rl_mdp_utils import PROJECT_ROOT, build_reward_table, load_state_and_reward_inputs, path_from_root, read_rules


def write_report(reward_table: pd.DataFrame, rules: dict) -> None:
    report_path = path_from_root(rules["output"]["mdp_reward_report_md"])
    keep = reward_table[reward_table["action_name"].eq("keep")].copy()
    cull = reward_table[reward_table["action_name"].eq("cull")].copy()
    merged = keep[["state_bucket_exact", "reward"]].merge(
        cull[["state_bucket_exact", "reward"]],
        on="state_bucket_exact",
        suffixes=("_keep", "_cull"),
    )
    merged["immediate_reward_margin_cull_minus_keep"] = merged["reward_cull"] - merged["reward_keep"]
    component_cols = [
        "milk_revenue_month",
        "maintenance_cost_month",
        "health_risk_cost_month",
        "reproduction_risk_cost_month",
        "expected_culling_risk_cost_month",
    ]
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
        "## Mean Keep Reward Components",
        "",
        "| Component | Mean |",
        "|---|---:|",
    ]
    for col in component_cols:
        lines.append(f"| `{col}` | {keep[col].mean():.2f} |")
    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Reward is state-action immediate reward; future value is handled by value iteration.",
            "- Cull reward is constant in this first prototype because replacement and cull sale values are scenario parameters.",
            "- Economics are prototype assumptions, not production-grade farm economics.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    state, parameters = load_state_and_reward_inputs(rules)
    reward_table = build_reward_table(state, rules, parameters, scenario_name="baseline")
    output_path = path_from_root(rules["output"]["mdp_reward_table_csv"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    reward_table.to_csv(output_path, index=False)
    write_report(reward_table, rules)
    print(f"wrote {output_path.relative_to(PROJECT_ROOT)} ({len(reward_table)} rows)")
    print(f"wrote {rules['output']['mdp_reward_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
