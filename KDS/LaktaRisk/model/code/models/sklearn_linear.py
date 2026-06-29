from __future__ import annotations

from typing import Any

import pandas as pd
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.linear_model import ElasticNet, LogisticRegression, Ridge

from models.base import ModelDefinition, merged_params


def build_logistic_or_ridge(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    if task_type == "regression":
        defaults = {"alpha": 1.0, "random_state": random_state}
        return Ridge(**merged_params(defaults, params))
    defaults = {
        "max_iter": 1000,
        "class_weight": "balanced",
        "solver": "lbfgs",
        "random_state": random_state,
    }
    return LogisticRegression(**merged_params(defaults, params))


def build_elastic_net(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    if task_type != "regression":
        raise ImportError("elastic_net is regression-only in this Project A registry.")
    defaults = {"alpha": 0.1, "l1_ratio": 0.2, "random_state": random_state, "max_iter": 5000}
    return ElasticNet(**merged_params(defaults, params))


def build_lda(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    if task_type == "regression":
        raise ImportError("linear_discriminant_analysis supports classification only.")
    defaults = {"solver": "svd"}
    return LinearDiscriminantAnalysis(**merged_params(defaults, params))


LINEAR_MODELS = [
    ModelDefinition(
        key="logistic_or_ridge",
        display_name="Logistic Regression / Ridge Regression",
        family="linear",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_logistic_or_ridge,
    ),
    ModelDefinition(
        key="elastic_net",
        display_name="Elastic Net Regression",
        family="linear",
        source="sklearn",
        supports={"regression"},
        scale_numeric=True,
        builder=build_elastic_net,
    ),
    ModelDefinition(
        key="linear_discriminant_analysis",
        display_name="Linear Discriminant Analysis",
        family="linear",
        source="sklearn",
        supports={"binary", "multiclass"},
        scale_numeric=True,
        builder=build_lda,
    ),
]
