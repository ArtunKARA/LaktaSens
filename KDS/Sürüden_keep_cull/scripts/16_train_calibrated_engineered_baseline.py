from __future__ import annotations

import importlib.util
import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from joblib import dump
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRAIN_SCRIPT = PROJECT_ROOT / "scripts" / "12_train_baseline_risk_models.py"
RULES_PATH = PROJECT_ROOT / "config" / "baseline_model_engineered_rules.yaml"


def load_train_module() -> Any:
    spec = importlib.util.spec_from_file_location("baseline_train_module", TRAIN_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {TRAIN_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BT = load_train_module()

OUTPUT_METRICS = PROJECT_ROOT / "data" / "processed" / "models" / "engineered" / "calibrated_model_metrics.csv"
OUTPUT_SCORES = PROJECT_ROOT / "data" / "processed" / "models" / "engineered" / "calibrated_risk_scores.csv"
OUTPUT_METADATA = PROJECT_ROOT / "data" / "processed" / "models" / "engineered" / "calibrated_best_model_metadata.json"
OUTPUT_REPORT = PROJECT_ROOT / "reports" / "baseline_calibration_engineered_report.md"
ARTIFACT_DIR = PROJECT_ROOT / "Model" / "baseline_risk" / "engineered"


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def configured_output_path(rules: dict[str, Any], key: str, fallback_name: str) -> Path:
    output_rules = rules.get("output", {})
    if key in output_rules:
        return path_from_root(output_rules[key])
    base_dir = path_from_root(output_rules["metrics_csv"]).parent
    return base_dir / fallback_name


def configured_report_path(rules: dict[str, Any], key: str, fallback_name: str) -> Path:
    output_rules = rules.get("output", {})
    if key in output_rules:
        return path_from_root(output_rules[key])
    report_path = output_rules.get("report_md", "reports/baseline_model_engineered_report.md")
    return path_from_root(report_path).parent / fallback_name


def candidate_estimators() -> list[tuple[str, Any, bool]]:
    candidates: list[tuple[str, Any, bool]] = [
        (
            "calibrated_logistic_regression_sigmoid_cv3",
            LogisticRegression(
                class_weight="balanced",
                max_iter=1000,
                solver="lbfgs",
                random_state=42,
            ),
            True,
        )
    ]
    optional_imports = BT.optional_model_imports()
    if "lightgbm" in optional_imports:
        candidates.append(
            (
                "calibrated_lightgbm_sigmoid_cv3",
                optional_imports["lightgbm"](
                    n_estimators=300,
                    learning_rate=0.05,
                    num_leaves=31,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                    verbosity=-1,
                ),
                False,
            )
        )
    return candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Train calibrated no-source baseline risk models.")
    parser.add_argument("--rules", default=str(RULES_PATH), help="Path to baseline model rules YAML.")
    args = parser.parse_args()
    rules_path = Path(args.rules)
    if not rules_path.is_absolute():
        rules_path = PROJECT_ROOT / rules_path

    rules = BT.load_rules(rules_path)
    output_metrics = configured_output_path(rules, "calibrated_metrics_csv", "calibrated_model_metrics.csv")
    output_scores = configured_output_path(rules, "calibrated_risk_scores_csv", "calibrated_risk_scores.csv")
    output_metadata = configured_output_path(rules, "calibrated_metadata_json", "calibrated_best_model_metadata.json")
    output_report = configured_report_path(rules, "calibrated_report_md", "baseline_calibration_engineered_report.md")
    artifact_dir = path_from_root(rules["output"].get("model_artifact_dir", str(ARTIFACT_DIR.relative_to(PROJECT_ROOT))))

    df = pd.read_csv(path_from_root(rules["input"]["model_ready_csv"]), low_memory=False)
    target_label = rules["targets"]["primary_target"]
    numeric_features = rules["features"]["numeric"]
    categorical_features = rules["features"]["variants"]["no_source_code"]["categorical"]
    features = BT.normalize_feature_frame(df, numeric_features, categorical_features)

    y = pd.to_numeric(df[target_label], errors="coerce")
    valid_mask = y.isin([0, 1])
    train_mask, test_mask, split_policy, split_cutoff = BT.positive_aware_time_split(df, y, rules, valid_mask)
    y_train = y.loc[train_mask].astype(int)
    y_test = y.loc[test_mask].astype(int)
    if not BT.binary_class_ok(y_train) or not BT.binary_class_ok(y_test):
        raise RuntimeError("Train/test split does not contain both classes for calibration.")

    all_metrics: list[dict[str, Any]] = []
    score_frames: dict[str, pd.DataFrame] = {}
    fitted_models: dict[str, CalibratedClassifierCV] = {}
    for model_name, estimator, scale_numeric in candidate_estimators():
        base_pipeline = Pipeline(
            [
                ("preprocessor", BT.make_preprocessor(numeric_features, categorical_features, scale_numeric=scale_numeric)),
                ("model", estimator),
            ]
        )
        calibrated = CalibratedClassifierCV(estimator=base_pipeline, method="sigmoid", cv=3)
        calibrated.fit(features.loc[train_mask], y_train)

        train_prob = calibrated.predict_proba(features.loc[train_mask])[:, 1]
        test_prob = calibrated.predict_proba(features.loc[test_mask])[:, 1]
        metric_values = BT.evaluate(
            y_train.to_numpy(),
            train_prob,
            y_test.to_numpy(),
            test_prob,
            int(rules["evaluation"].get("calibration_bins", 10)),
        )
        metrics = {
            "feature_variant": "no_source_code",
            "model_name": model_name,
            "target": target_label,
            "split_policy": split_policy,
            "split_cutoff_date": split_cutoff,
            "train_rows": int(len(y_train)),
            "test_rows": int(len(y_test)),
            "train_positive": int(y_train.sum()),
            "test_positive": int(y_test.sum()),
            **metric_values,
        }
        all_metrics.append(metrics)

        score_frame = df.loc[test_mask, ["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih"]].copy()
        score_frame["target"] = target_label
        score_frame["model_name"] = model_name
        score_frame["label"] = y_test.to_numpy()
        score_frame["risk_score"] = test_prob
        score_frame["threshold"] = metric_values["threshold"]
        score_frame["predicted_label"] = (test_prob >= metric_values["threshold"]).astype(int)
        score_frames[model_name] = score_frame
        fitted_models[model_name] = calibrated

    best_metrics = sorted(all_metrics, key=lambda row: row["pr_auc"], reverse=True)[0]
    best_model_name = str(best_metrics["model_name"])

    output_metrics.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(all_metrics).to_csv(output_metrics, index=False)

    score_frames[best_model_name].to_csv(output_scores, index=False)

    artifact_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = artifact_dir / f"{best_model_name}_no_source_cull_within_90d.joblib"
    dump(fitted_models[best_model_name], artifact_path)

    metadata = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "best_metrics": best_metrics,
        "all_metrics": all_metrics,
        "artifact_path": str(artifact_path.relative_to(PROJECT_ROOT)),
        "feature_columns": {"numeric": numeric_features, "categorical": categorical_features},
        "rules_path": str(rules_path.relative_to(PROJECT_ROOT)),
    }
    output_metadata.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report_title = rules.get("calibration", {}).get("report_title", "Baseline Calibration Report")
    lines = [
        f"# {report_title}",
        "",
        f"- Best model by PR-AUC: `{best_model_name}`",
        f"- Feature variant: `{best_metrics['feature_variant']}`",
        f"- Target: `{target_label}`",
        f"- Split policy: `{split_policy}`",
        "",
        "## Metrics",
        "",
        "| Model | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in sorted(all_metrics, key=lambda item: item["pr_auc"], reverse=True):
        lines.append(
            f"| `{row['model_name']}` | {row['roc_auc']:.4f} | {row['pr_auc']:.4f} | {row['f1']:.4f} | "
            f"{row['recall']:.4f} | {row['precision']:.4f} | {row['brier_score']:.4f} | "
            f"{row['expected_calibration_error']:.4f} | {row['threshold']:.4f} |"
        )
    lines.extend(
        [
            "",
            "## Best Artifact",
            "",
            f"- `{artifact_path.relative_to(PROJECT_ROOT)}`",
        ]
    )
    lines.extend(
        [
        "",
        "## Decision Note",
        "",
        "Calibration is evaluated as a risk-score quality step. If Brier/ECE do not improve enough, the model should remain diagnostic and should not feed MDP rewards directly.",
        ]
    )
    output_report.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    print(f"wrote {output_metrics.relative_to(PROJECT_ROOT)}")
    print(f"wrote {output_scores.relative_to(PROJECT_ROOT)}")
    print(f"wrote {output_metadata.relative_to(PROJECT_ROOT)}")
    print(f"wrote {output_report.relative_to(PROJECT_ROOT)}")
    print(
        "best_calibrated="
        f"{best_model_name} pr_auc={best_metrics['pr_auc']:.6f} "
        f"brier={best_metrics['brier_score']:.6f} "
        f"ece={best_metrics['expected_calibration_error']:.6f}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
