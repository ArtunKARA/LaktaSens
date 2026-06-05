from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor, RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_recall_curve,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from config import ProjectBTrainingConfig
from data import load_project_b_dataset


def _one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:  # pragma: no cover
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_feature_frame(frame: pd.DataFrame, config: ProjectBTrainingConfig) -> pd.DataFrame:
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


def make_preprocessor(config: ProjectBTrainingConfig, scale_numeric: bool) -> ColumnTransformer:
    numeric_steps: list[tuple[str, Any]] = [("imputer", SimpleImputer(strategy="median", keep_empty_features=True))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))
    return ColumnTransformer(
        [
            ("num", Pipeline(numeric_steps), config.numeric_features),
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", _one_hot_encoder())]), config.categorical_features),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def split_dataset(frame: pd.DataFrame, config: ProjectBTrainingConfig) -> tuple[pd.DataFrame, pd.DataFrame]:
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


def make_model_specs(config: ProjectBTrainingConfig) -> list[dict[str, Any]]:
    specs: list[dict[str, Any]] = []
    requested = set(config.model_names)
    if config.target_type in {"binary", "multiclass"}:
        if "logistic_or_ridge" in requested:
            specs.append({
                "model_name": "logistic_regression",
                "scale_numeric": True,
                "estimator": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=config.random_state),
            })
        if "random_forest" in requested:
            specs.append({
                "model_name": "random_forest_classifier",
                "scale_numeric": False,
                "estimator": RandomForestClassifier(n_estimators=300, min_samples_leaf=2, class_weight="balanced_subsample", random_state=config.random_state, n_jobs=-1),
            })
        if "hist_gradient_boosting" in requested:
            specs.append({
                "model_name": "hist_gradient_boosting_classifier",
                "scale_numeric": False,
                "estimator": HistGradientBoostingClassifier(max_iter=250, learning_rate=0.05, random_state=config.random_state),
            })
    else:
        if "logistic_or_ridge" in requested:
            specs.append({
                "model_name": "ridge_regression",
                "scale_numeric": True,
                "estimator": Ridge(alpha=1.0, random_state=config.random_state),
            })
        if "random_forest" in requested:
            specs.append({
                "model_name": "random_forest_regressor",
                "scale_numeric": False,
                "estimator": RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=config.random_state, n_jobs=-1),
            })
        if "hist_gradient_boosting" in requested:
            specs.append({
                "model_name": "hist_gradient_boosting_regressor",
                "scale_numeric": False,
                "estimator": HistGradientBoostingRegressor(max_iter=250, learning_rate=0.05, random_state=config.random_state),
            })
    if not specs:
        raise ValueError("No model specs selected. Check config.model_names.")
    return specs


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
    scores = pipeline.decision_function(x_frame)
    return np.asarray(scores)


def evaluate_model(
    model_name: str,
    pipeline: Pipeline,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    y_test: pd.Series,
    config: ProjectBTrainingConfig,
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
        train_score = _positive_class_scores(pipeline, x_train)
        threshold = choose_threshold(y_train.to_numpy(), train_score)
        prediction = (test_score >= threshold).astype(int)
        metrics = {
            "model_name": model_name,
            "target_name": config.target_name,
            "target_type": task,
            "train_rows": int(len(y_train)),
            "test_rows": int(len(y_test)),
            "train_positive": int(np.sum(y_train)),
            "test_positive": int(np.sum(y_test)),
            "threshold": threshold,
            "roc_auc": float(roc_auc_score(y_test, test_score)) if len(np.unique(y_test)) > 1 else float("nan"),
            "pr_auc": float(average_precision_score(y_test, test_score)) if len(np.unique(y_test)) > 1 else float("nan"),
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


def select_best(metrics: pd.DataFrame, config: ProjectBTrainingConfig) -> str:
    metric = config.metric_to_select
    ordered = metrics.dropna(subset=[metric]).copy() if metric in metrics else metrics.copy()
    if ordered.empty:
        return str(metrics.iloc[0]["model_name"])
    ascending = metric in {"rmse", "mae"}
    return str(ordered.sort_values(metric, ascending=ascending).iloc[0]["model_name"])


def save_outputs(result: dict[str, Any], config: ProjectBTrainingConfig) -> None:
    run_name = config.run_name or f"project_b_{config.target_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    output_dir = Path(config.artifact_dir) / run_name
    output_dir.mkdir(parents=True, exist_ok=True)
    result["metrics"].to_csv(output_dir / "metrics.csv", index=False)
    result["predictions"].to_csv(output_dir / "predictions.csv", index=False)
    with (output_dir / "config.json").open("w", encoding="utf-8") as file:
        json.dump({
            "target_name": config.target_name,
            "target_type": config.target_type,
            "split_method": config.split_method,
            "test_size": config.test_size,
            "primary_metric": config.metric_to_select,
            "model_names": config.model_names,
            "numeric_features": config.numeric_features,
            "categorical_features": config.categorical_features,
        }, file, indent=2)
    best_model_name = result["best_model_name"]
    dump(result["models"][best_model_name], output_dir / f"{best_model_name}.joblib")
    result["artifact_dir"] = output_dir


def run_experiment(config: ProjectBTrainingConfig, database_url: str | None = None, frame: pd.DataFrame | None = None) -> dict[str, Any]:
    data = frame.copy() if frame is not None else load_project_b_dataset(database_url=database_url, schema=config.schema)
    if config.target_name not in data:
        raise ValueError(f"Target column not found: {config.target_name}")
    data = data.dropna(subset=[config.target_name]).copy()
    if config.target_type == "binary":
        data[config.target_name] = pd.to_numeric(data[config.target_name], errors="coerce").fillna(0).astype(int)
    if config.target_type == "regression":
        data[config.target_name] = pd.to_numeric(data[config.target_name], errors="coerce")
        data = data.dropna(subset=[config.target_name]).copy()

    train_frame, test_frame = split_dataset(data, config)
    x_train = build_feature_frame(train_frame, config)
    x_test = build_feature_frame(test_frame, config)
    y_train = train_frame[config.target_name]
    y_test = test_frame[config.target_name]

    metrics_rows: list[dict[str, Any]] = []
    prediction_frames: list[pd.DataFrame] = []
    models: dict[str, Pipeline] = {}
    if config.target_type in {"binary", "multiclass"} and y_train.nunique(dropna=True) < 2:
        model_specs = [{
            "model_name": "dummy_most_frequent",
            "scale_numeric": False,
            "estimator": DummyClassifier(strategy="most_frequent"),
        }]
    else:
        model_specs = make_model_specs(config)

    for spec in model_specs:
        pipeline = Pipeline([
            ("preprocessor", make_preprocessor(config, spec["scale_numeric"])),
            ("model", spec["estimator"]),
        ])
        pipeline.fit(x_train, y_train)
        metrics, predictions = evaluate_model(spec["model_name"], pipeline, x_train, y_train, x_test, y_test, config)
        metrics_rows.append(metrics)
        prediction_frames.append(predictions.reset_index(drop=True))
        models[spec["model_name"]] = pipeline

    result = {
        "config": config,
        "data": data,
        "train_frame": train_frame,
        "test_frame": test_frame,
        "metrics": pd.DataFrame(metrics_rows),
        "predictions": pd.concat(prediction_frames, ignore_index=True),
        "models": models,
    }
    result["best_model_name"] = select_best(result["metrics"], config)
    if config.save_artifacts:
        save_outputs(result, config)
    return result
