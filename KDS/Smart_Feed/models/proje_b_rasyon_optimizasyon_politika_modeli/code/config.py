from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = PROJECT_DIR / "artifacts"
DEFAULT_SCHEMA = "ml_smart_feed"


BASE_NUMERIC_FEATURES = [
    "candidate_rank",
    "selected_flag",
    "feasible_flag",
    "done",
    "state_estimated_dmi_kg",
    "state_expected_milk_yield_kg",
    "state_energy_deficit_risk_score",
    "state_ketosis_risk_score",
    "state_mastitis_risk_score",
    "state_asidosis_risk_score",
    "total_dmi_kg",
    "total_feed_cost",
    "expected_milk_yield_kg",
    "expected_milk_revenue",
    "expected_margin",
    "health_risk_penalty",
    "ration_change_penalty",
    "nutrient_cp_percent_dm",
    "nutrient_ndf_percent_dm",
    "nutrient_starch_percent_dm",
    "nutrient_fat_percent_dm",
    "nutrient_nel_mcal_kg_dm",
]

BASE_CATEGORICAL_FEATURES = [
    "action_type",
    "state_lactation_stage",
    "state_feeding_need_class",
]

TARGET_TYPES = {
    "reward": "regression",
    "total_score": "regression",
    "total_feed_cost": "regression",
    "good_ration": "binary",
    "reward_band": "multiclass",
}


@dataclass
class ProjectBTrainingConfig:
    target_name: str = "reward"
    schema: str = DEFAULT_SCHEMA
    split_method: str = "time"
    test_size: float = 0.25
    random_state: int = 42
    primary_metric: str | None = None
    model_names: list[str] = field(default_factory=lambda: ["logistic_or_ridge", "random_forest", "hist_gradient_boosting"])
    numeric_features: list[str] = field(default_factory=lambda: BASE_NUMERIC_FEATURES.copy())
    categorical_features: list[str] = field(default_factory=lambda: BASE_CATEGORICAL_FEATURES.copy())
    save_artifacts: bool = False
    artifact_dir: Path = ARTIFACT_DIR
    run_name: str | None = None

    @property
    def target_type(self) -> str:
        if self.target_name not in TARGET_TYPES:
            raise ValueError(f"Unknown Project B target: {self.target_name}")
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
