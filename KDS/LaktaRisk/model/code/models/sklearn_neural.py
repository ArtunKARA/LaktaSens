from __future__ import annotations

from typing import Any

import pandas as pd
from sklearn.neural_network import MLPClassifier, MLPRegressor

from models.base import ModelDefinition, merged_params


def build_mlp(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    defaults = {
        "hidden_layer_sizes": (64, 32),
        "activation": "relu",
        "alpha": 0.0005,
        "learning_rate_init": 0.001,
        "max_iter": 1000,
        "early_stopping": True,
        "random_state": random_state,
    }
    if task_type == "regression":
        return MLPRegressor(**merged_params(defaults, params))
    return MLPClassifier(**merged_params(defaults, params))


NEURAL_MODELS = [
    ModelDefinition(
        key="mlp",
        display_name="Multilayer Perceptron",
        family="neural_network",
        source="sklearn",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_mlp,
    ),
]
