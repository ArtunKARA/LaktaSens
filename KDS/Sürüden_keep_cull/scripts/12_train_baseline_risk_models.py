from __future__ import annotations

import json
import math
import warnings
import argparse
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = PROJECT_ROOT / "config" / "baseline_model_rules.yaml"

warnings.filterwarnings("ignore", message="Skipping features without any observed values.*")
warnings.filterwarnings("ignore", message="X does not have valid feature names.*")


def load_rules(path: Path | None = None) -> dict[str, Any]:
    rules_path = path or RULES_PATH
    with rules_path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def path_from_root(path_text: str) -> Path:
    return PROJECT_ROOT / path_text


def optional_model_imports() -> dict[str, Any]:
    imports: dict[str, Any] = {}
    try:
        from xgboost import XGBClassifier  # type: ignore

        imports["xgboost"] = XGBClassifier
    except Exception as exc:  # pragma: no cover - depends on local env
        imports["xgboost_error"] = str(exc)

    try:
        from lightgbm import LGBMClassifier  # type: ignore

        imports["lightgbm"] = LGBMClassifier
    except Exception as exc:  # pragma: no cover - depends on local env
        imports["lightgbm_error"] = str(exc)
    return imports


def normalize_feature_frame(df: pd.DataFrame, numeric_features: list[str], categorical_features: list[str]) -> pd.DataFrame:
    frame = df[numeric_features + categorical_features].copy()
    for column in numeric_features:
        if column not in frame:
            frame[column] = np.nan
        frame[column] = frame[column].replace({"true": 1, "false": 0, "True": 1, "False": 0, True: 1, False: 0})
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    for column in categorical_features:
        if column not in frame:
            frame[column] = ""
        frame[column] = frame[column].fillna("unknown").astype(str)
    return frame


def make_preprocessor(
    numeric_features: list[str],
    categorical_features: list[str],
    scale_numeric: bool,
) -> ColumnTransformer:
    numeric_steps: list[tuple[str, Any]] = [("imputer", SimpleImputer(strategy="median", keep_empty_features=True))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))
    numeric_pipeline = Pipeline(numeric_steps)
    transformers: list[tuple[str, Any, list[str]]] = []
    if numeric_features:
        transformers.append(("num", numeric_pipeline, numeric_features))
    if categorical_features:
        categorical_pipeline = Pipeline(
            [
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
            ]
        )
        transformers.append(("cat", categorical_pipeline, categorical_features))
    return ColumnTransformer(transformers, remainder="drop", verbose_feature_names_out=False)


def make_model_specs(rules: dict[str, Any], y_train: pd.Series) -> list[dict[str, Any]]:
    model_rules = rules["models"]
    specs: list[dict[str, Any]] = []
    if model_rules.get("logistic_regression", {}).get("enabled", False):
        specs.append(
            {
                "model_name": "logistic_regression",
                "estimator": LogisticRegression(
                    class_weight=model_rules["logistic_regression"].get("class_weight", "balanced"),
                    max_iter=int(model_rules["logistic_regression"].get("max_iter", 1000)),
                    solver="lbfgs",
                    random_state=42,
                ),
                "scale_numeric": True,
            }
        )

    if model_rules.get("random_forest", {}).get("enabled", False):
        rf_rules = model_rules["random_forest"]
        specs.append(
            {
                "model_name": "random_forest",
                "estimator": RandomForestClassifier(
                    n_estimators=int(rf_rules.get("n_estimators", 200)),
                    min_samples_leaf=int(rf_rules.get("min_samples_leaf", 20)),
                    class_weight=rf_rules.get("class_weight", "balanced_subsample"),
                    random_state=int(rf_rules.get("random_state", 42)),
                    n_jobs=-1,
                ),
                "scale_numeric": False,
            }
        )

    optional_imports = optional_model_imports()
    class_counts = y_train.value_counts().to_dict()
    negative_count = int(class_counts.get(0, 0))
    positive_count = int(class_counts.get(1, 0))
    scale_pos_weight = negative_count / positive_count if positive_count else 1.0

    if model_rules.get("xgboost", {}).get("enabled", False) and "xgboost" in optional_imports:
        xgb_rules = model_rules["xgboost"]
        specs.append(
            {
                "model_name": "xgboost",
                "estimator": optional_imports["xgboost"](
                    n_estimators=int(xgb_rules.get("n_estimators", 300)),
                    max_depth=int(xgb_rules.get("max_depth", 4)),
                    learning_rate=float(xgb_rules.get("learning_rate", 0.05)),
                    subsample=float(xgb_rules.get("subsample", 0.8)),
                    colsample_bytree=float(xgb_rules.get("colsample_bytree", 0.8)),
                    scale_pos_weight=scale_pos_weight,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    tree_method="hist",
                    random_state=int(xgb_rules.get("random_state", 42)),
                    n_jobs=-1,
                ),
                "scale_numeric": False,
            }
        )

    if model_rules.get("lightgbm", {}).get("enabled", False) and "lightgbm" in optional_imports:
        lgbm_rules = model_rules["lightgbm"]
        specs.append(
            {
                "model_name": "lightgbm",
                "estimator": optional_imports["lightgbm"](
                    n_estimators=int(lgbm_rules.get("n_estimators", 300)),
                    learning_rate=float(lgbm_rules.get("learning_rate", 0.05)),
                    num_leaves=int(lgbm_rules.get("num_leaves", 31)),
                    class_weight="balanced",
                    random_state=int(lgbm_rules.get("random_state", 42)),
                    n_jobs=-1,
                    verbosity=-1,
                ),
                "scale_numeric": False,
            }
        )

    return specs


def choose_threshold(y_true: np.ndarray, probabilities: np.ndarray) -> tuple[float, float]:
    precision, recall, thresholds = precision_recall_curve(y_true, probabilities)
    if len(thresholds) == 0:
        return 0.5, 0.0
    f1_values = (2 * precision[:-1] * recall[:-1]) / np.maximum(precision[:-1] + recall[:-1], 1e-12)
    best_idx = int(np.nanargmax(f1_values))
    return float(thresholds[best_idx]), float(f1_values[best_idx])


def expected_calibration_error(y_true: np.ndarray, probabilities: np.ndarray, bins: int) -> float:
    edges = np.linspace(0.0, 1.0, bins + 1)
    ece = 0.0
    for idx in range(bins):
        lower = edges[idx]
        upper = edges[idx + 1]
        if idx == bins - 1:
            mask = (probabilities >= lower) & (probabilities <= upper)
        else:
            mask = (probabilities >= lower) & (probabilities < upper)
        if not np.any(mask):
            continue
        bin_weight = float(mask.mean())
        bin_confidence = float(probabilities[mask].mean())
        bin_accuracy = float(y_true[mask].mean())
        ece += bin_weight * abs(bin_accuracy - bin_confidence)
    return float(ece)


def safe_metric(metric_fn: Any, y_true: np.ndarray, values: np.ndarray) -> float:
    try:
        return float(metric_fn(y_true, values))
    except ValueError:
        return math.nan


def binary_class_ok(y: pd.Series) -> bool:
    return y.dropna().astype(int).nunique() >= 2


def positive_aware_time_split(
    df: pd.DataFrame,
    y: pd.Series,
    rules: dict[str, Any],
    valid_mask: pd.Series,
) -> tuple[pd.Series, pd.Series, str, str]:
    split_rules = rules["split"]
    split_col = split_rules["column"]
    train_mask = df[split_col].astype(str).eq(split_rules["train_value"]) & valid_mask
    test_mask = df[split_col].astype(str).eq(split_rules["test_value"]) & valid_mask
    if binary_class_ok(y.loc[train_mask]) and binary_class_ok(y.loc[test_mask]):
        return train_mask, test_mask, "phase_3_split", ""

    reference_dates = pd.to_datetime(df["referans_tarih"], errors="coerce")
    positives = df.loc[valid_mask & y.eq(1), "referans_tarih"]
    positive_dates = pd.to_datetime(positives, errors="coerce").dropna().sort_values()
    if positive_dates.empty:
        return train_mask, test_mask, "phase_3_split_no_positive_fallback_available", ""

    preferred_fraction = float(split_rules.get("fallback_positive_train_fraction", 0.8))
    fractions = [preferred_fraction, 0.75, 0.7, 0.65, 0.6, 0.5]
    min_test_positives = int(split_rules.get("fallback_min_test_positives", 10))
    best: tuple[pd.Series, pd.Series, str, str] | None = None
    for fraction in fractions:
        cutoff_index = max(0, min(len(positive_dates) - 1, int(len(positive_dates) * fraction) - 1))
        cutoff = positive_dates.iloc[cutoff_index]
        fallback_train = reference_dates.le(cutoff) & valid_mask
        fallback_test = reference_dates.gt(cutoff) & valid_mask
        test_positive_count = int(y.loc[fallback_test].sum())
        if binary_class_ok(y.loc[fallback_train]) and binary_class_ok(y.loc[fallback_test]):
            candidate = (
                fallback_train,
                fallback_test,
                "positive_aware_time_split",
                cutoff.date().isoformat(),
            )
            best = candidate
            if test_positive_count >= min_test_positives:
                return candidate
    if best is not None:
        return best
    return train_mask, test_mask, "phase_3_split_fallback_failed", ""


def evaluate(
    y_train: np.ndarray,
    train_prob: np.ndarray,
    y_test: np.ndarray,
    test_prob: np.ndarray,
    calibration_bins: int,
) -> dict[str, float]:
    threshold, train_best_f1 = choose_threshold(y_train, train_prob)
    pred = (test_prob >= threshold).astype(int)
    return {
        "threshold": threshold,
        "train_best_f1": train_best_f1,
        "roc_auc": safe_metric(roc_auc_score, y_test, test_prob),
        "pr_auc": safe_metric(average_precision_score, y_test, test_prob),
        "f1": safe_metric(lambda yt, yp: f1_score(yt, yp, zero_division=0), y_test, pred),
        "recall": safe_metric(lambda yt, yp: recall_score(yt, yp, zero_division=0), y_test, pred),
        "precision": safe_metric(lambda yt, yp: precision_score(yt, yp, zero_division=0), y_test, pred),
        "brier_score": safe_metric(brier_score_loss, y_test, test_prob),
        "expected_calibration_error": expected_calibration_error(y_test, test_prob, calibration_bins),
    }


def get_feature_importance(pipeline: Pipeline, model_name: str, horizon_label: str) -> pd.DataFrame:
    preprocessor = pipeline.named_steps["preprocessor"]
    estimator = pipeline.named_steps["model"]
    feature_names = list(preprocessor.get_feature_names_out())

    if hasattr(estimator, "coef_"):
        values = np.abs(estimator.coef_[0])
        signed_values = estimator.coef_[0]
        importance_type = "abs_logistic_coefficient"
    elif hasattr(estimator, "feature_importances_"):
        values = estimator.feature_importances_
        signed_values = values
        importance_type = "model_feature_importance"
    else:
        values = np.zeros(len(feature_names))
        signed_values = values
        importance_type = "unavailable"

    rows = []
    for feature, importance, signed_importance in zip(feature_names, values, signed_values):
        rows.append(
            {
                "horizon_label": horizon_label,
                "model_name": model_name,
                "feature": feature,
                "importance": float(importance),
                "signed_importance": float(signed_importance),
                "importance_type": importance_type,
            }
        )
    return pd.DataFrame(rows).sort_values(["importance", "feature"], ascending=[False, True])


def write_report(
    rules: dict[str, Any],
    metrics_df: pd.DataFrame,
    skipped_models: list[dict[str, str]],
    best_row: dict[str, Any],
) -> None:
    report_path = path_from_root(rules["output"]["report_md"])
    report_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Baseline Risk Model Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- Input: `{rules['input']['model_ready_csv']}`",
        f"- Primary target: `{rules['targets']['primary_target']}`",
        f"- Selection metric: `{rules['evaluation']['selection_metric']}`",
        "- Split: time-based train/test from Faz 3.",
        "",
        "## Best Baseline",
        "",
        f"- Model: `{best_row['model_name']}`",
        f"- Target: `{best_row['horizon_label']}`",
        f"- PR-AUC: `{best_row['pr_auc']:.6f}`",
        f"- ROC-AUC: `{best_row['roc_auc']:.6f}`",
        f"- F1: `{best_row['f1']:.6f}`",
        f"- Recall: `{best_row['recall']:.6f}`",
        f"- Calibration Brier: `{best_row['brier_score']:.6f}`",
        "",
        "## Metrics",
        "",
        "| Target | Model | Split | Cutoff | Train pos | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE | Threshold |",
        "|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in metrics_df.sort_values(["horizon_days", "pr_auc"], ascending=[True, False]).to_dict("records"):
        lines.append(
            f"| `{row['horizon_label']}` | `{row['model_name']}` | `{row['split_policy_used']}` | `{row['split_cutoff_date'] or '-'}` | "
            f"{int(row['train_positive'])} | {int(row['test_positive'])} | "
            f"{row['roc_auc']:.4f} | {row['pr_auc']:.4f} | {row['f1']:.4f} | {row['recall']:.4f} | "
            f"{row['precision']:.4f} | {row['brier_score']:.4f} | {row['expected_calibration_error']:.4f} | {row['threshold']:.4f} |"
        )

    if skipped_models:
        lines.extend(["", "## Skipped Models", ""])
        for skipped in skipped_models:
            lines.append(f"- `{skipped['model_name']}` for `{skipped['horizon_label']}`: {skipped['reason']}")

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- PR-AUC is the primary comparison metric because culling positives are rare.",
            "- If the Faz 3 test split has no positive culling examples, the script uses a positive-aware time split for that target and reports the cutoff date.",
            "- Threshold is selected on train data by max F1, then evaluated on test data.",
            "- Calibration is reported with Brier score and expected calibration error; no post-hoc calibration model is applied yet.",
            "- This is supervised risk scoring only; it is not an RL policy.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_feature_importance_report(rules: dict[str, Any], importance_df: pd.DataFrame, best_row: dict[str, Any]) -> None:
    report_path = path_from_root(rules["output"]["feature_importance_md"])
    best_filter = (
        (importance_df["horizon_label"] == best_row["horizon_label"])
        & (importance_df["model_name"] == best_row["model_name"])
    )
    best_importance = importance_df.loc[best_filter].sort_values("importance", ascending=False).head(30)
    lines = [
        "# Baseline Feature Importance",
        "",
        f"Best model: `{best_row['model_name']}` for `{best_row['horizon_label']}`.",
        "",
        "| Rank | Feature | Importance | Signed value | Type |",
        "|---:|---|---:|---:|---|",
    ]
    for rank, row in enumerate(best_importance.to_dict("records"), start=1):
        lines.append(
            f"| {rank} | `{row['feature']}` | {row['importance']:.6f} | {row['signed_importance']:.6f} | `{row['importance_type']}` |"
        )
    lines.extend(
        [
            "",
            "Interpretation caution: source-level features can capture dataset differences as well as biological signal.",
        ]
    )
    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Train supervised baseline culling risk models.")
    parser.add_argument("--rules", default=str(RULES_PATH), help="Path to baseline model rules YAML.")
    args = parser.parse_args()
    rules_path = Path(args.rules)
    if not rules_path.is_absolute():
        rules_path = PROJECT_ROOT / rules_path
    rules = load_rules(rules_path)
    model_ready_path = path_from_root(rules["input"]["model_ready_csv"])
    if not model_ready_path.exists():
        raise FileNotFoundError(model_ready_path)

    df = pd.read_csv(model_ready_path, low_memory=False)
    numeric_features = rules["features"]["numeric"]
    categorical_features = rules["features"]["categorical"]
    feature_df = normalize_feature_frame(df, numeric_features, categorical_features)
    split_col = rules["split"]["column"]
    base_train_mask = df[split_col].astype(str).eq(rules["split"]["train_value"])
    base_test_mask = df[split_col].astype(str).eq(rules["split"]["test_value"])
    if not base_train_mask.any() or not base_test_mask.any():
        raise RuntimeError("Train/test split values were not found in model_ready CSV.")

    output_dir = path_from_root(rules["output"]["metrics_csv"]).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    artifact_dir = path_from_root(rules["output"]["model_artifact_dir"])
    artifact_dir.mkdir(parents=True, exist_ok=True)

    metrics_rows: list[dict[str, Any]] = []
    risk_score_candidates: list[tuple[dict[str, Any], pd.DataFrame]] = []
    importance_frames: list[pd.DataFrame] = []
    skipped_models: list[dict[str, str]] = []
    best_pipeline: Pipeline | None = None
    best_row: dict[str, Any] | None = None

    calibration_bins = int(rules["evaluation"].get("calibration_bins", 10))
    for target in rules["targets"]["horizons"]:
        horizon_label = target["label"]
        horizon_days = int(target["horizon_days"])
        y = pd.to_numeric(df[horizon_label], errors="coerce")
        valid_mask = y.isin([0, 1])
        train_target_mask, test_target_mask, split_policy_used, split_cutoff_date = positive_aware_time_split(
            df,
            y,
            rules,
            valid_mask,
        )
        y_train = y.loc[train_target_mask].astype(int)
        y_test = y.loc[test_target_mask].astype(int)
        if y_train.nunique() < 2 or y_test.nunique() < 2:
            skipped_models.append(
                {
                    "horizon_label": horizon_label,
                    "model_name": "all",
                    "reason": "train or test target has fewer than two classes",
                }
            )
            continue

        X_train = feature_df.loc[train_target_mask]
        X_test = feature_df.loc[test_target_mask]
        specs = make_model_specs(rules, y_train)

        enabled_names = {spec["model_name"] for spec in specs}
        for optional_name in ("xgboost", "lightgbm"):
            if rules["models"].get(optional_name, {}).get("enabled", False) and optional_name not in enabled_names:
                skipped_models.append(
                    {
                        "horizon_label": horizon_label,
                        "model_name": optional_name,
                        "reason": "optional dependency is not installed",
                    }
                )

        for spec in specs:
            model_name = spec["model_name"]
            pipeline = Pipeline(
                [
                    (
                        "preprocessor",
                        make_preprocessor(numeric_features, categorical_features, bool(spec["scale_numeric"])),
                    ),
                    ("model", spec["estimator"]),
                ]
            )
            pipeline.fit(X_train, y_train)
            train_prob = pipeline.predict_proba(X_train)[:, 1]
            test_prob = pipeline.predict_proba(X_test)[:, 1]
            metric_values = evaluate(
                y_train.to_numpy(),
                train_prob,
                y_test.to_numpy(),
                test_prob,
                calibration_bins,
            )
            metric_row = {
                "horizon_label": horizon_label,
                "horizon_days": horizon_days,
                "model_name": model_name,
                "train_rows": int(len(y_train)),
                "test_rows": int(len(y_test)),
                "train_positive": int(y_train.sum()),
                "test_positive": int(y_test.sum()),
                "train_positive_rate": float(y_train.mean()),
                "test_positive_rate": float(y_test.mean()),
                "split_policy_used": split_policy_used,
                "split_cutoff_date": split_cutoff_date,
                **metric_values,
            }
            metrics_rows.append(metric_row)

            importance_frames.append(get_feature_importance(pipeline, model_name, horizon_label))
            score_frame = df.loc[test_target_mask, ["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih"]].copy()
            score_frame["horizon_label"] = horizon_label
            score_frame["model_name"] = model_name
            score_frame["baseline_split_policy"] = split_policy_used
            score_frame["baseline_split_cutoff_date"] = split_cutoff_date
            score_frame["label"] = y_test.to_numpy()
            score_frame["risk_score"] = test_prob
            score_frame["threshold"] = metric_values["threshold"]
            score_frame["predicted_label"] = (test_prob >= metric_values["threshold"]).astype(int)
            risk_score_candidates.append((metric_row, score_frame))

            if horizon_label == rules["targets"]["primary_target"]:
                if best_row is None or metric_row[rules["evaluation"]["selection_metric"]] > best_row[rules["evaluation"]["selection_metric"]]:
                    best_row = metric_row
                    best_pipeline = pipeline

    if not metrics_rows or best_row is None or best_pipeline is None:
        raise RuntimeError("No baseline model was trained. Check dependencies and label distributions.")

    metrics_df = pd.DataFrame(metrics_rows).sort_values(["horizon_days", "pr_auc"], ascending=[True, False])
    metrics_path = path_from_root(rules["output"]["metrics_csv"])
    metrics_df.to_csv(metrics_path, index=False)

    best_score_frames = [
        score_frame
        for metric_row, score_frame in risk_score_candidates
        if metric_row["horizon_label"] == best_row["horizon_label"]
        and metric_row["model_name"] == best_row["model_name"]
    ]
    if not best_score_frames:
        raise RuntimeError("Best model risk score frame was not found.")
    risk_scores_df = best_score_frames[0]
    risk_scores_path = path_from_root(rules["output"]["risk_scores_csv"])
    risk_scores_df.to_csv(risk_scores_path, index=False)

    importance_df = pd.concat(importance_frames, ignore_index=True)
    importance_path = path_from_root(rules["output"]["feature_importance_csv"])
    importance_df.to_csv(importance_path, index=False)

    artifact_path = artifact_dir / f"{best_row['model_name']}_{best_row['horizon_label']}.joblib"
    dump(best_pipeline, artifact_path)
    metadata = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "best_model": best_row,
        "artifact_path": str(artifact_path.relative_to(PROJECT_ROOT)),
        "feature_columns": {"numeric": numeric_features, "categorical": categorical_features},
        "rules_path": str(rules_path.relative_to(PROJECT_ROOT)),
    }
    metadata_path = path_from_root(rules["output"]["best_model_metadata_json"])
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    write_report(rules, metrics_df, skipped_models, best_row)
    write_feature_importance_report(rules, importance_df, best_row)

    print(f"wrote {metrics_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {risk_scores_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {importance_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {metadata_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {rules['output']['report_md']}")
    print(f"best_model={best_row['model_name']} target={best_row['horizon_label']} pr_auc={best_row['pr_auc']:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
