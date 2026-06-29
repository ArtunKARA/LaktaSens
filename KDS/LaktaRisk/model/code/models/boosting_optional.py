from __future__ import annotations

from typing import Any

import pandas as pd

from models.base import ModelDefinition, class_balance_scale_pos_weight, merged_params


def build_xgboost(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    try:
        from xgboost import XGBClassifier, XGBRegressor
    except Exception as exc:  # pragma: no cover
        raise ImportError(f"xgboost is not installed: {exc}") from exc
    if task_type == "regression":
        defaults = {
            "n_estimators": 350,
            "max_depth": 3,
            "learning_rate": 0.04,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "objective": "reg:squarederror",
            "tree_method": "hist",
            "random_state": random_state,
            "n_jobs": -1,
        }
        return XGBRegressor(**merged_params(defaults, params))
    defaults = {
        "n_estimators": 350,
        "max_depth": 3,
        "learning_rate": 0.04,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "objective": "binary:logistic" if task_type == "binary" else "multi:softprob",
        "eval_metric": "logloss" if task_type == "binary" else "mlogloss",
        "tree_method": "hist",
        "random_state": random_state,
        "n_jobs": -1,
    }
    if task_type == "binary":
        defaults["scale_pos_weight"] = class_balance_scale_pos_weight(y_train)
    return XGBClassifier(**merged_params(defaults, params))


def build_lightgbm(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    try:
        from lightgbm import LGBMClassifier, LGBMRegressor
    except Exception as exc:  # pragma: no cover
        raise ImportError(f"lightgbm is not installed: {exc}") from exc
    defaults = {
        "n_estimators": 350,
        "learning_rate": 0.04,
        "num_leaves": 31,
        "random_state": random_state,
        "n_jobs": -1,
        "verbosity": -1,
    }
    if task_type == "regression":
        return LGBMRegressor(**merged_params(defaults, params))
    defaults["class_weight"] = "balanced"
    return LGBMClassifier(**merged_params(defaults, params))


def build_catboost(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    try:
        from catboost import CatBoostClassifier, CatBoostRegressor
    except Exception as exc:  # pragma: no cover
        raise ImportError(f"catboost is not installed: {exc}") from exc
    defaults = {
        "iterations": 350,
        "depth": 5,
        "learning_rate": 0.04,
        "random_seed": random_state,
        "verbose": False,
        "allow_writing_files": False,
        "thread_count": -1,
    }
    if task_type == "regression":
        defaults["loss_function"] = "RMSE"
        return CatBoostRegressor(**merged_params(defaults, params))
    defaults["loss_function"] = "Logloss" if task_type == "binary" else "MultiClass"
    defaults["eval_metric"] = "AUC" if task_type == "binary" else "TotalF1"
    if task_type == "binary":
        defaults["auto_class_weights"] = "Balanced"
    return CatBoostClassifier(**merged_params(defaults, params))


OPTIONAL_BOOSTING_MODELS = [
    ModelDefinition(
        key="xgboost",
        display_name="XGBoost",
        family="boosting",
        source="xgboost",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_xgboost,
        is_optional=True,
    ),
    ModelDefinition(
        key="lightgbm",
        display_name="LightGBM",
        family="boosting",
        source="lightgbm",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_lightgbm,
        is_optional=True,
    ),
    ModelDefinition(
        key="catboost",
        display_name="CatBoost",
        family="boosting",
        source="catboost",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_catboost,
        is_optional=True,
    ),
]
