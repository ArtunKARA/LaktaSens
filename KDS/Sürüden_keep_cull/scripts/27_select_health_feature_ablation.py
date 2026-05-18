from __future__ import annotations

import importlib.util
import json
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml
from joblib import dump
from sklearn.pipeline import Pipeline


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "baseline_model_payload_enriched_rules.yaml"
MODEL_DIR = PROJECT_ROOT / "data" / "processed" / "models" / "payload_enriched"
OUTPUT_DIR = MODEL_DIR / "health_feature_ablation"
ARTIFACT_DIR = PROJECT_ROOT / "Model" / "baseline_risk" / "payload_enriched_health_ablation"
REPORT_PATH = PROJECT_ROOT / "reports" / "phase_4_6_health_feature_ablation_report.md"

BASELINE_MODULE_PATH = PROJECT_ROOT / "scripts" / "12_train_baseline_risk_models.py"

HEALTH_AUX_FEATURES = [
    "has_marcenat_prev_health_summary",
    "marcenat_prev_lact_mastitis_count",
    "marcenat_prev_lact_lameness_count",
    "marcenat_prev_lact_other_health_count",
    "marcenat_prev_lact_health_total_count",
    "marcenat_prev_lact_cell_total",
    "marcenat_prev_lact_cell_total_source_p75_flag",
    "marcenat_prev_lact_tb_tp",
    "marcenat_prev_lact_tb_tp_less_pct",
    "marcenat_prev_lact_tb_tp_more_pct",
    "marcenat_prev_lact_completed_dim",
    "marcenat_prev_lact_days_since_dryoff",
    "marcenat_prev_lact_mastitis_any",
    "marcenat_prev_lact_lameness_any",
    "sensor_conductivity_available_30",
    "sensor_conductivity_available_90",
    "sensor_conductivity_high_30_train_p75_flag",
    "sensor_conductivity_high_90_train_p75_flag",
    "sensor_conductivity_rise_flag",
]

ABLATION_GROUPS = {
    "base_without_health_aux": [],
    "conductivity_only": [
        "sensor_conductivity_available_30",
        "sensor_conductivity_available_90",
        "sensor_conductivity_high_30_train_p75_flag",
        "sensor_conductivity_high_90_train_p75_flag",
        "sensor_conductivity_rise_flag",
    ],
    "marcenat_health_counts_only": [
        "has_marcenat_prev_health_summary",
        "marcenat_prev_lact_mastitis_count",
        "marcenat_prev_lact_lameness_count",
        "marcenat_prev_lact_other_health_count",
        "marcenat_prev_lact_health_total_count",
        "marcenat_prev_lact_days_since_dryoff",
        "marcenat_prev_lact_mastitis_any",
        "marcenat_prev_lact_lameness_any",
    ],
    "marcenat_scc_metabolic_only": [
        "has_marcenat_prev_health_summary",
        "marcenat_prev_lact_cell_total",
        "marcenat_prev_lact_cell_total_source_p75_flag",
        "marcenat_prev_lact_tb_tp",
        "marcenat_prev_lact_tb_tp_less_pct",
        "marcenat_prev_lact_tb_tp_more_pct",
        "marcenat_prev_lact_completed_dim",
        "marcenat_prev_lact_days_since_dryoff",
    ],
    "marcenat_all_health_aux": [
        feature for feature in HEALTH_AUX_FEATURES if feature.startswith("marcenat_") or feature == "has_marcenat_prev_health_summary"
    ],
    "all_health_aux": HEALTH_AUX_FEATURES,
}

FAST_SCAN_MODELS = {"logistic_regression"}
SECOND_STAGE_MODELS = {"catboost"}
TOP_ABLATIONS_FOR_SECOND_STAGE = 2


def load_baseline_module() -> Any:
    spec = importlib.util.spec_from_file_location("baseline_training", BASELINE_MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {BASELINE_MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_rules() -> dict[str, Any]:
    with RULES_PATH.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def available_features(features: list[str], df: pd.DataFrame) -> list[str]:
    return [feature for feature in features if feature in df.columns]


def previous_best(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    df = pd.read_csv(path)
    df = df[df["horizon_label"].eq("cull_within_90d")].copy()
    if df.empty:
        return None
    return df.sort_values("pr_auc", ascending=False).iloc[0].to_dict()


def safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float("nan")


def fmt(value: Any, digits: int = 6) -> str:
    number = safe_float(value)
    if np.isnan(number):
        return "-"
    return f"{number:.{digits}f}"


def write_report(
    metrics: pd.DataFrame,
    best_row: dict[str, Any],
    pre_primary: dict[str, Any] | None,
    current_primary: dict[str, Any] | None,
    selected_feature_count: int,
    skipped: list[dict[str, str]],
) -> None:
    lines = [
        "# Phase 4.6 Health Feature Ablation Selection",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Objective: find a source-agnostic 90-day culling risk candidate after health auxiliary tabularization.",
        "- Evaluation: `cull_within_90d`, no `source_code` categorical feature, time split from Faz 3.",
        "- Model search excludes Random Forest, XGBoost and full LightGBM scan for runtime. Logistic Regression scans all groups; CatBoost is tested only on top scan groups.",
        "",
        "## Selected Candidate",
        "",
        f"- Ablation: `{best_row['ablation_name']}`",
        f"- Model: `{best_row['model_name']}`",
        f"- PR-AUC: `{best_row['pr_auc']:.6f}`",
        f"- ROC-AUC: `{best_row['roc_auc']:.6f}`",
        f"- Recall: `{best_row['recall']:.6f}`",
        f"- Precision: `{best_row['precision']:.6f}`",
        f"- Feature count: `{selected_feature_count}`",
        "",
        "## Reference Comparison",
        "",
        "| Reference | Model | PR-AUC | ROC-AUC | Recall | Precision |",
        "|---|---|---:|---:|---:|---:|",
    ]
    if pre_primary:
        lines.append(
            f"| Pre-health primary source-including | `{pre_primary.get('model_name')}` | {fmt(pre_primary.get('pr_auc'))} | {fmt(pre_primary.get('roc_auc'))} | {fmt(pre_primary.get('recall'))} | {fmt(pre_primary.get('precision'))} |"
        )
    if current_primary:
        lines.append(
            f"| All-health primary source-including | `{current_primary.get('model_name')}` | {fmt(current_primary.get('pr_auc'))} | {fmt(current_primary.get('roc_auc'))} | {fmt(current_primary.get('recall'))} | {fmt(current_primary.get('precision'))} |"
        )
    lines.append(
        f"| Selected source-agnostic ablation | `{best_row['model_name']}` | {fmt(best_row.get('pr_auc'))} | {fmt(best_row.get('roc_auc'))} | {fmt(best_row.get('recall'))} | {fmt(best_row.get('precision'))} |"
    )

    lines.extend(
        [
            "",
            "## Ablation Metrics",
            "",
            "| Ablation | Model | Added health features | PR-AUC | ROC-AUC | F1 | Recall | Precision | Brier | ECE |",
            "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for row in metrics.sort_values("pr_auc", ascending=False).to_dict("records"):
        lines.append(
            f"| `{row['ablation_name']}` | `{row['model_name']}` | {int(row['added_health_feature_count'])} | "
            f"{row['pr_auc']:.4f} | {row['roc_auc']:.4f} | {row['f1']:.4f} | {row['recall']:.4f} | "
            f"{row['precision']:.4f} | {row['brier_score']:.4f} | {row['expected_calibration_error']:.4f} |"
        )

    if skipped:
        lines.extend(["", "## Skipped", ""])
        for row in skipped:
            lines.append(f"- `{row['model_name']}` in `{row['ablation_name']}`: {row['reason']}")

    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- This selected candidate is better aligned with source-agnostic transfer than the source-including primary baseline.",
            "- SCC/Chiozza/organic remain tabular auxiliary sources; they are not injected as negative culling labels.",
            "- For the next MDP smoke-test, use this selected source-agnostic candidate as the supervised risk input, while keeping the pre-health CatBoost result as a comparison baseline.",
        ]
    )
    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    baseline = load_baseline_module()
    rules = load_rules()
    model_ready = path_from_root(rules["input"]["model_ready_csv"])
    df = pd.read_csv(model_ready, low_memory=False)

    primary_target = "cull_within_90d"
    y = pd.to_numeric(df[primary_target], errors="coerce")
    valid_mask = y.isin([0, 1])
    train_mask, test_mask, split_policy, split_cutoff = baseline.positive_aware_time_split(df, y, rules, valid_mask)
    y_train = y.loc[train_mask].astype(int)
    y_test = y.loc[test_mask].astype(int)
    if y_train.nunique() < 2 or y_test.nunique() < 2:
        raise RuntimeError("Train/test split does not contain both classes for cull_within_90d.")

    base_numeric = [feature for feature in rules["features"]["numeric"] if feature not in HEALTH_AUX_FEATURES]
    no_source_categorical = rules["features"]["variants"]["no_source_code"]["categorical"]
    metrics_rows: list[dict[str, Any]] = []
    risk_score_frames: list[tuple[dict[str, Any], pd.DataFrame]] = []
    importance_frames: list[pd.DataFrame] = []
    skipped: list[dict[str, str]] = []
    best_pipeline: Pipeline | None = None
    best_row: dict[str, Any] | None = None
    best_numeric_features: list[str] = []
    best_categorical_features: list[str] = []

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    for ablation_name, added_group in ABLATION_GROUPS.items():
        added_features = available_features(added_group, df)
        numeric_features = available_features(base_numeric + added_features, df)
        categorical_features = available_features(no_source_categorical, df)
        feature_df = baseline.normalize_feature_frame(df, numeric_features, categorical_features)
        X_train = feature_df.loc[train_mask]
        X_test = feature_df.loc[test_mask]
        specs = [
            spec
            for spec in baseline.make_model_specs(rules, y_train)
            if spec["model_name"] in FAST_SCAN_MODELS
        ]
        enabled_names = {spec["model_name"] for spec in specs}
        for model_name in sorted(FAST_SCAN_MODELS - enabled_names):
            skipped.append(
                {
                    "ablation_name": ablation_name,
                    "model_name": model_name,
                    "reason": "optional dependency is not installed or disabled",
                }
            )

        for spec in specs:
            model_name = spec["model_name"]
            pipeline = Pipeline(
                [
                    (
                        "preprocessor",
                        baseline.make_preprocessor(numeric_features, categorical_features, bool(spec["scale_numeric"])),
                    ),
                    ("model", spec["estimator"]),
                ]
            )
            pipeline.fit(X_train, y_train)
            train_prob = pipeline.predict_proba(X_train)[:, 1]
            test_prob = pipeline.predict_proba(X_test)[:, 1]
            metric = baseline.evaluate(
                y_train.to_numpy(),
                train_prob,
                y_test.to_numpy(),
                test_prob,
                int(rules["evaluation"].get("calibration_bins", 10)),
            )
            row = {
                "ablation_name": ablation_name,
                "model_name": model_name,
                "target": primary_target,
                "split_policy_used": split_policy,
                "split_cutoff_date": split_cutoff,
                "train_rows": int(len(y_train)),
                "test_rows": int(len(y_test)),
                "train_positive": int(y_train.sum()),
                "test_positive": int(y_test.sum()),
                "numeric_feature_count": int(len(numeric_features)),
                "categorical_feature_count": int(len(categorical_features)),
                "added_health_feature_count": int(len(added_features)),
                "added_health_features": ",".join(added_features),
                **metric,
            }
            metrics_rows.append(row)
            importance = baseline.get_feature_importance(pipeline, model_name, primary_target)
            importance["ablation_name"] = ablation_name
            importance_frames.append(importance)

            score_frame = df.loc[test_mask, ["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih"]].copy()
            score_frame["ablation_name"] = ablation_name
            score_frame["model_name"] = model_name
            score_frame["label"] = y_test.to_numpy()
            score_frame["risk_score"] = test_prob
            score_frame["threshold"] = metric["threshold"]
            score_frame["predicted_label"] = (test_prob >= metric["threshold"]).astype(int)
            risk_score_frames.append((row, score_frame))

            if best_row is None or row["pr_auc"] > best_row["pr_auc"]:
                best_row = row
                best_pipeline = pipeline
                best_numeric_features = numeric_features
                best_categorical_features = categorical_features
            print(f"scan {ablation_name} {model_name} pr_auc={row['pr_auc']:.6f}", flush=True)

    stage1_metrics = pd.DataFrame(metrics_rows)
    top_ablation_names = set(
        stage1_metrics.sort_values("pr_auc", ascending=False)
        .head(TOP_ABLATIONS_FOR_SECOND_STAGE)["ablation_name"]
        .tolist()
    )
    top_ablation_names.add("all_health_aux")

    for ablation_name, added_group in ABLATION_GROUPS.items():
        if ablation_name not in top_ablation_names:
            continue
        added_features = available_features(added_group, df)
        numeric_features = available_features(base_numeric + added_features, df)
        categorical_features = available_features(no_source_categorical, df)
        feature_df = baseline.normalize_feature_frame(df, numeric_features, categorical_features)
        X_train = feature_df.loc[train_mask]
        X_test = feature_df.loc[test_mask]
        specs = [
            spec
            for spec in baseline.make_model_specs(rules, y_train)
            if spec["model_name"] in SECOND_STAGE_MODELS
        ]
        enabled_names = {spec["model_name"] for spec in specs}
        for model_name in sorted(SECOND_STAGE_MODELS - enabled_names):
            skipped.append(
                {
                    "ablation_name": ablation_name,
                    "model_name": model_name,
                    "reason": "optional dependency is not installed or disabled",
                }
            )

        for spec in specs:
            model_name = spec["model_name"]
            pipeline = Pipeline(
                [
                    (
                        "preprocessor",
                        baseline.make_preprocessor(numeric_features, categorical_features, bool(spec["scale_numeric"])),
                    ),
                    ("model", spec["estimator"]),
                ]
            )
            pipeline.fit(X_train, y_train)
            train_prob = pipeline.predict_proba(X_train)[:, 1]
            test_prob = pipeline.predict_proba(X_test)[:, 1]
            metric = baseline.evaluate(
                y_train.to_numpy(),
                train_prob,
                y_test.to_numpy(),
                test_prob,
                int(rules["evaluation"].get("calibration_bins", 10)),
            )
            row = {
                "ablation_name": ablation_name,
                "model_name": model_name,
                "target": primary_target,
                "split_policy_used": split_policy,
                "split_cutoff_date": split_cutoff,
                "train_rows": int(len(y_train)),
                "test_rows": int(len(y_test)),
                "train_positive": int(y_train.sum()),
                "test_positive": int(y_test.sum()),
                "numeric_feature_count": int(len(numeric_features)),
                "categorical_feature_count": int(len(categorical_features)),
                "added_health_feature_count": int(len(added_features)),
                "added_health_features": ",".join(added_features),
                **metric,
            }
            metrics_rows.append(row)
            importance = baseline.get_feature_importance(pipeline, model_name, primary_target)
            importance["ablation_name"] = ablation_name
            importance_frames.append(importance)

            score_frame = df.loc[test_mask, ["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih"]].copy()
            score_frame["ablation_name"] = ablation_name
            score_frame["model_name"] = model_name
            score_frame["label"] = y_test.to_numpy()
            score_frame["risk_score"] = test_prob
            score_frame["threshold"] = metric["threshold"]
            score_frame["predicted_label"] = (test_prob >= metric["threshold"]).astype(int)
            risk_score_frames.append((row, score_frame))

            if best_row is None or row["pr_auc"] > best_row["pr_auc"]:
                best_row = row
                best_pipeline = pipeline
                best_numeric_features = numeric_features
                best_categorical_features = categorical_features
            print(f"catboost {ablation_name} {model_name} pr_auc={row['pr_auc']:.6f}", flush=True)

    if best_row is None or best_pipeline is None:
        raise RuntimeError("No ablation model was trained.")

    metrics = pd.DataFrame(metrics_rows).sort_values("pr_auc", ascending=False)
    metrics_path = OUTPUT_DIR / "health_feature_ablation_metrics.csv"
    metrics.to_csv(metrics_path, index=False)
    importance_df = pd.concat(importance_frames, ignore_index=True)
    importance_path = OUTPUT_DIR / "health_feature_ablation_feature_importance.csv"
    importance_df.to_csv(importance_path, index=False)
    selected_scores = [
        scores
        for row, scores in risk_score_frames
        if row["ablation_name"] == best_row["ablation_name"] and row["model_name"] == best_row["model_name"]
    ][0]
    score_path = OUTPUT_DIR / "selected_source_agnostic_risk_scores.csv"
    selected_scores.to_csv(score_path, index=False)

    artifact_path = ARTIFACT_DIR / f"{best_row['ablation_name']}_{best_row['model_name']}_{primary_target}.joblib"
    dump(best_pipeline, artifact_path)
    metadata = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "best_row": best_row,
        "artifact_path": str(artifact_path.relative_to(PROJECT_ROOT)),
        "numeric_features": best_numeric_features,
        "categorical_features": best_categorical_features,
    }
    metadata_path = OUTPUT_DIR / "selected_source_agnostic_model_metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    write_report(
        metrics=metrics,
        best_row=best_row,
        pre_primary=previous_best(MODEL_DIR / "pre_health_auxiliary" / "baseline_model_metrics.csv"),
        current_primary=previous_best(MODEL_DIR / "baseline_model_metrics.csv"),
        selected_feature_count=len(best_numeric_features) + len(best_categorical_features),
        skipped=skipped,
    )

    print(f"wrote {metrics_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {score_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {metadata_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    print(
        f"best_ablation={best_row['ablation_name']} model={best_row['model_name']} "
        f"pr_auc={best_row['pr_auc']:.6f}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
