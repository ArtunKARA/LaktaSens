from __future__ import annotations

import argparse
import json

from config import ProjectATrainingConfig
from data import dataset_summary, load_project_a_dataset
from models.registry import available_model_names
from train import run_experiment


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Project A Smart Feed baseline models.")
    parser.add_argument("--target", default="energy_deficit_high")
    parser.add_argument("--split-method", default="cow_stratified", choices=["time", "cow_hash", "cow_stratified"])
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--validation-size", type=float, default=0.2)
    parser.add_argument("--cv-folds", type=int, default=5)
    parser.add_argument("--cv-repeats", type=int, default=1)
    parser.add_argument("--disable-group-cv", action="store_true")
    parser.add_argument("--disable-calibration", action="store_true")
    parser.add_argument("--calibration-method", default="sigmoid", choices=["isotonic", "sigmoid"])
    parser.add_argument("--primary-metric", default=None)
    parser.add_argument("--models", default="academic_top_10", help="Comma-separated model keys or registry aliases.")
    parser.add_argument(
        "--allowed-data-origins",
        default=None,
        help="Optional comma-separated data_origin values. Default uses every origin.",
    )
    parser.add_argument(
        "--model-params-json",
        default="{}",
        help="JSON object keyed by model name, e.g. '{\"random_forest\":{\"n_estimators\":500}}'.",
    )
    parser.add_argument("--list-models", action="store_true", help="Print registered model keys and exit.")
    parser.add_argument("--save-artifacts", action="store_true")
    parser.add_argument("--refit-full-data", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.list_models:
        print("\n".join(available_model_names()))
        return
    model_names = [part.strip() for part in args.models.split(",") if part.strip()]
    allowed_data_origins = (
        [part.strip() for part in args.allowed_data_origins.split(",") if part.strip()]
        if args.allowed_data_origins
        else None
    )
    model_params = json.loads(args.model_params_json)
    config = ProjectATrainingConfig(
        target_name=args.target,
        split_method=args.split_method,
        test_size=args.test_size,
        validation_size=args.validation_size,
        enable_group_cv=not args.disable_group_cv,
        cv_folds=args.cv_folds,
        cv_repeats=args.cv_repeats,
        calibrate_probabilities=not args.disable_calibration,
        calibration_method=args.calibration_method,
        primary_metric=args.primary_metric,
        model_names=model_names,
        model_params=model_params,
        allowed_data_origins=allowed_data_origins,
        save_artifacts=args.save_artifacts,
        refit_full_data=args.refit_full_data,
    )
    frame = load_project_a_dataset(schema=config.schema)
    print(dataset_summary(frame, config.target_name))
    result = run_experiment(config=config, frame=frame)
    print(result["split_summary"])
    print(f"selection_metric={result['selection_metric']}")
    print(result["metrics"].to_string(index=False))
    if result.get("skipped_models"):
        print("skipped_models=")
        print(json.dumps(result["skipped_models"], indent=2))
    print(f"best_model_name={result['best_model_name']}")
    if result.get("best_threshold") is not None:
        print(f"best_threshold={result['best_threshold']}")
    if result.get("final_model") is not None:
        print(f"final_fit_rows={result['final_fit_rows']}")
        print(f"final_fit_seconds={result['final_fit_seconds']:.3f}")
    if config.save_artifacts:
        print(f"artifact_dir={result['artifact_dir']}")


if __name__ == "__main__":
    main()
