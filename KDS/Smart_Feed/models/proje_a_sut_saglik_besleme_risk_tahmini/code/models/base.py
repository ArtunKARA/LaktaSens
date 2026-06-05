from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

import pandas as pd


TASKS = {"binary", "multiclass", "regression"}
Builder = Callable[[str, int, dict[str, Any], pd.Series | None], Any]


@dataclass(frozen=True)
class ModelSpec:
    model_name: str
    estimator: Any
    scale_numeric: bool
    source: str
    family: str
    supports: set[str] = field(default_factory=lambda: TASKS.copy())
    is_optional: bool = False
    unavailable_reason: str | None = None


@dataclass(frozen=True)
class ModelDefinition:
    key: str
    display_name: str
    family: str
    source: str
    supports: set[str]
    scale_numeric: bool
    builder: Builder
    is_optional: bool = False

    def build(
        self,
        task_type: str,
        random_state: int,
        params: dict[str, Any] | None = None,
        y_train: pd.Series | None = None,
    ) -> ModelSpec:
        params = params or {}
        try:
            estimator = self.builder(task_type, random_state, params, y_train)
        except ImportError as exc:
            return ModelSpec(
                model_name=self.key,
                estimator=None,
                scale_numeric=self.scale_numeric,
                source=self.source,
                family=self.family,
                supports=self.supports,
                is_optional=self.is_optional,
                unavailable_reason=str(exc),
            )
        return ModelSpec(
            model_name=self.key,
            estimator=estimator,
            scale_numeric=self.scale_numeric,
            source=self.source,
            family=self.family,
            supports=self.supports,
            is_optional=self.is_optional,
        )


def class_balance_scale_pos_weight(y_train: pd.Series | None) -> float:
    if y_train is None:
        return 1.0
    counts = y_train.value_counts(dropna=True).to_dict()
    positives = int(counts.get(1, 0))
    negatives = int(counts.get(0, 0))
    return negatives / positives if positives else 1.0


def merged_params(defaults: dict[str, Any], overrides: dict[str, Any] | None) -> dict[str, Any]:
    merged = defaults.copy()
    if overrides:
        merged.update(overrides)
    return merged
