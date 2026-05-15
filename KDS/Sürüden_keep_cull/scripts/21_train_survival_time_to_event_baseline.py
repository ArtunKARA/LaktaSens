from __future__ import annotations

import argparse
import importlib.util
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRAIN_SCRIPT = PROJECT_ROOT / "scripts" / "12_train_baseline_risk_models.py"
DEFAULT_RULES = PROJECT_ROOT / "config" / "baseline_model_payload_enriched_rules.yaml"


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


def configured_models(rules: dict[str, Any]) -> set[str]:
    return set(rules.get("survival_baseline", {}).get("models", ["logistic_regression", "lightgbm"]))


def model_specs_for_survival(rules: dict[str, Any], y_train: pd.Series) -> list[dict[str, Any]]:
    allowed = configured_models(rules)
    return [spec for spec in BT.make_model_specs(rules, y_train) if spec["model_name"] in allowed]


def add_time_to_event_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    ref = pd.to_datetime(out["referans_tarih"], errors="coerce")
    cull = pd.to_datetime(out["first_cull_date"], errors="coerce")
    obs_end = pd.to_datetime(out["observation_end"], errors="coerce")
    event_observed = cull.notna() & ref.notna() & cull.gt(ref) & obs_end.notna() & cull.le(obs_end)
    event_days = (cull - ref).dt.days
    censor_days = (obs_end - ref).dt.days
    out["tte_event_observed"] = event_observed.astype(int)
    out["time_to_event_or_censor_days"] = np.where(event_observed, event_days, censor_days)
    out["time_to_event_or_censor_days"] = pd.to_numeric(out["time_to_event_or_censor_days"], errors="coerce")
    out.loc[out["time_to_event_or_censor_days"].lt(0), "time_to_event_or_censor_days"] = np.nan
    return out


def concordance_index(time: np.ndarray, event: np.ndarray, score: np.ndarray, max_rows: int) -> float:
    valid = np.isfinite(time) & np.isfinite(score)
    time = time[valid]
    event = event[valid].astype(int)
    score = score[valid]
    if len(time) == 0:
        return float("nan")
    if len(time) > max_rows:
        rng = np.random.default_rng(42)
        idx = rng.choice(len(time), size=max_rows, replace=False)
        time = time[idx]
        event = event[idx]
        score = score[idx]

    concordant = 0.0
    comparable = 0
    for i in range(len(time)):
        if event[i] != 1:
            continue
        mask = time[i] < time
        if not np.any(mask):
            continue
        comparable += int(mask.sum())
        concordant += float((score[i] > score[mask]).sum())
        concordant += 0.5 * float((score[i] == score[mask]).sum())
    return float(concordant / comparable) if comparable else float("nan")


def write_report(metrics_df: pd.DataFrame, output_path: Path) -> None:
    lines = [
        "# Survival-Style Baseline Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Method: discrete-time 30-day hazard classifier used as a lightweight time-to-event baseline.",
        "- This is not full Cox/Random Survival Forest. It is dependency-light and enough to test whether time-to-cull signal exists before MDP work.",
        "",
        "## Metrics",
        "",
        "| Model | Hazard ROC-AUC | Hazard PR-AUC | Hazard F1 | Hazard Recall | Hazard Precision | 90d ROC-AUC using hazard score | 90d PR-AUC using hazard score | C-index | Brier | ECE |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in metrics_df.sort_values("hazard_pr_auc", ascending=False).to_dict("records"):
        lines.append(
            f"| `{row['model_name']}` | {row['hazard_roc_auc']:.4f} | {row['hazard_pr_auc']:.4f} | "
            f"{row['hazard_f1']:.4f} | {row['hazard_recall']:.4f} | {row['hazard_precision']:.4f} | "
            f"{row['proxy_90d_roc_auc']:.4f} | {row['proxy_90d_pr_auc']:.4f} | {row['concordance_index']:.4f} | "
            f"{row['hazard_brier_score']:.4f} | {row['hazard_expected_calibration_error']:.4f} |"
        )
    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- If C-index and 90-day proxy ranking are weak, a full survival model will not fix data coverage by itself.",
            "- If useful, the next step is a real survival package or a discrete hazard panel with richer monthly state transitions.",
        ]
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Train a discrete-time survival-style hazard baseline.")
    parser.add_argument("--rules", default=str(DEFAULT_RULES), help="Path to baseline model rules YAML.")
    args = parser.parse_args()
    rules_path = Path(args.rules)
    if not rules_path.is_absolute():
        rules_path = PROJECT_ROOT / rules_path
    rules = BT.load_rules(rules_path)
    survival_rules = rules.get("survival_baseline", {})
    hazard_target = survival_rules.get("hazard_target", "cull_within_30d")
    proxy_target = survival_rules.get("evaluation_target", "cull_within_90d")
    max_cindex_rows = int(survival_rules.get("max_cindex_rows", 2500))

    df = pd.read_csv(path_from_root(rules["input"]["model_ready_csv"]), low_memory=False)
    df = add_time_to_event_columns(df)
    y = pd.to_numeric(df[hazard_target], errors="coerce")
    valid_mask = y.isin([0, 1]) & df["time_to_event_or_censor_days"].notna()
    train_mask, test_mask, split_policy, split_cutoff = BT.positive_aware_time_split(df, y, rules, valid_mask)
    y_train = y.loc[train_mask].astype(int)
    y_test = y.loc[test_mask].astype(int)
    if not binary_class_ok(y_train) or not binary_class_ok(y_test):
        raise RuntimeError("Survival-style hazard split does not contain both classes.")

    numeric_features = rules["features"]["numeric"]
    categorical_features = rules["features"]["variants"]["no_source_code"]["categorical"]
    feature_df = BT.normalize_feature_frame(df, numeric_features, categorical_features)

    metrics_rows: list[dict[str, Any]] = []
    score_frames: list[pd.DataFrame] = []
    proxy_y = pd.to_numeric(df[proxy_target], errors="coerce")
    proxy_valid_test = test_mask & proxy_y.isin([0, 1])
    for spec in model_specs_for_survival(rules, y_train):
        model_name = spec["model_name"]
        pipeline = Pipeline(
            [
                ("preprocessor", BT.make_preprocessor(numeric_features, categorical_features, bool(spec["scale_numeric"]))),
                ("model", spec["estimator"]),
            ]
        )
        pipeline.fit(feature_df.loc[train_mask], y_train)
        train_prob = pipeline.predict_proba(feature_df.loc[train_mask])[:, 1]
        test_prob = pipeline.predict_proba(feature_df.loc[test_mask])[:, 1]
        hazard_metrics = BT.evaluate(
            y_train.to_numpy(),
            train_prob,
            y_test.to_numpy(),
            test_prob,
            int(rules["evaluation"].get("calibration_bins", 10)),
        )
        test_index = df.loc[test_mask].index
        cindex = concordance_index(
            df.loc[test_index, "time_to_event_or_censor_days"].to_numpy(dtype=float),
            df.loc[test_index, "tte_event_observed"].to_numpy(dtype=int),
            test_prob,
            max_cindex_rows,
        )
        proxy_scores = pd.Series(test_prob, index=test_index).loc[proxy_valid_test]
        proxy_label = proxy_y.loc[proxy_valid_test].astype(int)
        proxy_roc = BT.safe_metric(BT.roc_auc_score, proxy_label.to_numpy(), proxy_scores.to_numpy())
        proxy_pr = BT.safe_metric(BT.average_precision_score, proxy_label.to_numpy(), proxy_scores.to_numpy())
        metrics_rows.append(
            {
                "model_name": model_name,
                "hazard_target": hazard_target,
                "proxy_target": proxy_target,
                "split_policy": split_policy,
                "split_cutoff_date": split_cutoff,
                "train_rows": int(len(y_train)),
                "test_rows": int(len(y_test)),
                "train_positive": int(y_train.sum()),
                "test_positive": int(y_test.sum()),
                "hazard_roc_auc": hazard_metrics["roc_auc"],
                "hazard_pr_auc": hazard_metrics["pr_auc"],
                "hazard_f1": hazard_metrics["f1"],
                "hazard_recall": hazard_metrics["recall"],
                "hazard_precision": hazard_metrics["precision"],
                "hazard_brier_score": hazard_metrics["brier_score"],
                "hazard_expected_calibration_error": hazard_metrics["expected_calibration_error"],
                "threshold": hazard_metrics["threshold"],
                "proxy_90d_roc_auc": proxy_roc,
                "proxy_90d_pr_auc": proxy_pr,
                "concordance_index": cindex,
            }
        )
        scores = df.loc[test_mask, ["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih"]].copy()
        scores["model_name"] = model_name
        scores["hazard_target"] = hazard_target
        scores["proxy_target"] = proxy_target
        scores["hazard_label"] = y_test.to_numpy()
        scores["hazard_score_30d"] = test_prob
        scores["threshold"] = hazard_metrics["threshold"]
        scores["time_to_event_or_censor_days"] = df.loc[test_mask, "time_to_event_or_censor_days"].to_numpy()
        scores["tte_event_observed"] = df.loc[test_mask, "tte_event_observed"].to_numpy()
        scores["proxy_90d_label"] = proxy_y.loc[test_mask].to_numpy()
        score_frames.append(scores)

    output_dir = path_from_root("data/processed/models/payload_enriched")
    metrics_path = output_dir / "survival_discrete_hazard_metrics.csv"
    scores_path = output_dir / "survival_discrete_hazard_scores.csv"
    report_path = path_from_root("reports/survival_time_to_event_baseline_report.md")
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics_df = pd.DataFrame(metrics_rows)
    scores_df = pd.concat(score_frames, ignore_index=True) if score_frames else pd.DataFrame()
    metrics_df.to_csv(metrics_path, index=False)
    scores_df.to_csv(scores_path, index=False)
    write_report(metrics_df, report_path)
    print(f"wrote {metrics_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {scores_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {report_path.relative_to(PROJECT_ROOT)}")
    if not metrics_df.empty:
        best = metrics_df.sort_values("hazard_pr_auc", ascending=False).iloc[0]
        print(f"best_survival_style={best['model_name']} hazard_pr_auc={best['hazard_pr_auc']:.6f} cindex={best['concordance_index']:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
