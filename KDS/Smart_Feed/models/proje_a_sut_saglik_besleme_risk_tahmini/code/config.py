from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


PROJECT_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = PROJECT_DIR / "artifacts"
DEFAULT_SCHEMA = "ml_smart_feed"


NUMERIC_FEATURES = [
    "parity",
    "body_weight_kg",
    "bcs",
    "dim",
    "daily_milk_yield_kg",
    "milk_fat_percent",
    "milk_protein_percent",
    "fat_protein_ratio",
    "scc",
    "milk_electrical_conductivity",
    "dry_matter_percent",
    "estimated_dmi_kg",
    "forage_concentrate_ratio",
    "feed_change_last7d",
    "rumination_minutes",
    "activity_level",
    "lying_time_minutes",
    "body_temperature",
    "water_intake_liter",
    "thi",
    "need_score",
]

CATEGORICAL_FEATURES = [
    "pregnancy_status",
    "lactation_stage",
    "ration_type",
]

TARGET_TYPES = {
    "energy_deficit_high": "binary",
    "ketosis_7d": "binary",
    "ketosis_14d": "binary",
    "mastitis_7d": "binary",
    "mastitis_14d": "binary",
    "asidosis_7d": "binary",
    "early_warning_flag": "binary",
    "feeding_need_class": "multiclass",
    "next_day_milk_yield_kg": "regression",
}

DEFAULT_MODEL_NAMES = ["academic_top_10"]


@dataclass
class ProjectATrainingConfig:
    target_name: str = "energy_deficit_high"
    schema: str = DEFAULT_SCHEMA
    split_method: str = "time"
    test_size: float = 0.25
    random_state: int = 42
    primary_metric: str | None = None
    model_names: list[str] = field(default_factory=lambda: DEFAULT_MODEL_NAMES.copy())
    model_params: dict[str, dict[str, Any]] = field(default_factory=dict)
    skip_unavailable_models: bool = True
    numeric_features: list[str] = field(default_factory=lambda: NUMERIC_FEATURES.copy())
    categorical_features: list[str] = field(default_factory=lambda: CATEGORICAL_FEATURES.copy())
    save_artifacts: bool = False
    artifact_dir: Path = ARTIFACT_DIR
    run_name: str | None = None

    @property
    def target_type(self) -> str:
        if self.target_name not in TARGET_TYPES:
            raise ValueError(f"Unknown Project A target: {self.target_name}")
        return TARGET_TYPES[self.target_name]

    @property
    def metric_to_select(self) -> str:
        if self.primary_metric:
            return self.primary_metric
        if self.target_type == "regression":
            return "rmse"
        if self.target_type == "binary":
            return "pr_auc"
        return "f1_macro"
