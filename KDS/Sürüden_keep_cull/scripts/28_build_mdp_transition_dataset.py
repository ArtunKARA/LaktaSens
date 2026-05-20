from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml
from joblib import load


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "rl_env_rules.yaml"


def read_rules(path: Path = RULES_PATH) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def numeric_series(df: pd.DataFrame, column: str, default: float = np.nan) -> pd.Series:
    if column not in df:
        return pd.Series(default, index=df.index, dtype="float64")
    values = df[column].replace({"true": 1, "false": 0, "True": 1, "False": 0, True: 1, False: 0})
    return pd.to_numeric(values, errors="coerce")


def first_non_null(df: pd.DataFrame, columns: list[str]) -> tuple[pd.Series, pd.Series]:
    values = pd.Series(np.nan, index=df.index, dtype="float64")
    source = pd.Series("missing", index=df.index, dtype="object")
    for column in columns:
        candidate = numeric_series(df, column)
        mask = values.isna() & candidate.notna()
        values.loc[mask] = candidate.loc[mask]
        source.loc[mask] = column
    return values, source


def normalize_for_model(df: pd.DataFrame, numeric_features: list[str], categorical_features: list[str]) -> pd.DataFrame:
    columns_data: dict[str, pd.Series] = {}
    for column in numeric_features:
        columns_data[column] = numeric_series(df, column)
    for column in categorical_features:
        if column not in df:
            columns_data[column] = pd.Series("unknown", index=df.index, dtype="object")
        else:
            values = df[column].fillna("unknown").astype(str)
            columns_data[column] = values.replace({"": "unknown", "nan": "unknown", "None": "unknown"})
    frame = pd.DataFrame(columns_data, index=df.index)
    return frame[numeric_features + categorical_features]


def score_full_snapshot(df: pd.DataFrame, rules: dict[str, Any]) -> tuple[pd.Series, str]:
    metadata_path = path_from_root(rules["input"]["selected_risk_model_metadata_json"])
    scores_path = path_from_root(rules["input"]["selected_risk_scores_csv"])
    if metadata_path.exists() and rules["risk_score"].get("use_model_artifact_for_full_snapshot_scoring", True):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        artifact_path = path_from_root(metadata["artifact_path"])
        if artifact_path.exists():
            pipeline = load(artifact_path)
            numeric_features = metadata.get("numeric_features", [])
            categorical_features = metadata.get("categorical_features", [])
            model_frame = normalize_for_model(df, numeric_features, categorical_features)
            probabilities = pipeline.predict_proba(model_frame)[:, 1]
            return pd.Series(probabilities, index=df.index, dtype="float64"), f"model_artifact:{artifact_path.relative_to(PROJECT_ROOT)}"

    if scores_path.exists():
        scores = pd.read_csv(scores_path, low_memory=False)
        merged = df[["snapshot_id"]].merge(scores[["snapshot_id", "risk_score"]], on="snapshot_id", how="left")
        risk = pd.to_numeric(merged["risk_score"], errors="coerce")
        return risk.fillna(float(risk.median() if risk.notna().any() else 0.0)), f"partial_score_file:{scores_path.relative_to(PROJECT_ROOT)}"
    return pd.Series(0.0, index=df.index, dtype="float64"), "constant_zero_fallback"


def assign_band(values: pd.Series, spec: dict[str, Any], unknown_label: str = "unknown") -> pd.Series:
    labels = spec["labels"]
    bins = spec["bins"]
    band = pd.cut(values, bins=bins, labels=labels, include_lowest=True, right=False)
    return band.astype("object").where(band.notna(), unknown_label).astype(str)


def build_state_buckets(df: pd.DataFrame, rules: dict[str, Any]) -> pd.DataFrame:
    out = df.copy()
    bucket_specs = rules["transition"]["state_bucket_columns"]
    for bucket_name, columns in bucket_specs.items():
        out[f"state_bucket_{bucket_name}"] = out[columns].astype(str).agg("|".join, axis=1)
    return out


def make_state_table(snapshots: pd.DataFrame, rules: dict[str, Any]) -> tuple[pd.DataFrame, str]:
    state = snapshots.copy()
    state["referans_tarih"] = pd.to_datetime(state["referans_tarih"], errors="coerce")
    for date_col in ["observation_start", "observation_end", "first_cull_date"]:
        if date_col in state:
            state[date_col] = pd.to_datetime(state[date_col], errors="coerce")

    milk_values, milk_source = first_non_null(state, rules["milk"]["daily_milk_priority"])
    trend_values, trend_source = first_non_null(state, rules["milk"]["trend_priority"])
    group_cols = [col for col in rules["milk"]["imputation_group_columns"] if col in state.columns]
    if group_cols:
        group_median = state.assign(_milk=milk_values).groupby(group_cols)["_milk"].transform("median")
        milk_values = milk_values.fillna(group_median)
        milk_source = milk_source.where(milk_source.ne("missing") | group_median.isna(), "group_median")
    milk_values = milk_values.fillna(float(milk_values.median() if milk_values.notna().any() else 0.0))
    milk_source = milk_source.where(milk_source.ne("missing"), "global_median")

    state["daily_milk_kg"] = milk_values.clip(lower=0)
    state["daily_milk_source"] = milk_source
    state["milk_trend"] = trend_values.fillna(0.0)
    state["milk_trend_source"] = trend_source.where(trend_source.ne("missing"), "zero_imputed")
    state["cell_risk_flag"] = numeric_series(state, "marcenat_prev_lact_cell_total_source_p75_flag").fillna(0).clip(0, 1)

    risk_90d, risk_source = score_full_snapshot(state, rules)
    state["cull_risk_90d"] = risk_90d.clip(lower=0, upper=1)
    state["cull_risk_30d"] = 1 - np.power(1 - state["cull_risk_90d"], 1 / 3)
    state["risk_score_source"] = risk_source

    state["health_risk_score"] = (
        numeric_series(state, "health_count_90").fillna(0)
        + 2 * numeric_series(state, "mastitis_flag").fillna(0)
        + 2 * numeric_series(state, "lameness_flag").fillna(0)
        + 2 * state["cell_risk_flag"].fillna(0)
    )

    discretization = rules["discretization"]
    state["dim_band"] = assign_band(numeric_series(state, "dim"), discretization["dim_band"])
    state["milk_level_band"] = assign_band(state["daily_milk_kg"], discretization["milk_level_band"])
    state["milk_trend_band"] = assign_band(state["milk_trend"], discretization["milk_trend_band"])
    state["health_risk_band"] = assign_band(state["health_risk_score"], discretization["health_risk_band"])
    state["risk_band"] = assign_band(state["cull_risk_90d"], discretization["risk_band"])
    for column in ["laktasyon_evresi", "parite_grup"]:
        if column not in state:
            state[column] = "unknown"
        state[column] = state[column].fillna("unknown").astype(str).replace({"": "unknown", "nan": "unknown"})

    state = build_state_buckets(state, rules)

    keep_columns = list(dict.fromkeys(
        rules["state"]["metadata_columns"]
        + rules["state"]["numeric_columns"]
        + rules["state"]["categorical_columns"]
        + [
            "daily_milk_source",
            "milk_trend_source",
            "health_risk_score",
            "risk_score_source",
            "state_bucket_exact",
            "state_bucket_no_risk",
            "state_bucket_stage_parity",
            "cull_within_30d",
            "label_30d_observed",
        ]
    ))
    keep_columns = [column for column in keep_columns if column in state.columns]
    return state[keep_columns].sort_values(["canonical_animal_id", "referans_tarih"]).reset_index(drop=True), risk_source


def build_transitions(state: pd.DataFrame, rules: dict[str, Any]) -> pd.DataFrame:
    transitions: list[dict[str, Any]] = []
    min_gap = int(rules["time"]["min_next_snapshot_gap_days"])
    max_gap = int(rules["time"]["max_next_snapshot_gap_days"])
    cull_label_col = rules["transition"]["cull_terminal_label_column"]
    cull_observed_col = rules["transition"]["cull_terminal_observed_column"]

    state = state.sort_values(["canonical_animal_id", "referans_tarih"]).reset_index(drop=True)
    for _, group in state.groupby("canonical_animal_id", sort=False):
        group = group.sort_values("referans_tarih").reset_index(drop=True)
        for idx, row in group.iterrows():
            next_row = group.iloc[idx + 1] if idx + 1 < len(group) else None
            cull_label = pd.to_numeric(pd.Series([row.get(cull_label_col)]), errors="coerce").iloc[0]
            cull_observed = pd.to_numeric(pd.Series([row.get(cull_observed_col)]), errors="coerce").iloc[0]
            observed_cull_terminal = bool(cull_observed == 1 and cull_label == 1)

            next_valid = False
            month_gap_days = np.nan
            terminal = False
            terminal_reason = "next_snapshot"
            if observed_cull_terminal:
                terminal = True
                terminal_reason = "observed_cull_within_30d"
            elif next_row is not None:
                month_gap_days = int((next_row["referans_tarih"] - row["referans_tarih"]).days)
                if min_gap <= month_gap_days <= max_gap:
                    next_valid = True
                else:
                    terminal = True
                    terminal_reason = "observation_gap"
            else:
                terminal = True
                terminal_reason = "end_of_observation"

            base = {
                "transition_id": f"transition:{len(transitions) + 1}",
                "snapshot_id": row["snapshot_id"],
                "source_code": row.get("source_code"),
                "canonical_animal_id": row["canonical_animal_id"],
                "referans_tarih": row["referans_tarih"].date().isoformat(),
                "split": row.get("split"),
                "state_bucket_exact": row["state_bucket_exact"],
                "state_bucket_no_risk": row["state_bucket_no_risk"],
                "state_bucket_stage_parity": row["state_bucket_stage_parity"],
                "cull_risk_90d": row.get("cull_risk_90d"),
                "cull_risk_30d": row.get("cull_risk_30d"),
                "risk_band": row.get("risk_band"),
            }
            transitions.append(
                {
                    **base,
                    "action": 0,
                    "action_name": "keep",
                    "next_snapshot_id": next_row["snapshot_id"] if next_valid else "",
                    "next_referans_tarih": next_row["referans_tarih"].date().isoformat() if next_valid else "",
                    "next_state_bucket_exact": next_row["state_bucket_exact"] if next_valid else "",
                    "next_state_bucket_no_risk": next_row["state_bucket_no_risk"] if next_valid else "",
                    "next_state_bucket_stage_parity": next_row["state_bucket_stage_parity"] if next_valid else "",
                    "month_gap_days": month_gap_days,
                    "terminal": int(terminal),
                    "terminal_reason": terminal_reason if terminal else "non_terminal",
                    "observed_cull_terminal": int(observed_cull_terminal),
                }
            )
            if rules["transition"].get("include_deterministic_cull_action_rows", True):
                transitions.append(
                    {
                        **base,
                        "transition_id": f"transition:{len(transitions) + 1}",
                        "action": 1,
                        "action_name": "cull",
                        "next_snapshot_id": "",
                        "next_referans_tarih": "",
                        "next_state_bucket_exact": "",
                        "next_state_bucket_no_risk": "",
                        "next_state_bucket_stage_parity": "",
                        "month_gap_days": np.nan,
                        "terminal": 1,
                        "terminal_reason": "agent_cull",
                        "observed_cull_terminal": 0,
                    }
                )
    return pd.DataFrame(transitions)


def transition_summary(transitions: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for keys, group in transitions.groupby(["action_name", "terminal_reason"], dropna=False):
        action_name, terminal_reason = keys
        rows.append(
            {
                "action_name": action_name,
                "terminal_reason": terminal_reason or "non_terminal",
                "rows": int(len(group)),
                "terminal_rate": float(pd.to_numeric(group["terminal"], errors="coerce").mean()),
                "observed_cull_terminal_rows": int(pd.to_numeric(group["observed_cull_terminal"], errors="coerce").sum()),
            }
        )
    return pd.DataFrame(rows).sort_values(["action_name", "terminal_reason"])


def state_bucket_summary(state: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for bucket_col in ["state_bucket_exact", "state_bucket_no_risk", "state_bucket_stage_parity"]:
        counts = state[bucket_col].value_counts(dropna=False)
        rows.append(
            {
                "bucket_column": bucket_col,
                "unique_buckets": int(counts.size),
                "max_rows_per_bucket": int(counts.max()) if not counts.empty else 0,
                "median_rows_per_bucket": float(counts.median()) if not counts.empty else 0.0,
                "singleton_buckets": int((counts == 1).sum()),
            }
        )
    return pd.DataFrame(rows)


def write_report(
    state: pd.DataFrame,
    transitions: pd.DataFrame,
    summary: pd.DataFrame,
    bucket_summary: pd.DataFrame,
    risk_source: str,
    rules: dict[str, Any],
) -> None:
    report_path = path_from_root(rules["output"]["report_md"])
    animals = int(state["canonical_animal_id"].nunique())
    keep = transitions[transitions["action_name"].eq("keep")].copy()
    keep_terminal_rate = float(pd.to_numeric(keep["terminal"], errors="coerce").mean()) if not keep.empty else 0.0
    observed_cull_rows = int(pd.to_numeric(keep["observed_cull_terminal"], errors="coerce").sum()) if not keep.empty else 0
    lines = [
        "# MDP Transition Dataset Review",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Environment: `{rules['environment_name']}`",
        f"- Snapshot input: `{rules['input']['snapshot_csv']}`",
        f"- Risk score source: `{risk_source}`",
        "",
        "## Outputs",
        "",
        f"- State table: `{rules['output']['mdp_state_table_csv']}`",
        f"- Transition dataset: `{rules['output']['mdp_transition_dataset_csv']}`",
        f"- Transition summary: `{rules['output']['mdp_transition_summary_csv']}`",
        f"- State bucket summary: `{rules['output']['mdp_state_bucket_summary_csv']}`",
        "",
        "## Size",
        "",
        f"- State rows: `{len(state)}`",
        f"- Animals: `{animals}`",
        f"- Transition rows: `{len(transitions)}`",
        f"- Keep transition rows: `{len(keep)}`",
        f"- Keep terminal rate: `{keep_terminal_rate:.4f}`",
        f"- Observed cull terminal rows: `{observed_cull_rows}`",
        "",
        "## Transition Terminal Summary",
        "",
        "| Action | Terminal reason | Rows | Terminal rate | Observed cull terminals |",
        "|---|---|---:|---:|---:|",
    ]
    for row in summary.to_dict("records"):
        lines.append(
            f"| `{row['action_name']}` | `{row['terminal_reason']}` | {int(row['rows'])} | "
            f"{float(row['terminal_rate']):.4f} | {int(row['observed_cull_terminal_rows'])} |"
        )

    lines.extend(["", "## State Bucket Summary", "", "| Bucket | Unique | Max rows | Median rows | Singleton buckets |", "|---|---:|---:|---:|---:|"])
    for row in bucket_summary.to_dict("records"):
        lines.append(
            f"| `{row['bucket_column']}` | {int(row['unique_buckets'])} | {int(row['max_rows_per_bucket'])} | "
            f"{float(row['median_rows_per_bucket']):.2f} | {int(row['singleton_buckets'])} |"
        )

    lines.extend(
        [
            "",
            "## Leakage Guard",
            "",
            "- `source_code`, IDs, dates, culling labels and culling reason fields are metadata, not observation features.",
            "- Risk scores are produced by the selected source-agnostic CatBoost artifact; `source_code` is not a model feature.",
            "- `action=1` cull transitions are deterministic synthetic action rows; observed data only informs `action=0` keep transitions.",
            "- Reward is not calculated in this script. Reward parameters are referenced through config for the next environment simulation step.",
            "",
            "## Next Step",
            "",
            "`scripts/29_build_empirical_transition_model.py` should aggregate this dataset into transition probability tables using the configured fallback order.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    rules = read_rules()
    output_dir = path_from_root(rules["output"]["rl_processed_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    snapshot_path = path_from_root(rules["input"]["snapshot_csv"])
    if not snapshot_path.exists():
        raise FileNotFoundError(snapshot_path)
    snapshots = pd.read_csv(snapshot_path, low_memory=False)

    state, risk_source = make_state_table(snapshots, rules)
    transitions = build_transitions(state, rules)
    summary = transition_summary(transitions)
    buckets = state_bucket_summary(state)

    state_path = path_from_root(rules["output"]["mdp_state_table_csv"])
    transition_path = path_from_root(rules["output"]["mdp_transition_dataset_csv"])
    summary_path = path_from_root(rules["output"]["mdp_transition_summary_csv"])
    bucket_path = path_from_root(rules["output"]["mdp_state_bucket_summary_csv"])

    state.to_csv(state_path, index=False)
    transitions.to_csv(transition_path, index=False)
    summary.to_csv(summary_path, index=False)
    buckets.to_csv(bucket_path, index=False)
    write_report(state, transitions, summary, buckets, risk_source, rules)

    print(f"wrote {state_path.relative_to(PROJECT_ROOT)} ({len(state)} rows)")
    print(f"wrote {transition_path.relative_to(PROJECT_ROOT)} ({len(transitions)} rows)")
    print(f"wrote {summary_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {bucket_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {rules['output']['report_md']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
