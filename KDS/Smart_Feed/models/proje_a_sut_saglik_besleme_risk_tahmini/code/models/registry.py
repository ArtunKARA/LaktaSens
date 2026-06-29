from __future__ import annotations

from typing import Any

import pandas as pd

from models.base import ModelDefinition, ModelSpec
from models.boosting_optional import OPTIONAL_BOOSTING_MODELS
from models.sklearn_kernel_neighbors import KERNEL_NEIGHBOR_MODELS
from models.sklearn_linear import LINEAR_MODELS
from models.sklearn_neural import NEURAL_MODELS
from models.sklearn_tree import TREE_MODELS
from models.torch_tabular import TORCH_TABULAR_MODELS


MODEL_DEFINITIONS: dict[str, ModelDefinition] = {
    model.key: model
    for model in [
        *LINEAR_MODELS,
        *TREE_MODELS,
        *KERNEL_NEIGHBOR_MODELS,
        *NEURAL_MODELS,
        *TORCH_TABULAR_MODELS,
        *OPTIONAL_BOOSTING_MODELS,
    ]
}

MODEL_ALIASES = {
    "academic_top_10": [
        "logistic_or_ridge",
        "svm_rbf",
        "random_forest",
        "extra_trees",
        "gradient_boosting",
        "adaboost",
        "xgboost",
        "lightgbm",
        "catboost",
        "mlp",
    ],
    "all_core": [
        "logistic_or_ridge",
        "linear_discriminant_analysis",
        "decision_tree",
        "random_forest",
        "extra_trees",
        "gradient_boosting",
        "hist_gradient_boosting",
        "adaboost",
        "svm_rbf",
        "linear_svm",
        "knn",
        "gaussian_naive_bayes",
        "mlp",
        "torch_mlp",
        "torch_resnet",
        "tabnet",
        "xgboost",
        "lightgbm",
        "catboost",
    ],
    "fast_baseline": [
        "logistic_or_ridge",
        "random_forest",
        "hist_gradient_boosting",
        "extra_trees",
    ],
    "boosting": ["gradient_boosting", "hist_gradient_boosting", "adaboost", "xgboost", "lightgbm", "catboost"],
    "tree_ensembles": ["random_forest", "extra_trees", "gradient_boosting", "hist_gradient_boosting"],
    "deep_tabular": ["mlp", "torch_mlp", "torch_resnet", "tabnet"],
}


def available_model_names() -> list[str]:
    return sorted(MODEL_DEFINITIONS)


def expand_model_names(model_names: list[str]) -> list[str]:
    expanded: list[str] = []
    for name in model_names:
        if name in MODEL_ALIASES:
            expanded.extend(MODEL_ALIASES[name])
        else:
            expanded.append(name)
    deduped: list[str] = []
    for name in expanded:
        if name not in deduped:
            deduped.append(name)
    return deduped


def make_model_specs(
    task_type: str,
    model_names: list[str],
    random_state: int,
    model_params: dict[str, dict[str, Any]] | None = None,
    y_train: pd.Series | None = None,
    skip_unavailable_models: bool = True,
) -> tuple[list[ModelSpec], list[dict[str, Any]]]:
    params_by_model = model_params or {}
    specs: list[ModelSpec] = []
    skipped: list[dict[str, Any]] = []
    for name in expand_model_names(model_names):
        definition = MODEL_DEFINITIONS.get(name)
        if definition is None:
            skipped.append({"model_name": name, "reason": "unknown_model_name"})
            continue
        if task_type not in definition.supports:
            skipped.append({"model_name": name, "reason": f"unsupported_for_{task_type}"})
            continue
        spec = definition.build(
            task_type=task_type,
            random_state=random_state,
            params=params_by_model.get(name, {}),
            y_train=y_train,
        )
        if spec.unavailable_reason:
            skipped.append({"model_name": name, "reason": spec.unavailable_reason})
            if skip_unavailable_models:
                continue
        specs.append(spec)
    if not specs:
        available = ", ".join(available_model_names())
        raise ValueError(f"No usable model specs selected. Available models: {available}")
    return specs, skipped
