from __future__ import annotations

from typing import Any

import pandas as pd
from sklearn.ensemble import (
    AdaBoostClassifier,
    AdaBoostRegressor,
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    HistGradientBoostingClassifier,
    HistGradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

from models.base import ModelDefinition, merged_params


def build_decision_tree(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"min_samples_leaf": 2, "random_state": random_state}
    if task_type == "regression":
        return DecisionTreeRegressor(**merged_params(defaults, params))
    defaults["class_weight"] = "balanced"
    return DecisionTreeClassifier(**merged_params(defaults, params))


def build_random_forest(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"n_estimators": 300, "min_samples_leaf": 2, "random_state": random_state, "n_jobs": -1}
    if task_type == "regression":
        return RandomForestRegressor(**merged_params(defaults, params))
    defaults["class_weight"] = "balanced_subsample"
    return RandomForestClassifier(**merged_params(defaults, params))


def build_extra_trees(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"n_estimators": 400, "min_samples_leaf": 2, "random_state": random_state, "n_jobs": -1}
    if task_type == "regression":
        return ExtraTreesRegressor(**merged_params(defaults, params))
    defaults["class_weight"] = "balanced"
    return ExtraTreesClassifier(**merged_params(defaults, params))


def build_gradient_boosting(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"n_estimators": 250, "learning_rate": 0.05, "max_depth": 3, "random_state": random_state}
    if task_type == "regression":
        return GradientBoostingRegressor(**merged_params(defaults, params))
    return GradientBoostingClassifier(**merged_params(defaults, params))


def build_hist_gradient_boosting(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"max_iter": 250, "learning_rate": 0.05, "random_state": random_state}
    if task_type == "regression":
        return HistGradientBoostingRegressor(**merged_params(defaults, params))
    return HistGradientBoostingClassifier(**merged_params(defaults, params))


def build_adaboost(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {"n_estimators": 250, "learning_rate": 0.05, "random_state": random_state}
    if task_type == "regression":
        return AdaBoostRegressor(**merged_params(defaults, params))
    return AdaBoostClassifier(**merged_params(defaults, params))


TREE_MODELS = [
    ModelDefinition(
        key="decision_tree",
        display_name="Decision Tree",
        family="tree",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_decision_tree,
    ),
    ModelDefinition(
        key="random_forest",
        display_name="Random Forest",
        family="tree_ensemble",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_random_forest,
    ),
    ModelDefinition(
        key="extra_trees",
        display_name="Extremely Randomized Trees",
        family="tree_ensemble",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_extra_trees,
    ),
    ModelDefinition(
        key="gradient_boosting",
        display_name="Gradient Boosting",
        family="boosting",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_gradient_boosting,
    ),
    ModelDefinition(
        key="hist_gradient_boosting",
        display_name="Histogram Gradient Boosting",
        family="boosting",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_hist_gradient_boosting,
    ),
    ModelDefinition(
        key="adaboost",
        display_name="AdaBoost",
        family="boosting",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=False,
        builder=build_adaboost,
    ),
]
