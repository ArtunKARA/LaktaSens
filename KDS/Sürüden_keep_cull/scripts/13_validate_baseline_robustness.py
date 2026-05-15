from __future__ import annotations

import importlib.util
import json
import math
import warnings
import argparse
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from joblib import dump
from sklearn.pipeline import Pipeline


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRAIN_SCRIPT = PROJECT_ROOT / "scripts" / "12_train_baseline_risk_models.py"

warnings.filterwarnings("ignore", message="Skipping features without any observed values.*")
warnings.filterwarnings("ignore", message="X does not have valid feature names.*")


def load_train_module() -> Any:
    spec = importlib.util.spec_from_file_location("baseline_train_module", TRAIN_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {TRAIN_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BT = load_train_module()


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def binary_class_ok(y: pd.Series) -> bool:
    return y.dropna().astype(int).nunique() >= 2


def source_holdout_splits(df: pd.DataFrame, y: pd.Series, valid_mask: pd.Series) -> list[tuple[str, pd.Series, pd.Series]]:
    splits: list[tuple[str, pd.Series, pd.Series]] = []
    for source_code, source_frame in df.loc[valid_mask].groupby("source_code"):
        source_index = source_frame.index
        test_mask = pd.Series(False, index=df.index)
        test_mask.loc[source_index] = True
        test_mask &= valid_mask
        train_mask = valid_mask & ~test_mask
        if not binary_class_ok(y.loc[train_mask]) or not binary_class_ok(y.loc[test_mask]):
            continue
        if int(y.loc[test_mask].sum()) == 0:
            continue
        splits.append((f"source_holdout:{source_code}", train_mask, test_mask))
    return splits


def train_and_score(
    rules: dict[str, Any],
    df: pd.DataFrame,
    feature_df: pd.DataFrame,
    numeric_features: list[str],
    categorical_features: list[str],
    target_label: str,
    horizon_days: int,
    validation_policy: str,
    split_cutoff_date: str,
    train_mask: pd.Series,
    test_mask: pd.Series,
) -> tuple[list[dict[str, Any]], list[pd.DataFrame], Pipeline | None, dict[str, Any] | None]:
    y = pd.to_numeric(df[target_label], errors="coerce")
    y_train = y.loc[train_mask].astype(int)
    y_test = y.loc[test_mask].astype(int)
    if not binary_class_ok(y_train) or not binary_class_ok(y_test):
        return [], [], None, None

    X_train = feature_df.loc[train_mask]
    X_test = feature_df.loc[test_mask]
    metrics_rows: list[dict[str, Any]] = []
    importance_frames: list[pd.DataFrame] = []
    best_pipeline: Pipeline | None = None
    best_row: dict[str, Any] | None = None
    specs = BT.make_model_specs(rules, y_train)
    calibration_bins = int(rules["evaluation"].get("calibration_bins", 10))
    for spec in specs:
        model_name = spec["model_name"]
        pipeline = Pipeline(
            [
                (
                    "preprocessor",
                    BT.make_preprocessor(numeric_features, categorical_features, bool(spec["scale_numeric"])),
                ),
                ("model", spec["estimator"]),
            ]
        )
        pipeline.fit(X_train, y_train)
        train_prob = pipeline.predict_proba(X_train)[:, 1]
        test_prob = pipeline.predict_proba(X_test)[:, 1]
        metric_values = BT.evaluate(
            y_train.to_numpy(),
            train_prob,
            y_test.to_numpy(),
            test_prob,
            calibration_bins,
        )
        metric_row = {
            "feature_variant": "no_source_code",
            "horizon_label": target_label,
            "horizon_days": horizon_days,
            "model_name": model_name,
            "validation_policy": validation_policy,
            "split_cutoff_date": split_cutoff_date,
            "train_rows": int(len(y_train)),
            "test_rows": int(len(y_test)),
            "train_positive": int(y_train.sum()),
            "test_positive": int(y_test.sum()),
            "train_positive_rate": float(y_train.mean()),
            "test_positive_rate": float(y_test.mean()),
            **metric_values,
        }
        metrics_rows.append(metric_row)
        importance_frames.append(BT.get_feature_importance(pipeline, model_name, target_label))
        is_time_validation = not validation_policy.startswith("source_holdout:")
        if target_label == rules["targets"]["primary_target"] and is_time_validation:
            if best_row is None or metric_row[rules["evaluation"]["selection_metric"]] > best_row[rules["evaluation"]["selection_metric"]]:
                best_row = metric_row
                best_pipeline = pipeline
    return metrics_rows, importance_frames, best_pipeline, best_row


def write_report(rules: dict[str, Any], metrics_df: pd.DataFrame, previous_metrics: pd.DataFrame | None, best_row: dict[str, Any]) -> None:
    path = path_from_root(rules["output"]["robustness_report_md"])
    path.parent.mkdir(parents=True, exist_ok=True)
    primary = rules["targets"]["primary_target"]
    lines = [
        "# Baseline Robustness Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Purpose: check whether baseline performance depends on `source_code` shortcut signal.",
        "- Feature variant: `no_source_code`",
        f"- Primary target: `{primary}`",
        "",
        "## Best No-Source Time Baseline",
        "",
        f"- Model: `{best_row['model_name']}`",
        f"- PR-AUC: `{best_row['pr_auc']:.6f}`",
        f"- ROC-AUC: `{best_row['roc_auc']:.6f}`",
        f"- F1: `{best_row['f1']:.6f}`",
        f"- Recall: `{best_row['recall']:.6f}`",
        f"- Precision: `{best_row['precision']:.6f}`",
        "",
    ]

    if previous_metrics is not None and not previous_metrics.empty:
        prev_primary = previous_metrics[
            (previous_metrics["horizon_label"] == primary)
            & (previous_metrics["model_name"] == "logistic_regression")
        ]
        if not prev_primary.empty:
            prev_best = prev_primary.sort_values("pr_auc", ascending=False).iloc[0]
            delta = float(best_row["pr_auc"]) - float(prev_best["pr_auc"])
            lines.extend(
                [
                    "## With vs Without Source Code",
                    "",
                    f"- Previous with-source Logistic Regression PR-AUC: `{prev_best['pr_auc']:.6f}`",
                    f"- Current no-source best PR-AUC: `{best_row['pr_auc']:.6f}`",
                    f"- Delta: `{delta:.6f}`",
                    "",
                ]
            )

    lines.extend(
        [
            "## Metrics",
            "",
            "| Validation | Target | Model | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |",
            "|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for row in metrics_df.sort_values(
        ["validation_policy", "horizon_days", "pr_auc"],
        ascending=[True, True, False],
    ).to_dict("records"):
        lines.append(
            f"| `{row['validation_policy']}` | `{row['horizon_label']}` | `{row['model_name']}` | `{row['split_cutoff_date'] or '-'}` | "
            f"{int(row['train_positive'])} | {int(row['test_positive'])} | "
            f"{row['roc_auc']:.4f} | {row['pr_auc']:.4f} | {row['f1']:.4f} | {row['recall']:.4f} | "
            f"{row['precision']:.4f} | {row['brier_score']:.4f} | {row['expected_calibration_error']:.4f} |"
        )

    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "- If no-source performance drops sharply, the previous model was mostly using dataset identity.",
            "- Source-holdout validation is the harsher test: it asks whether a model trained on other datasets transfers to a held-out culling-positive source.",
            "- These results should guide feature engineering before MDP/RL work, not be treated as a final production model.",
            "",
            "## Decision",
            "",
            "- Time-split signal still exists after removing `source_code`, but calibration and precision are weak.",
            "- Source-holdout transfer is poor when primary-horizon holdout models have low or zero recall at the train-selected threshold.",
            "- Do not use the current risk model as a policy component yet. Before MDP/RL integration, add source-agnostic validation, improve labels for sources with no culling positives, and engineer more comparable animal-level features.",
        ]
    )
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate baseline model robustness without source_code.")
    parser.add_argument("--rules", default=str(BT.RULES_PATH), help="Path to baseline model rules YAML.")
    args = parser.parse_args()
    rules_path = Path(args.rules)
    if not rules_path.is_absolute():
        rules_path = PROJECT_ROOT / rules_path
    rules = BT.load_rules(rules_path)
    df = pd.read_csv(path_from_root(rules["input"]["model_ready_csv"]), low_memory=False)
    numeric_features = rules["features"]["numeric"]
    categorical_features = (
        rules.get("features", {})
        .get("variants", {})
        .get("no_source_code", {})
        .get("categorical", [])
    )
    feature_df = BT.normalize_feature_frame(df, numeric_features, categorical_features)

    all_metrics: list[dict[str, Any]] = []
    all_importance: list[pd.DataFrame] = []
    best_pipeline: Pipeline | None = None
    best_row: dict[str, Any] | None = None

    for target in rules["targets"]["horizons"]:
        label = target["label"]
        horizon_days = int(target["horizon_days"])
        y = pd.to_numeric(df[label], errors="coerce")
        valid_mask = y.isin([0, 1])
        train_mask, test_mask, split_policy, cutoff = BT.positive_aware_time_split(df, y, rules, valid_mask)
        metrics_rows, importance_frames, candidate_pipeline, candidate_best = train_and_score(
            rules,
            df,
            feature_df,
            numeric_features,
            categorical_features,
            label,
            horizon_days,
            split_policy,
            cutoff,
            train_mask,
            test_mask,
        )
        all_metrics.extend(metrics_rows)
        all_importance.extend(importance_frames)
        if candidate_best is not None and candidate_pipeline is not None:
            if best_row is None or candidate_best[rules["evaluation"]["selection_metric"]] > best_row[rules["evaluation"]["selection_metric"]]:
                best_row = candidate_best
                best_pipeline = candidate_pipeline

        for validation_policy, holdout_train, holdout_test in source_holdout_splits(df, y, valid_mask):
            metrics_rows, importance_frames, _, _ = train_and_score(
                rules,
                df,
                feature_df,
                numeric_features,
                categorical_features,
                label,
                horizon_days,
                validation_policy,
                "",
                holdout_train,
                holdout_test,
            )
            all_metrics.extend(metrics_rows)
            all_importance.extend(importance_frames)

    if not all_metrics or best_row is None or best_pipeline is None:
        raise RuntimeError("No robustness model could be trained.")

    metrics_df = pd.DataFrame(all_metrics)
    metrics_path = path_from_root(rules["output"]["robustness_metrics_csv"])
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_df.to_csv(metrics_path, index=False)

    importance_df = pd.concat(all_importance, ignore_index=True)
    importance_path = path_from_root(rules["output"]["robustness_feature_importance_csv"])
    importance_df.to_csv(importance_path, index=False)

    artifact_dir = path_from_root(rules["output"]["model_artifact_dir"])
    artifact_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = artifact_dir / f"{best_row['model_name']}_no_source_{best_row['horizon_label']}.joblib"
    dump(best_pipeline, artifact_path)

    metadata = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "best_no_source_model": best_row,
        "artifact_path": str(artifact_path.relative_to(PROJECT_ROOT)),
        "feature_variant": "no_source_code",
        "feature_columns": {"numeric": numeric_features, "categorical": []},
        "rules_path": str(rules_path.relative_to(PROJECT_ROOT)),
    }
    metadata_path = path_from_root(rules["output"]["robustness_metadata_json"])
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")

    previous_path = path_from_root(rules["output"]["metrics_csv"])
    previous_metrics = pd.read_csv(previous_path) if previous_path.exists() else None
    write_report(rules, metrics_df, previous_metrics, best_row)

    print(f"wrote {metrics_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {importance_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {metadata_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {rules['output']['robustness_report_md']}")
    print(
        "best_no_source="
        f"{best_row['model_name']} target={best_row['horizon_label']} pr_auc={best_row['pr_auc']:.6f}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
