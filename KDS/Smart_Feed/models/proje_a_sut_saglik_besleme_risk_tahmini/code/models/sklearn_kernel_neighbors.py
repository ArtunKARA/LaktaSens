from __future__ import annotations

from typing import Any

import pandas as pd
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC, SVR, LinearSVC

from models.base import ModelDefinition, merged_params


def build_svm_rbf(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"C": 1.0, "gamma": "scale"}
    if task_type == "regression":
        return SVR(**merged_params(defaults, params))
    defaults.update({"class_weight": "balanced", "probability": True, "random_state": random_state})
    return SVC(**merged_params(defaults, params))


def build_linear_svm(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    if task_type == "regression":
        return SVR(kernel="linear", **merged_params({"C": 1.0}, params))
    defaults = {"C": 1.0, "class_weight": "balanced", "random_state": random_state}
    return LinearSVC(**merged_params(defaults, params))


def build_knn(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"n_neighbors": 5, "weights": "distance"}
    if task_type == "regression":
        return KNeighborsRegressor(**merged_params(defaults, params))
    return KNeighborsClassifier(**merged_params(defaults, params))


def build_gaussian_nb(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    if task_type == "regression":
        raise ImportError("gaussian_naive_bayes supports classification only.")
    return GaussianNB(**merged_params({}, params))


KERNEL_NEIGHBOR_MODELS = [
    ModelDefinition(
        key="svm_rbf",
        display_name="Support Vector Machine RBF",
        family="kernel",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_svm_rbf,
    ),
    ModelDefinition(
        key="linear_svm",
        display_name="Linear Support Vector Machine",
        family="kernel",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_linear_svm,
    ),
    ModelDefinition(
        key="knn",
        display_name="k-Nearest Neighbors",
        family="instance_based",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_knn,
    ),
    ModelDefinition(
        key="gaussian_naive_bayes",
        display_name="Gaussian Naive Bayes",
        family="probabilistic",
        source="sklearn",
        supports={"binary", "multiclass"},
        scale_numeric=True,
        builder=build_gaussian_nb,
    ),
]
