from __future__ import annotations

import argparse
import hashlib
import importlib.util
from datetime import datetime
from pathlib import Path
from typing import Any

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


def stable_bucket(value: str) -> int:
    digest = hashlib.md5(value.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 100


def binary_class_ok(y: pd.Series) -> bool:
    return y.dropna().astype(int).nunique() >= 2


def configured_models(rules: dict[str, Any]) -> set[str]:
    return set(rules.get("strict_validation", {}).get("models", ["logistic_regression", "lightgbm"]))


def model_specs_for_strict(rules: dict[str, Any], y_train: pd.Series) -> list[dict[str, Any]]:
    allowed = configured_models(rules)
    return [spec for spec in BT.make_model_specs(rules, y_train) if spec["model_name"] in allowed]


def source_holdout_splits(df: pd.DataFrame, y: pd.Series, valid_mask: pd.Series) -> list[tuple[str, pd.Series, pd.Series]]:
    splits: list[tuple[str, pd.Series, pd.Series]] = []
    for source_code, source_frame in df.loc[valid_mask].groupby("source_code"):
        test_mask = pd.Series(False, index=df.index)
        test_mask.loc[source_frame.index] = True
        test_mask &= valid_mask
        train_mask = valid_mask & ~test_mask
        if binary_class_ok(y.loc[train_mask]) and binary_class_ok(y.loc[test_mask]) and int(y.loc[test_mask].sum()) > 0:
            splits.append((f"source_holdout:{source_code}", train_mask, test_mask))
    return splits


def animal_hash_split(df: pd.DataFrame, y: pd.Series, valid_mask: pd.Series, test_pct: int) -> tuple[str, pd.Series, pd.Series]:
    buckets = df["canonical_animal_id"].astype(str).map(stable_bucket)
    test_mask = buckets.ge(100 - test_pct) & valid_mask
    train_mask = buckets.lt(100 - test_pct) & valid_mask
    return "animal_hash_holdout", train_mask, test_mask


def cohort_holdout_split(df: pd.DataFrame, y: pd.Series, valid_mask: pd.Series, test_pct: int) -> tuple[str, pd.Series, pd.Series]:
    local = df.loc[valid_mask, ["canonical_animal_id", "observation_start", "referans_tarih"]].copy()
    local["cohort_date"] = pd.to_datetime(local["observation_start"], errors="coerce")
    fallback = pd.to_datetime(local["referans_tarih"], errors="coerce")
    local["cohort_date"] = local["cohort_date"].fillna(fallback)
    animal_cohort = local.groupby("canonical_animal_id")["cohort_date"].min().sort_values()
    if animal_cohort.empty:
        empty = pd.Series(False, index=df.index)
        return "animal_recent_cohort_holdout", empty, empty
    cutoff_idx = max(0, int(len(animal_cohort) * (1 - test_pct / 100)) - 1)
    cutoff = animal_cohort.iloc[cutoff_idx]
    test_animals = set(animal_cohort[animal_cohort.gt(cutoff)].index)
    if not test_animals:
        test_animals = set(animal_cohort.tail(max(1, int(len(animal_cohort) * test_pct / 100))).index)
    test_mask = df["canonical_animal_id"].isin(test_animals) & valid_mask
    train_mask = ~df["canonical_animal_id"].isin(test_animals) & valid_mask
    return f"animal_recent_cohort_holdout:{cutoff.date().isoformat()}", train_mask, test_mask


def build_splits(df: pd.DataFrame, y: pd.Series, rules: dict[str, Any], valid_mask: pd.Series) -> list[tuple[str, pd.Series, pd.Series, str]]:
    splits: list[tuple[str, pd.Series, pd.Series, str]] = []
    train_mask, test_mask, policy, cutoff = BT.positive_aware_time_split(df, y, rules, valid_mask)
    splits.append((policy, train_mask, test_mask, cutoff))

    test_pct = int(rules.get("strict_validation", {}).get("animal_hash_test_pct", 20))
    policy, train_mask, test_mask = animal_hash_split(df, y, valid_mask, test_pct)
    splits.append((policy, train_mask, test_mask, ""))

    cohort_pct = int(rules.get("strict_validation", {}).get("cohort_test_pct", 20))
    policy, train_mask, test_mask = cohort_holdout_split(df, y, valid_mask, cohort_pct)
    splits.append((policy, train_mask, test_mask, ""))

    for source_policy, source_train, source_test in source_holdout_splits(df, y, valid_mask):
        splits.append((source_policy, source_train, source_test, ""))
    return splits


def score_split(
    rules: dict[str, Any],
    df: pd.DataFrame,
    feature_df: pd.DataFrame,
    numeric_features: list[str],
    categorical_features: list[str],
    target_label: str,
    policy: str,
    cutoff: str,
    train_mask: pd.Series,
    test_mask: pd.Series,
) -> tuple[list[dict[str, Any]], list[pd.DataFrame], list[dict[str, Any]]]:
    y = pd.to_numeric(df[target_label], errors="coerce")
    y_train = y.loc[train_mask].astype(int)
    y_test = y.loc[test_mask].astype(int)
    skipped: list[dict[str, Any]] = []
    if not binary_class_ok(y_train) or not binary_class_ok(y_test):
        skipped.append(
            {
                "validation_policy": policy,
                "reason": "train or test has fewer than two classes",
                "train_rows": int(train_mask.sum()),
                "test_rows": int(test_mask.sum()),
                "train_positive": int(y_train.sum()) if len(y_train) else 0,
                "test_positive": int(y_test.sum()) if len(y_test) else 0,
            }
        )
        return [], [], skipped

    metrics_rows: list[dict[str, Any]] = []
    score_frames: list[pd.DataFrame] = []
    specs = model_specs_for_strict(rules, y_train)
    if not specs:
        skipped.append({"validation_policy": policy, "reason": "no configured model specs available"})
        return [], [], skipped

    for spec in specs:
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
        metric_values = BT.evaluate(
            y_train.to_numpy(),
            train_prob,
            y_test.to_numpy(),
            test_prob,
            int(rules["evaluation"].get("calibration_bins", 10)),
        )
        metrics_rows.append(
            {
                "target": target_label,
                "validation_policy": policy,
                "split_cutoff_date": cutoff,
                "model_name": model_name,
                "train_rows": int(len(y_train)),
                "test_rows": int(len(y_test)),
                "train_animals": int(df.loc[train_mask, "canonical_animal_id"].nunique()),
                "test_animals": int(df.loc[test_mask, "canonical_animal_id"].nunique()),
                "train_positive": int(y_train.sum()),
                "test_positive": int(y_test.sum()),
                "train_positive_rate": float(y_train.mean()),
                "test_positive_rate": float(y_test.mean()),
                **metric_values,
            }
        )
        scores = df.loc[test_mask, ["snapshot_id", "source_code", "canonical_animal_id", "referans_tarih"]].copy()
        scores["target"] = target_label
        scores["validation_policy"] = policy
        scores["model_name"] = model_name
        scores["label"] = y_test.to_numpy()
        scores["risk_score"] = test_prob
        scores["threshold"] = metric_values["threshold"]
        scores["predicted_label"] = (test_prob >= metric_values["threshold"]).astype(int)
        score_frames.append(scores)
    return metrics_rows, score_frames, skipped


def write_report(metrics_df: pd.DataFrame, skipped_df: pd.DataFrame, output_path: Path) -> None:
    lines = [
        "# Strict Validation Report",
        "",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "- Purpose: test risk model robustness before MDP/reward simulation.",
        "- Feature variant: no `source_code`; reason labels are not used as model features.",
        "",
        "## Metrics",
        "",
        "| Validation | Model | Test rows | Test animals | Test pos | ROC-AUC | PR-AUC | F1 | Recall | Precision | Brier | ECE |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    if not metrics_df.empty:
        for row in metrics_df.sort_values(["validation_policy", "pr_auc"], ascending=[True, False]).to_dict("records"):
            lines.append(
                f"| `{row['validation_policy']}` | `{row['model_name']}` | {int(row['test_rows'])} | "
                f"{int(row['test_animals'])} | {int(row['test_positive'])} | {row['roc_auc']:.4f} | "
                f"{row['pr_auc']:.4f} | {row['f1']:.4f} | {row['recall']:.4f} | {row['precision']:.4f} | "
                f"{row['brier_score']:.4f} | {row['expected_calibration_error']:.4f} |"
            )
    if not skipped_df.empty:
        lines.extend(["", "## Skipped Splits", "", "| Validation | Reason | Train pos | Test pos |", "|---|---|---:|---:|"])
        for row in skipped_df.to_dict("records"):
            lines.append(
                f"| `{row.get('validation_policy', '')}` | {row.get('reason', '')} | "
                f"{int(row.get('train_positive', 0) or 0)} | {int(row.get('test_positive', 0) or 0)} |"
            )
    lines.extend(
        [
            "",
            "## Decision",
            "",
            "- If animal/source/cohort holdout performance is far below time split, the model is not policy-ready.",
            "- Treat the current model as diagnostic until external-source transfer improves.",
        ]
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run strict validation splits for the payload-enriched baseline.")
    parser.add_argument("--rules", default=str(DEFAULT_RULES), help="Path to baseline model rules YAML.")
    args = parser.parse_args()
    rules_path = Path(args.rules)
    if not rules_path.is_absolute():
        rules_path = PROJECT_ROOT / rules_path
    rules = BT.load_rules(rules_path)

    df = pd.read_csv(path_from_root(rules["input"]["model_ready_csv"]), low_memory=False)
    target_label = rules.get("strict_validation", {}).get("target", rules["targets"]["primary_target"])
    y = pd.to_numeric(df[target_label], errors="coerce")
    valid_mask = y.isin([0, 1])

    numeric_features = rules["features"]["numeric"]
    categorical_features = rules["features"]["variants"]["no_source_code"]["categorical"]
    feature_df = BT.normalize_feature_frame(df, numeric_features, categorical_features)

    all_metrics: list[dict[str, Any]] = []
    all_scores: list[pd.DataFrame] = []
    all_skipped: list[dict[str, Any]] = []
    for policy, train_mask, test_mask, cutoff in build_splits(df, y, rules, valid_mask):
        metrics, scores, skipped = score_split(
            rules,
            df,
            feature_df,
            numeric_features,
            categorical_features,
            target_label,
            policy,
            cutoff,
            train_mask,
            test_mask,
        )
        all_metrics.extend(metrics)
        all_scores.extend(scores)
        all_skipped.extend(skipped)

    output_dir = path_from_root("data/processed/models/payload_enriched")
    metrics_path = output_dir / "strict_validation_metrics.csv"
    scores_path = output_dir / "strict_validation_risk_scores.csv"
    skipped_path = output_dir / "strict_validation_skipped_splits.csv"
    report_path = path_from_root("reports/strict_validation_payload_enriched_report.md")
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics_df = pd.DataFrame(all_metrics)
    scores_df = pd.concat(all_scores, ignore_index=True) if all_scores else pd.DataFrame()
    skipped_df = pd.DataFrame(all_skipped)
    metrics_df.to_csv(metrics_path, index=False)
    scores_df.to_csv(scores_path, index=False)
    skipped_df.to_csv(skipped_path, index=False)
    write_report(metrics_df, skipped_df, report_path)
    print(f"wrote {metrics_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {scores_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {skipped_path.relative_to(PROJECT_ROOT)}")
    print(f"wrote {report_path.relative_to(PROJECT_ROOT)}")
    if not metrics_df.empty:
        best = metrics_df.sort_values("pr_auc", ascending=False).iloc[0]
        print(f"best_strict={best['validation_policy']} {best['model_name']} pr_auc={best['pr_auc']:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
