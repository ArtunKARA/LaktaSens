from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "rl_env_rules.yaml"


def read_rules(path: Path = RULES_PATH) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def outcome_columns_for_bucket(bucket_column: str) -> tuple[str, str]:
    if bucket_column == "global":
        return "global", "next_state_bucket_exact"
    suffix = bucket_column.replace("state_bucket_", "")
    next_column = f"next_state_bucket_{suffix}"
    if suffix in {"no_risk", "stage_parity"}:
        # Keep exact next bucket too so the simulator can land on a concrete state.
        next_column = "next_state_bucket_exact"
    return bucket_column, next_column


def build_level_model(keep: pd.DataFrame, bucket_column: str) -> pd.DataFrame:
    current_column, next_column = outcome_columns_for_bucket(bucket_column)
    local = keep.copy()
    if current_column == "global":
        local["current_bucket"] = "global"
    else:
        local["current_bucket"] = local[current_column].fillna("unknown").astype(str)
    local["outcome_type"] = local["terminal"].map(lambda value: "terminal" if int(value) == 1 else "next_state")
    local["outcome_state_bucket_exact"] = ""
    local.loc[local["outcome_type"].eq("next_state"), "outcome_state_bucket_exact"] = (
        local.loc[local["outcome_type"].eq("next_state"), next_column].fillna("").astype(str)
    )
    local["outcome_terminal_reason"] = ""
    local.loc[local["outcome_type"].eq("terminal"), "outcome_terminal_reason"] = (
        local.loc[local["outcome_type"].eq("terminal"), "terminal_reason"].fillna("unknown").astype(str)
    )

    group_cols = ["current_bucket", "outcome_type", "outcome_state_bucket_exact", "outcome_terminal_reason"]
    counts = local.groupby(group_cols, dropna=False).size().reset_index(name="count")
    totals = local.groupby("current_bucket", dropna=False).size().reset_index(name="total_count")
    out = counts.merge(totals, on="current_bucket", how="left")
    out["probability"] = out["count"] / out["total_count"]
    out.insert(0, "bucket_column", bucket_column)
    out.insert(0, "bucket_level", bucket_column.replace("state_bucket_", ""))
    out.insert(2, "action", 0)
    out.insert(3, "action_name", "keep")
    return out.sort_values(["bucket_level", "current_bucket", "probability"], ascending=[True, True, False])


def build_transition_model(transitions: pd.DataFrame, rules: dict[str, Any]) -> pd.DataFrame:
    keep = transitions[transitions["action_name"].eq("keep")].copy()
    keep["terminal"] = pd.to_numeric(keep["terminal"], errors="coerce").fillna(0).astype(int)
    frames = []
    for bucket_column in rules["transition"]["fallback_order"]:
        frames.append(build_level_model(keep, bucket_column))

    cull_row = pd.DataFrame(
        [
            {
                "bucket_level": "global",
                "bucket_column": "global",
                "action": 1,
                "action_name": "cull",
                "current_bucket": "global",
                "outcome_type": "terminal",
                "outcome_state_bucket_exact": "",
                "outcome_terminal_reason": "agent_cull",
                "count": int((transitions["action_name"] == "cull").sum()),
                "total_count": int((transitions["action_name"] == "cull").sum()),
                "probability": 1.0,
            }
        ]
    )
    return pd.concat(frames + [cull_row], ignore_index=True)


def build_fallback_model(model: pd.DataFrame) -> pd.DataFrame:
    keep_model = model[model["action_name"].eq("keep")].copy()
    rows = []
    for (bucket_level, bucket_column, current_bucket), group in keep_model.groupby(
        ["bucket_level", "bucket_column", "current_bucket"], dropna=False
    ):
        terminal_probability = float(group.loc[group["outcome_type"].eq("terminal"), "probability"].sum())
        rows.append(
            {
                "bucket_level": bucket_level,
                "bucket_column": bucket_column,
                "current_bucket": current_bucket,
                "total_count": int(group["total_count"].max()),
                "outcome_count": int(len(group)),
                "next_state_outcome_count": int(group["outcome_type"].eq("next_state").sum()),
                "terminal_outcome_count": int(group["outcome_type"].eq("terminal").sum()),
                "terminal_probability": terminal_probability,
                "max_outcome_probability": float(group["probability"].max()),
            }
        )
    return pd.DataFrame(rows).sort_values(["bucket_level", "total_count"], ascending=[True, False])


def write_report(model: pd.DataFrame, fallback: pd.DataFrame, transitions: pd.DataFrame, rules: dict[str, Any]) -> None:
    report_path = path_from_root(rules["output"]["empirical_transition_report_md"])
    keep_model = model[model["action_name"].eq("keep")].copy()
    lines = [
        "# Empirical Transition Model Review",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Input: `{rules['output']['mdp_transition_dataset_csv']}`",
        f"- Model output: `{rules['output']['empirical_transition_model_csv']}`",
        f"- Fallback output: `{rules['output']['transition_fallback_model_csv']}`",
        "",
        "## Size",
        "",
        f"- Transition input rows: `{len(transitions)}`",
        f"- Probability rows: `{len(model)}`",
        f"- Fallback states: `{len(fallback)}`",
        "",
        "## Bucket-Level Coverage",
        "",
        "| Bucket level | Current buckets | Probability rows | Median support | Singleton buckets | Mean terminal probability |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for bucket_level, group in fallback.groupby("bucket_level", dropna=False):
        lines.append(
            f"| `{bucket_level}` | {int(group['current_bucket'].nunique())} | "
            f"{int((keep_model['bucket_level'] == bucket_level).sum())} | "
            f"{float(group['total_count'].median()):.2f} | {int((group['total_count'] == 1).sum())} | "
            f"{float(group['terminal_probability'].mean()):.4f} |"
        )

    lines.extend(
        [
            "",
            "## Deterministic Cull Action",
            "",
            "- `action=1` is represented as a global deterministic terminal transition with `terminal_reason=agent_cull`.",
            "- Observed data only estimates `action=0` keep transitions.",
            "",
            "## Fallback Order",
            "",
        ]
    )
    for idx, bucket_column in enumerate(rules["transition"]["fallback_order"], start=1):
        lines.append(f"{idx}. `{bucket_column}`")

    lines.extend(
        [
            "",
            "## Next Step",
            "",
            "`scripts/30_simulate_cow_replacement_env.py` uses this transition model to run baseline policy smoke-tests with reward decomposition.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    transition_path = path_from_root(rules["output"]["mdp_transition_dataset_csv"])
    if not transition_path.exists():
        raise FileNotFoundError(transition_path)
    transitions = pd.read_csv(transition_path, low_memory=False)
    model = build_transition_model(transitions, rules)
    fallback = build_fallback_model(model)

    model_path = path_from_root(rules["output"]["empirical_transition_model_csv"])
    fallback_path = path_from_root(rules["output"]["transition_fallback_model_csv"])
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model.to_csv(model_path, index=False)
    fallback.to_csv(fallback_path, index=False)
    write_report(model, fallback, transitions, rules)

    print(f"wrote {model_path.relative_to(PROJECT_ROOT)} ({len(model)} rows)")
    print(f"wrote {fallback_path.relative_to(PROJECT_ROOT)} ({len(fallback)} rows)")
    print(f"wrote {rules['output']['empirical_transition_report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
