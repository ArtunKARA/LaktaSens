from __future__ import annotations

import json
from dataclasses import replace
from datetime import datetime
from pathlib import Path
from time import perf_counter
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import clone
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    mean_absolute_error,
    mean_squared_error,
    precision_recall_curve,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import GroupKFold, StratifiedGroupKFold

from config import FEATURE_GROUP_CATEGORICALS, FEATURE_GROUPS, ProjectATrainingConfig
from data import load_project_a_dataset
from models.registry import make_model_specs as make_registered_model_specs


def _one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:  # pragma: no cover
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_feature_frame(frame: pd.DataFrame, config: ProjectATrainingConfig) -> pd.DataFrame:
    features = frame.copy()
    for column in config.numeric_features:
        if column not in features:
            features[column] = np.nan
        features[column] = pd.to_numeric(features[column], errors="coerce")
    for column in config.categorical_features:
        if column not in features:
            features[column] = "unknown"
        features[column] = features[column].fillna("unknown").astype(str)
    return features[config.numeric_features + config.categorical_features]


def make_preprocessor(config: ProjectATrainingConfig, scale_numeric: bool) -> ColumnTransformer:
    numeric_steps: list[tuple[str, Any]] = [("imputer", SimpleImputer(strategy="median", keep_empty_features=True))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))
    transformers: list[tuple[str, Any, list[str]]] = [
        ("num", Pipeline(numeric_steps), config.numeric_features),
        ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", _one_hot_encoder())]), config.categorical_features),
    ]
    return ColumnTransformer(transformers, remainder="drop", verbose_feature_names_out=False)


def split_dataset(frame: pd.DataFrame, config: ProjectATrainingConfig) -> tuple[pd.DataFrame, pd.DataFrame]:
    if config.split_method == "time":
        dates = sorted(frame["record_date"].dropna().unique())
        test_count = max(1, int(np.ceil(len(dates) * config.test_size)))
        test_dates = set(dates[-test_count:])
        train = frame[~frame["record_date"].isin(test_dates)].copy()
        test = frame[frame["record_date"].isin(test_dates)].copy()
    elif config.split_method == "cow_hash":
        rng = np.random.default_rng(config.random_state)
        cows = np.array(sorted(frame["cow_id"].dropna().unique()))
        rng.shuffle(cows)
        test_count = max(1, int(np.ceil(len(cows) * config.test_size)))
        test_cows = set(cows[:test_count])
        train = frame[~frame["cow_id"].isin(test_cows)].copy()
        test = frame[frame["cow_id"].isin(test_cows)].copy()
    else:
        raise ValueError(f"Unknown split_method: {config.split_method}")
    if train.empty or test.empty:
        raise ValueError("Train/test split produced an empty set. Change split_method or test_size.")
    return train, test


def split_train_validation_test(
    frame: pd.DataFrame,
    config: ProjectATrainingConfig,
) -> tuple[pd.DataFrame, pd.DataFrame | None, pd.DataFrame]:
    if config.validation_size <= 0:
        train, test = split_dataset(frame, config)
        return train, None, test
    if config.validation_size + config.test_size >= 1:
        raise ValueError("validation_size + test_size must be less than 1.")

    if config.split_method == "time":
        dates = sorted(frame["record_date"].dropna().unique())
        test_count = max(1, int(np.ceil(len(dates) * config.test_size)))
        validation_count = max(1, int(np.ceil(len(dates) * config.validation_size)))
        if len(dates) <= test_count + validation_count:
            raise ValueError("Not enough distinct dates for train/validation/test split.")
        test_dates = set(dates[-test_count:])
        validation_dates = set(dates[-(test_count + validation_count):-test_count])
        train = frame[~frame["record_date"].isin(test_dates | validation_dates)].copy()
        validation = frame[frame["record_date"].isin(validation_dates)].copy()
        test = frame[frame["record_date"].isin(test_dates)].copy()
    elif config.split_method == "cow_hash":
        rng = np.random.default_rng(config.random_state)
        cows = np.array(sorted(frame["cow_id"].dropna().unique()))
        rng.shuffle(cows)
        test_count = max(1, int(np.ceil(len(cows) * config.test_size)))
        validation_count = max(1, int(np.ceil(len(cows) * config.validation_size)))
        if len(cows) <= test_count + validation_count:
            raise ValueError("Not enough cows for train/validation/test split.")
        test_cows = set(cows[:test_count])
        validation_cows = set(cows[test_count:test_count + validation_count])
        train = frame[~frame["cow_id"].isin(test_cows | validation_cows)].copy()
        validation = frame[frame["cow_id"].isin(validation_cows)].copy()
        test = frame[frame["cow_id"].isin(test_cows)].copy()
    elif config.split_method == "cow_stratified":
        cows = np.array(sorted(frame["cow_id"].dropna().unique()))
        test_count = max(1, int(np.ceil(len(cows) * config.test_size)))
        validation_count = max(1, int(np.ceil(len(cows) * config.validation_size)))
        if len(cows) <= test_count + validation_count:
            raise ValueError("Not enough cows for train/validation/test split.")

        group_sizes = frame.groupby("cow_id").size().reindex(cows, fill_value=0)
        classes = sorted(frame[config.target_name].dropna().unique())
        group_class_counts = pd.crosstab(frame["cow_id"], frame[config.target_name]).reindex(
            index=cows,
            columns=classes,
            fill_value=0,
        )
        overall_class_share = group_class_counts.sum(axis=0) / max(group_class_counts.values.sum(), 1)
        target_row_shares = {
            "train": 1 - config.validation_size - config.test_size,
            "validation": config.validation_size,
            "test": config.test_size,
        }
        rng = np.random.default_rng(config.random_state)
        best_assignment: tuple[set[Any], set[Any], set[Any]] | None = None
        best_score = float("inf")
        for _ in range(2000):
            shuffled = rng.permutation(cows)
            test_cows = set(shuffled[:test_count])
            validation_cows = set(shuffled[test_count:test_count + validation_count])
            train_cows = set(shuffled[test_count + validation_count:])
            splits = {
                "train": train_cows,
                "validation": validation_cows,
                "test": test_cows,
            }
            score = 0.0
            valid = True
            for split_name, split_cows in splits.items():
                split_rows = float(group_sizes.reindex(list(split_cows), fill_value=0).sum())
                row_share = split_rows / max(float(len(frame)), 1.0)
                score += abs(row_share - target_row_shares[split_name])
                if config.target_type in {"binary", "multiclass"}:
                    split_class_counts = group_class_counts.reindex(list(split_cows), fill_value=0).sum(axis=0)
                    if (split_class_counts == 0).any():
                        valid = False
                        break
                    split_class_share = split_class_counts / max(float(split_class_counts.sum()), 1.0)
                    score += float(np.abs(split_class_share - overall_class_share).sum())
            if valid and score < best_score:
                best_score = score
                best_assignment = train_cows, validation_cows, test_cows
        if best_assignment is None:
            raise ValueError(
                "Could not create a cow_stratified split with every class in train, validation, and test. "
                "Add more positive cows, reduce split sizes, or use a different target."
            )
        train_cows, validation_cows, test_cows = best_assignment
        train = frame[frame["cow_id"].isin(train_cows)].copy()
        validation = frame[frame["cow_id"].isin(validation_cows)].copy()
        test = frame[frame["cow_id"].isin(test_cows)].copy()
    else:
        raise ValueError(f"Unknown split_method: {config.split_method}")

    if train.empty or validation.empty or test.empty:
        raise ValueError("Train/validation/test split produced an empty set. Change split sizes.")
    if config.target_type == "binary":
        for split_name, split_frame in [("train", train), ("validation", validation), ("test", test)]:
            if split_frame[config.target_name].nunique(dropna=True) < 2:
                raise ValueError(
                    f"{split_name} split contains only one class for {config.target_name}. "
                    "Use split_method='cow_stratified', reduce split sizes, or add more positive examples."
                )
    return train, validation, test


def choose_threshold(y_true: np.ndarray, probabilities: np.ndarray) -> float:
    if len(np.unique(y_true)) < 2:
        return 0.5
    precision, recall, thresholds = precision_recall_curve(y_true, probabilities)
    if len(thresholds) == 0:
        return 0.5
    f1_values = (2 * precision[:-1] * recall[:-1]) / np.maximum(precision[:-1] + recall[:-1], 1e-12)
    return float(thresholds[int(np.nanargmax(f1_values))])


def _positive_class_scores(pipeline: Pipeline, x_frame: pd.DataFrame) -> np.ndarray:
    if hasattr(pipeline, "predict_proba"):
        probabilities = pipeline.predict_proba(x_frame)
        model = pipeline.named_steps["model"]
        classes = list(getattr(model, "classes_", []))
        if probabilities.shape[1] == 1:
            return np.ones(len(x_frame)) if classes and classes[0] == 1 else np.zeros(len(x_frame))
        if 1 in classes:
            return probabilities[:, classes.index(1)]
        return probabilities[:, -1]
    scores = np.asarray(pipeline.decision_function(x_frame), dtype=float)
    return 1.0 / (1.0 + np.exp(-np.clip(scores, -50, 50)))


def _safe_roc_auc(y_true: np.ndarray, scores: np.ndarray) -> float:
    try:
        if len(np.unique(y_true)) < 2:
            return float("nan")
        return float(roc_auc_score(y_true, scores))
    except Exception:
        return float("nan")


def _safe_pr_auc(y_true: np.ndarray, scores: np.ndarray) -> float:
    try:
        if len(np.unique(y_true)) < 2:
            return float("nan")
        return float(average_precision_score(y_true, scores))
    except Exception:
        return float("nan")


def _safe_brier_score(y_true: np.ndarray, scores: np.ndarray) -> float:
    try:
        return float(brier_score_loss(y_true, np.clip(scores, 0.0, 1.0)))
    except Exception:
        return float("nan")


def _safe_log_loss(y_true: np.ndarray, scores: np.ndarray) -> float:
    try:
        return float(log_loss(y_true, np.clip(scores, 1e-7, 1 - 1e-7), labels=[0, 1]))
    except Exception:
        return float("nan")


def expected_calibration_error(y_true: np.ndarray, scores: np.ndarray, n_bins: int = 10) -> float:
    y_array = np.asarray(y_true)
    score_array = np.clip(np.asarray(scores, dtype=float), 0.0, 1.0)
    bin_indices = np.minimum((score_array * n_bins).astype(int), n_bins - 1)
    error = 0.0
    for bin_index in range(n_bins):
        mask = bin_indices == bin_index
        if not np.any(mask):
            continue
        error += float(np.mean(mask)) * abs(float(np.mean(y_array[mask])) - float(np.mean(score_array[mask])))
    return error


def evaluate_model(
    model_name: str,
    pipeline: Pipeline,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    y_test: pd.Series,
    config: ProjectATrainingConfig,
    x_threshold: pd.DataFrame | None = None,
    y_threshold: pd.Series | None = None,
    decision_threshold: float | None = None,
) -> tuple[dict[str, Any], pd.DataFrame]:
    task = config.target_type
    if task == "regression":
        prediction = pipeline.predict(x_test)
        metrics = {
            "model_name": model_name,
            "target_name": config.target_name,
            "target_type": task,
            "train_rows": int(len(y_train)),
            "test_rows": int(len(y_test)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, prediction))),
            "mae": float(mean_absolute_error(y_test, prediction)),
            "r2": float(r2_score(y_test, prediction)),
        }
        predictions = pd.DataFrame({"model_name": model_name, "y_true": y_test.to_numpy(), "y_pred": prediction}, index=y_test.index)
        return metrics, predictions

    if task == "binary":
        test_score = _positive_class_scores(pipeline, x_test)
        threshold_x = x_threshold if x_threshold is not None else x_train
        threshold_y = y_threshold if y_threshold is not None else y_train
        threshold = decision_threshold
        if threshold is None:
            threshold_score = _positive_class_scores(pipeline, threshold_x)
            threshold = choose_threshold(threshold_y.to_numpy(), threshold_score)
        prediction = (test_score >= threshold).astype(int)
        metrics = {
            "model_name": model_name,
            "target_name": config.target_name,
            "target_type": task,
            "train_rows": int(len(y_train)),
            "test_rows": int(len(y_test)),
            "train_positive": int(np.sum(y_train)),
            "test_positive": int(np.sum(y_test)),
            "threshold_rows": int(len(threshold_y)),
            "threshold_positive": int(np.sum(threshold_y)),
            "threshold": threshold,
            "roc_auc": _safe_roc_auc(y_test.to_numpy(), test_score),
            "pr_auc": _safe_pr_auc(y_test.to_numpy(), test_score),
            "brier_score": _safe_brier_score(y_test.to_numpy(), test_score),
            "log_loss": _safe_log_loss(y_test.to_numpy(), test_score),
            "ece": expected_calibration_error(y_test.to_numpy(), test_score),
            "f1": float(f1_score(y_test, prediction, zero_division=0)),
            "precision": float(precision_score(y_test, prediction, zero_division=0)),
            "recall": float(recall_score(y_test, prediction, zero_division=0)),
            "accuracy": float(accuracy_score(y_test, prediction)),
        }
        predictions = pd.DataFrame({"model_name": model_name, "y_true": y_test.to_numpy(), "y_pred": prediction, "y_score": test_score}, index=y_test.index)
        return metrics, predictions

    prediction = pipeline.predict(x_test)
    metrics = {
        "model_name": model_name,
        "target_name": config.target_name,
        "target_type": task,
        "train_rows": int(len(y_train)),
        "test_rows": int(len(y_test)),
        "f1_macro": float(f1_score(y_test, prediction, average="macro", zero_division=0)),
        "f1_weighted": float(f1_score(y_test, prediction, average="weighted", zero_division=0)),
        "accuracy": float(accuracy_score(y_test, prediction)),
    }
    if hasattr(pipeline, "predict_proba") and len(np.unique(y_test)) > 1:
        try:
            metrics["roc_auc_ovr"] = float(roc_auc_score(y_test, pipeline.predict_proba(x_test), multi_class="ovr"))
        except Exception:
            metrics["roc_auc_ovr"] = float("nan")
    predictions = pd.DataFrame({"model_name": model_name, "y_true": y_test.to_numpy(), "y_pred": prediction}, index=y_test.index)
    return metrics, predictions


def run_group_cross_validation(
    pipeline: Pipeline,
    model_name: str,
    x_frame: pd.DataFrame,
    y: pd.Series,
    groups: pd.Series,
    config: ProjectATrainingConfig,
) -> tuple[dict[str, Any], pd.DataFrame, pd.DataFrame]:
    unique_groups = int(groups.nunique(dropna=True))
    if config.cv_folds < 2:
        raise ValueError("cv_folds must be at least 2.")
    if unique_groups < config.cv_folds:
        raise ValueError(f"Group CV requires at least {config.cv_folds} cows; found {unique_groups}.")
    if config.target_type in {"binary", "multiclass"}:
        splitter = StratifiedGroupKFold(
            n_splits=config.cv_folds,
            shuffle=True,
            random_state=config.random_state,
        )
    else:
        splitter = GroupKFold(n_splits=config.cv_folds)

    fold_metrics: list[dict[str, Any]] = []
    prediction_frames: list[pd.DataFrame] = []
    total_fit_seconds = 0.0
    if config.cv_repeats < 1:
        raise ValueError("cv_repeats must be at least 1.")
    split_sets = []
    for repeat in range(1, config.cv_repeats + 1):
        if config.target_type in {"binary", "multiclass"}:
            repeat_splitter = StratifiedGroupKFold(
                n_splits=config.cv_folds,
                shuffle=True,
                random_state=config.random_state + repeat - 1,
            )
        else:
            repeat_splitter = splitter
        split_sets.extend(
            (repeat, fold, train_indices, validation_indices)
            for fold, (train_indices, validation_indices) in enumerate(
                repeat_splitter.split(x_frame, y, groups),
                start=1,
            )
        )

    for repeat, fold, train_indices, validation_indices in split_sets:
        train_groups = set(groups.iloc[train_indices])
        validation_groups = set(groups.iloc[validation_indices])
        if train_groups & validation_groups:
            raise RuntimeError("Cow leakage detected inside group cross-validation.")
        fold_pipeline = clone(pipeline)
        fit_started_at = perf_counter()
        fold_pipeline.fit(x_frame.iloc[train_indices], y.iloc[train_indices])
        fold_fit_seconds = perf_counter() - fit_started_at
        total_fit_seconds += fold_fit_seconds
        metrics, predictions = evaluate_model(
            model_name=model_name,
            pipeline=fold_pipeline,
            x_train=x_frame.iloc[train_indices],
            y_train=y.iloc[train_indices],
            x_test=x_frame.iloc[validation_indices],
            y_test=y.iloc[validation_indices],
            config=config,
        )
        metrics["fold"] = fold
        metrics["repeat"] = repeat
        metrics["fit_seconds"] = fold_fit_seconds
        metrics["train_cows"] = len(train_groups)
        metrics["validation_cows"] = len(validation_groups)
        fold_metrics.append(metrics)
        predictions = predictions.reset_index(drop=True)
        predictions["split"] = "cv_oof"
        predictions["fold"] = fold
        predictions["repeat"] = repeat
        predictions["cow_id"] = groups.iloc[validation_indices].to_numpy()
        prediction_frames.append(predictions)

    fold_frame = pd.DataFrame(fold_metrics)
    metric_names = {
        "binary": [
            "roc_auc",
            "pr_auc",
            "brier_score",
            "log_loss",
            "ece",
            "f1",
            "precision",
            "recall",
            "accuracy",
            "threshold",
        ],
        "multiclass": ["f1_macro", "f1_weighted", "accuracy", "roc_auc_ovr"],
        "regression": ["rmse", "mae", "r2"],
    }[config.target_type]
    summary: dict[str, Any] = {
        "cv_folds_completed": int(len(fold_frame)),
        "cv_repeats_completed": int(config.cv_repeats),
        "cv_rows": int(len(y)),
        "cv_cows": unique_groups,
        "cv_fit_seconds": total_fit_seconds,
    }
    for metric_name in metric_names:
        if metric_name in fold_frame:
            summary[f"cv_{metric_name}_mean"] = float(fold_frame[metric_name].mean())
            summary[f"cv_{metric_name}_std"] = float(fold_frame[metric_name].std(ddof=1))

    predictions = pd.concat(prediction_frames, ignore_index=True)
    if config.target_type == "binary":
        cv_threshold = choose_threshold(
            predictions["y_true"].to_numpy(),
            predictions["y_score"].to_numpy(),
        )
        predictions["y_pred"] = (predictions["y_score"] >= cv_threshold).astype(int)
        summary["cv_oof_threshold"] = cv_threshold
        summary["cv_oof_f1"] = float(f1_score(predictions["y_true"], predictions["y_pred"], zero_division=0))
    return summary, predictions, fold_frame


def _fit_probability_calibrator(method: str, scores: np.ndarray, y_true: np.ndarray) -> Any:
    clipped_scores = np.clip(np.asarray(scores, dtype=float), 0.0, 1.0)
    if method == "isotonic":
        calibrator = IsotonicRegression(y_min=0.0, y_max=1.0, out_of_bounds="clip")
        calibrator.fit(clipped_scores, y_true)
        return calibrator
    if method == "sigmoid":
        calibrator = LogisticRegression(random_state=42, max_iter=1000)
        calibrator.fit(clipped_scores.reshape(-1, 1), y_true)
        return calibrator
    raise ValueError(f"Unknown calibration_method: {method}")


def _apply_probability_calibrator(calibrator: Any, method: str, scores: np.ndarray) -> np.ndarray:
    clipped_scores = np.clip(np.asarray(scores, dtype=float), 0.0, 1.0)
    if method == "isotonic":
        return np.asarray(calibrator.predict(clipped_scores), dtype=float)
    return np.asarray(calibrator.predict_proba(clipped_scores.reshape(-1, 1))[:, 1], dtype=float)


def _probability_metric_row(
    y_true: np.ndarray,
    scores: np.ndarray,
    threshold: float,
    split: str,
    probability_type: str,
) -> dict[str, Any]:
    prediction = (scores >= threshold).astype(int)
    return {
        "split": split,
        "probability_type": probability_type,
        "threshold": threshold,
        "brier_score": _safe_brier_score(y_true, scores),
        "log_loss": _safe_log_loss(y_true, scores),
        "ece": expected_calibration_error(y_true, scores),
        "pr_auc": _safe_pr_auc(y_true, scores),
        "roc_auc": _safe_roc_auc(y_true, scores),
        "f1": float(f1_score(y_true, prediction, zero_division=0)),
        "precision": float(precision_score(y_true, prediction, zero_division=0)),
        "recall": float(recall_score(y_true, prediction, zero_division=0)),
    }


def calibrate_best_binary_model(result: dict[str, Any]) -> None:
    config: ProjectATrainingConfig = result["config"]
    best_model_name = result["best_model_name"]
    predictions = result["predictions"]
    oof = predictions[
        (predictions["model_name"] == best_model_name) & (predictions["split"] == "cv_oof")
    ].copy()
    test = predictions[
        (predictions["model_name"] == best_model_name) & (predictions["split"] == "test")
    ].copy()
    if oof.empty or test.empty:
        return
    calibrator = _fit_probability_calibrator(
        config.calibration_method,
        oof["y_score"].to_numpy(),
        oof["y_true"].to_numpy(),
    )
    oof["y_score_raw"] = oof["y_score"]
    test["y_score_raw"] = test["y_score"]
    oof["y_score_calibrated"] = _apply_probability_calibrator(
        calibrator,
        config.calibration_method,
        oof["y_score_raw"].to_numpy(),
    )
    test["y_score_calibrated"] = _apply_probability_calibrator(
        calibrator,
        config.calibration_method,
        test["y_score_raw"].to_numpy(),
    )
    raw_threshold = choose_threshold(oof["y_true"].to_numpy(), oof["y_score_raw"].to_numpy())
    calibrated_threshold = choose_threshold(
        oof["y_true"].to_numpy(),
        oof["y_score_calibrated"].to_numpy(),
    )
    oof["y_pred_raw"] = (oof["y_score_raw"] >= raw_threshold).astype(int)
    test["y_pred_raw"] = (test["y_score_raw"] >= raw_threshold).astype(int)
    oof["y_pred_calibrated"] = (oof["y_score_calibrated"] >= calibrated_threshold).astype(int)
    test["y_pred_calibrated"] = (test["y_score_calibrated"] >= calibrated_threshold).astype(int)
    calibration_metrics = pd.DataFrame([
        _probability_metric_row(
            oof["y_true"].to_numpy(),
            oof["y_score_raw"].to_numpy(),
            raw_threshold,
            "cv_oof",
            "raw",
        ),
        _probability_metric_row(
            oof["y_true"].to_numpy(),
            oof["y_score_calibrated"].to_numpy(),
            calibrated_threshold,
            "cv_oof",
            "calibrated",
        ),
        _probability_metric_row(
            test["y_true"].to_numpy(),
            test["y_score_raw"].to_numpy(),
            raw_threshold,
            "test",
            "raw",
        ),
        _probability_metric_row(
            test["y_true"].to_numpy(),
            test["y_score_calibrated"].to_numpy(),
            calibrated_threshold,
            "test",
            "calibrated",
        ),
    ])
    result["probability_calibrator"] = calibrator
    result["calibration_method"] = config.calibration_method
    result["calibrated_predictions"] = pd.concat([oof, test], ignore_index=True)
    result["calibration_metrics"] = calibration_metrics
    result["calibrated_threshold"] = calibrated_threshold
    calibrated_test = calibration_metrics[
        (calibration_metrics["split"] == "test")
        & (calibration_metrics["probability_type"] == "calibrated")
    ].iloc[0]
    best_mask = result["metrics"]["model_name"] == best_model_name
    for metric_name in ["brier_score", "log_loss", "ece", "pr_auc", "f1", "precision", "recall"]:
        result["metrics"].loc[best_mask, f"calibrated_{metric_name}"] = calibrated_test[metric_name]


def _prefix_evaluation_metrics(metrics: dict[str, Any], prefix: str) -> dict[str, Any]:
    passthrough = {"model_name", "target_name", "target_type"}
    renamed = {
        "test_rows": "rows",
        "test_positive": "positive",
    }
    prefixed: dict[str, Any] = {}
    for key, value in metrics.items():
        if key in passthrough:
            continue
        prefixed_key = renamed.get(key, key)
        prefixed[f"{prefix}_{prefixed_key}"] = value
    return prefixed


def _selection_metric_column(metrics: pd.DataFrame, config: ProjectATrainingConfig) -> str:
    metric = config.metric_to_select
    cv_metric = f"cv_{metric}_mean"
    if config.enable_group_cv and cv_metric in metrics and metrics[cv_metric].notna().any():
        return cv_metric
    validation_metric = f"validation_{metric}"
    if validation_metric in metrics and metrics[validation_metric].notna().any():
        return validation_metric
    return metric


def _lower_is_better(metric: str) -> bool:
    return "rmse" in metric or "mae" in metric


def select_best(metrics: pd.DataFrame, config: ProjectATrainingConfig, metric: str | None = None) -> str:
    metric = metric or config.metric_to_select
    if metric not in metrics:
        raise ValueError(f"Selection metric {metric!r} is not available in metrics.")
    ordered = metrics.dropna(subset=[metric]).copy()
    if ordered.empty:
        return str(metrics.iloc[0]["model_name"])
    tie_breakers = {
        "binary": ["pr_auc", "f1", "recall", "precision", "accuracy", "roc_auc"],
        "multiclass": ["f1_macro", "f1_weighted", "accuracy", "roc_auc_ovr"],
        "regression": ["rmse", "mae", "r2"],
    }
    if metric.startswith("cv_"):
        candidate_columns = [f"cv_{column}_mean" for column in tie_breakers.get(config.target_type, [])]
    else:
        metric_prefix = "validation_" if metric.startswith("validation_") else ""
        candidate_columns = [f"{metric_prefix}{column}" for column in tie_breakers.get(config.target_type, [])]
    sort_columns = [metric]
    sort_columns.extend(
        column
        for column in candidate_columns
        if column != metric
    )
    sort_columns = [column for column in sort_columns if column in ordered]
    ascending = [_lower_is_better(column) for column in sort_columns]
    return str(ordered.sort_values(sort_columns, ascending=ascending).iloc[0]["model_name"])


def save_outputs(result: dict[str, Any], config: ProjectATrainingConfig) -> None:
    run_name = config.run_name or f"project_a_{config.target_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    output_dir = Path(config.artifact_dir) / run_name
    output_dir.mkdir(parents=True, exist_ok=True)
    result["metrics"].to_csv(output_dir / "metrics.csv", index=False)
    result["predictions"].to_csv(output_dir / "predictions.csv", index=False)
    if not result.get("cv_fold_metrics", pd.DataFrame()).empty:
        result["cv_fold_metrics"].to_csv(output_dir / "cv_fold_metrics.csv", index=False)
    if not result.get("calibration_metrics", pd.DataFrame()).empty:
        result["calibration_metrics"].to_csv(output_dir / "calibration_metrics.csv", index=False)
    if not result.get("calibrated_predictions", pd.DataFrame()).empty:
        result["calibrated_predictions"].to_csv(output_dir / "calibrated_predictions.csv", index=False)
    with (output_dir / "config.json").open("w", encoding="utf-8") as file:
        json.dump({
            "target_name": config.target_name,
            "target_type": config.target_type,
            "split_method": config.split_method,
            "test_size": config.test_size,
            "validation_size": config.validation_size,
            "enable_group_cv": config.enable_group_cv,
            "cv_folds": config.cv_folds,
            "cv_repeats": config.cv_repeats,
            "calibrate_probabilities": config.calibrate_probabilities,
            "calibration_method": config.calibration_method,
            "primary_metric": config.metric_to_select,
            "selection_metric": result.get("selection_metric"),
            "best_threshold": result.get("best_threshold"),
            "model_names": config.model_names,
            "model_params": config.model_params,
            "skipped_models": result.get("skipped_models", []),
            "numeric_features": config.numeric_features,
            "categorical_features": config.categorical_features,
            "allowed_data_origins": config.allowed_data_origins,
            "refit_full_data": config.refit_full_data,
            "final_fit_rows": result.get("final_fit_rows"),
        }, file, indent=2)
    best_model_name = result["best_model_name"]
    model_to_dump = result.get("final_model") or result["models"][best_model_name]
    suffix = "_full_data" if result.get("final_model") is not None else ""
    dump(model_to_dump, output_dir / f"{best_model_name}{suffix}.joblib")
    if result.get("probability_calibrator") is not None:
        dump(result["probability_calibrator"], output_dir / f"{best_model_name}_probability_calibrator.joblib")
    result["artifact_dir"] = output_dir


def run_experiment(config: ProjectATrainingConfig, database_url: str | None = None, frame: pd.DataFrame | None = None) -> dict[str, Any]:
    data = frame.copy() if frame is not None else load_project_a_dataset(database_url=database_url, schema=config.schema)
    if config.allowed_data_origins is not None:
        if "data_origin" not in data:
            raise ValueError("allowed_data_origins requires a data_origin column.")
        data = data[data["data_origin"].isin(config.allowed_data_origins)].copy()
    if config.target_name not in data:
        raise ValueError(f"Target column not found: {config.target_name}")
    data = data.dropna(subset=[config.target_name]).copy()
    if config.target_type in {"binary"}:
        data[config.target_name] = pd.to_numeric(data[config.target_name], errors="coerce").fillna(0).astype(int)
    if config.target_type == "regression":
        data[config.target_name] = pd.to_numeric(data[config.target_name], errors="coerce")
        data = data.dropna(subset=[config.target_name]).copy()

    train_frame, validation_frame, test_frame = split_train_validation_test(data, config)
    x_train = build_feature_frame(train_frame, config)
    x_validation = build_feature_frame(validation_frame, config) if validation_frame is not None else None
    x_test = build_feature_frame(test_frame, config)
    y_train = train_frame[config.target_name]
    y_validation = validation_frame[config.target_name] if validation_frame is not None else None
    y_test = test_frame[config.target_name]
    if config.enable_group_cv:
        development_frame = pd.concat(
            [part for part in [train_frame, validation_frame] if part is not None],
            ignore_index=True,
        )
        x_fit = build_feature_frame(development_frame, config)
        y_fit = development_frame[config.target_name]
        fit_groups = development_frame["cow_id"]
    else:
        development_frame = train_frame
        x_fit = x_train
        y_fit = y_train
        fit_groups = train_frame["cow_id"]

    metrics_rows: list[dict[str, Any]] = []
    prediction_frames: list[pd.DataFrame] = []
    cv_fold_metric_frames: list[pd.DataFrame] = []
    models: dict[str, Pipeline] = {}
    model_info: dict[str, dict[str, Any]] = {}
    skipped_models: list[dict[str, Any]] = []
    if config.target_type in {"binary", "multiclass"} and y_fit.nunique(dropna=True) < 2:
        model_specs = [{
            "model_name": "dummy_most_frequent",
            "scale_numeric": False,
            "estimator": DummyClassifier(strategy="most_frequent"),
            "source": "sklearn",
            "family": "dummy",
        }]
    else:
        model_specs, skipped_models = make_registered_model_specs(
            task_type=config.target_type,
            model_names=config.model_names,
            random_state=config.random_state,
            model_params=config.model_params,
            y_train=y_fit,
            skip_unavailable_models=config.skip_unavailable_models,
        )

    for spec in model_specs:
        if isinstance(spec, dict):
            model_name = spec["model_name"]
            estimator = spec["estimator"]
            scale_numeric = bool(spec["scale_numeric"])
            model_source = spec.get("source", "unknown")
            model_family = spec.get("family", "unknown")
        else:
            model_name = spec.model_name
            estimator = spec.estimator
            scale_numeric = spec.scale_numeric
            model_source = spec.source
            model_family = spec.family
        pipeline = Pipeline([
            ("preprocessor", make_preprocessor(config, scale_numeric)),
            ("model", estimator),
        ])
        cv_metrics: dict[str, Any] = {}
        cv_predictions = pd.DataFrame()
        if config.enable_group_cv:
            cv_metrics, cv_predictions, cv_fold_metrics = run_group_cross_validation(
                pipeline=pipeline,
                model_name=model_name,
                x_frame=x_fit,
                y=y_fit,
                groups=fit_groups,
                config=config,
            )
            cv_fold_metric_frames.append(cv_fold_metrics)
        fit_started_at = perf_counter()
        pipeline.fit(x_fit, y_fit)
        fit_seconds = perf_counter() - fit_started_at
        if config.enable_group_cv:
            metrics, predictions = evaluate_model(
                model_name,
                pipeline,
                x_fit,
                y_fit,
                x_test,
                y_test,
                config,
                decision_threshold=cv_metrics.get("cv_oof_threshold"),
            )
            metrics.update(cv_metrics)
            validation_predictions = pd.DataFrame()
        elif x_validation is not None and y_validation is not None:
            validation_metrics, validation_predictions = evaluate_model(
                model_name,
                pipeline,
                x_train,
                y_train,
                x_validation,
                y_validation,
                config,
                x_threshold=x_validation,
                y_threshold=y_validation,
            )
            metrics, predictions = evaluate_model(
                model_name,
                pipeline,
                x_train,
                y_train,
                x_test,
                y_test,
                config,
                x_threshold=x_validation,
                y_threshold=y_validation,
            )
            metrics.update(_prefix_evaluation_metrics(validation_metrics, "validation"))
            validation_predictions = validation_predictions.reset_index(drop=True)
            validation_predictions["split"] = "validation"
        else:
            validation_predictions = pd.DataFrame()
            metrics, predictions = evaluate_model(model_name, pipeline, x_train, y_train, x_test, y_test, config)
        predictions = predictions.reset_index(drop=True)
        predictions["split"] = "test"
        metrics["model_source"] = model_source
        metrics["model_family"] = model_family
        metrics["fit_seconds"] = fit_seconds
        metrics_rows.append(metrics)
        if not cv_predictions.empty:
            prediction_frames.append(cv_predictions)
        if not validation_predictions.empty:
            prediction_frames.append(validation_predictions)
        prediction_frames.append(predictions)
        models[model_name] = pipeline
        model_info[model_name] = {"estimator": estimator, "scale_numeric": scale_numeric}

    result = {
        "config": config,
        "data": data,
        "train_frame": train_frame,
        "validation_frame": validation_frame,
        "development_frame": development_frame,
        "test_frame": test_frame,
        "metrics": pd.DataFrame(metrics_rows),
        "predictions": pd.concat(prediction_frames, ignore_index=True),
        "cv_fold_metrics": (
            pd.concat(cv_fold_metric_frames, ignore_index=True)
            if cv_fold_metric_frames
            else pd.DataFrame()
        ),
        "models": models,
        "skipped_models": skipped_models,
        "split_summary": {
            "total_rows": int(len(data)),
            "train_rows": int(len(train_frame)),
            "validation_rows": int(len(validation_frame)) if validation_frame is not None else 0,
            "test_rows": int(len(test_frame)),
            "development_rows": int(len(development_frame)),
            "development_cows": int(development_frame["cow_id"].nunique()),
            "cv_folds": config.cv_folds if config.enable_group_cv else 0,
            "cv_repeats": config.cv_repeats if config.enable_group_cv else 0,
            "train_positive": int(np.sum(y_train)) if config.target_type == "binary" else None,
            "validation_positive": int(np.sum(y_validation)) if config.target_type == "binary" and y_validation is not None else None,
            "test_positive": int(np.sum(y_test)) if config.target_type == "binary" else None,
        },
    }
    result["selection_metric"] = _selection_metric_column(result["metrics"], config)
    result["best_model_name"] = select_best(result["metrics"], config, result["selection_metric"])
    if config.target_type == "binary":
        best_metrics = result["metrics"][result["metrics"]["model_name"] == result["best_model_name"]].iloc[0]
        result["best_threshold"] = float(best_metrics["threshold"])
        if config.enable_group_cv and config.calibrate_probabilities:
            calibrate_best_binary_model(result)
    if config.refit_full_data:
        best_info = model_info[result["best_model_name"]]
        final_pipeline = Pipeline([
            ("preprocessor", make_preprocessor(config, bool(best_info["scale_numeric"]))),
            ("model", clone(best_info["estimator"])),
        ])
        final_fit_started_at = perf_counter()
        final_pipeline.fit(build_feature_frame(data, config), data[config.target_name])
        result["final_model"] = final_pipeline
        result["final_fit_rows"] = int(len(data))
        result["final_fit_seconds"] = perf_counter() - final_fit_started_at
        result["split_summary"]["final_refit_rows"] = int(len(data))
    if config.save_artifacts:
        save_outputs(result, config)
    return result


def ranked_model_names(result: dict[str, Any], top_n: int = 4) -> list[str]:
    metric = result["selection_metric"]
    metrics = result["metrics"].dropna(subset=[metric]).copy()
    metrics = metrics.sort_values(metric, ascending=_lower_is_better(metric))
    return metrics["model_name"].head(top_n).astype(str).tolist()


def run_repeated_top_model_cv(
    result: dict[str, Any],
    frame: pd.DataFrame,
    repeats: int = 5,
    top_n: int = 4,
) -> dict[str, Any]:
    model_names = ranked_model_names(result, top_n=top_n)
    config = replace(
        result["config"],
        model_names=model_names,
        cv_repeats=repeats,
        calibrate_probabilities=False,
        refit_full_data=False,
        save_artifacts=False,
    )
    repeated_result = run_experiment(config=config, frame=frame)
    repeated_result["top_model_names"] = model_names
    return repeated_result


def _study_metric_row(label: str, result: dict[str, Any], feature_count: int) -> dict[str, Any]:
    metrics = result["metrics"]
    model_name = result["best_model_name"]
    row = metrics[metrics["model_name"] == model_name].iloc[0]
    return {
        "feature_set": label,
        "feature_count": feature_count,
        "model_name": model_name,
        "cv_pr_auc_mean": row.get("cv_pr_auc_mean"),
        "cv_pr_auc_std": row.get("cv_pr_auc_std"),
        "cv_f1_mean": row.get("cv_f1_mean"),
        "cv_f1_std": row.get("cv_f1_std"),
        "cv_brier_score_mean": row.get("cv_brier_score_mean"),
        "test_pr_auc": row.get("pr_auc"),
        "test_f1": row.get("f1"),
        "test_brier_score": row.get("brier_score"),
    }


def run_feature_set_study(
    result: dict[str, Any],
    frame: pd.DataFrame,
    feature_sets: dict[str, tuple[list[str], list[str]]],
) -> dict[str, Any]:
    best_model_name = result["best_model_name"]
    study_results: dict[str, dict[str, Any]] = {}
    summary_rows: list[dict[str, Any]] = []
    for label, (numeric_features, categorical_features) in feature_sets.items():
        if label == "all_features":
            experiment_result = result
        else:
            study_config = replace(
                result["config"],
                model_names=[best_model_name],
                numeric_features=numeric_features,
                categorical_features=categorical_features,
                cv_repeats=1,
                calibrate_probabilities=False,
                refit_full_data=False,
                save_artifacts=False,
            )
            experiment_result = run_experiment(config=study_config, frame=frame)
        study_results[label] = experiment_result
        summary_rows.append(
            _study_metric_row(
                label,
                experiment_result,
                len(numeric_features) + len(categorical_features),
            )
        )
    return {
        "model_name": best_model_name,
        "summary": pd.DataFrame(summary_rows).sort_values("cv_pr_auc_mean", ascending=False),
        "results": study_results,
    }


def run_scc_ablation_study(result: dict[str, Any], frame: pd.DataFrame) -> dict[str, Any]:
    config: ProjectATrainingConfig = result["config"]
    return run_feature_set_study(
        result,
        frame,
        {
            "all_features": (config.numeric_features, config.categorical_features),
            "without_scc": (
                [feature for feature in config.numeric_features if feature != "scc"],
                config.categorical_features,
            ),
        },
    )


def run_feature_group_study(result: dict[str, Any], frame: pd.DataFrame) -> dict[str, Any]:
    config: ProjectATrainingConfig = result["config"]
    feature_sets = {
        "all_features": (config.numeric_features, config.categorical_features),
        **{
            group_name: (features, FEATURE_GROUP_CATEGORICALS[group_name])
            for group_name, features in FEATURE_GROUPS.items()
        },
    }
    return run_feature_set_study(result, frame, feature_sets)


def confusion_for_best(result: dict[str, Any]) -> np.ndarray | None:
    config: ProjectATrainingConfig = result["config"]
    if config.target_type == "regression":
        return None
    best = result["best_model_name"]
    pred = result["predictions"][result["predictions"]["model_name"] == best]
    if "split" in pred:
        pred = pred[pred["split"] == "test"]
    return confusion_matrix(pred["y_true"], pred["y_pred"])
    log_loss,
