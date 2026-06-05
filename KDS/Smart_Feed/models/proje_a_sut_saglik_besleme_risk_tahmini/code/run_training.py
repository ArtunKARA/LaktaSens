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
    parser.add_argument("--split-method", default="time", choices=["time", "cow_hash"])
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--models", default="academic_top_10", help="Comma-separated model keys or registry aliases.")
    parser.add_argument(
        "--model-params-json",
        default="{}",
        help="JSON object keyed by model name, e.g. '{\"random_forest\":{\"n_estimators\":500}}'.",
    )
    parser.add_argument("--list-models", action="store_true", help="Print registered model keys and exit.")
    parser.add_argument("--save-artifacts", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.list_models:
        print("\n".join(available_model_names()))
        return
    model_names = [part.strip() for part in args.models.split(",") if part.strip()]
    model_params = json.loads(args.model_params_json)
    config = ProjectATrainingConfig(
        target_name=args.target,
        split_method=args.split_method,
        test_size=args.test_size,
        model_names=model_names,
        model_params=model_params,
        save_artifacts=args.save_artifacts,
    )
    frame = load_project_a_dataset(schema=config.schema)
    print(dataset_summary(frame, config.target_name))
    result = run_experiment(config=config, frame=frame)
    print(result["metrics"].to_string(index=False))
    if result.get("skipped_models"):
        print("skipped_models=")
        print(json.dumps(result["skipped_models"], indent=2))
    print(f"best_model_name={result['best_model_name']}")
    if config.save_artifacts:
        print(f"artifact_dir={result['artifact_dir']}")


if __name__ == "__main__":
    main()
