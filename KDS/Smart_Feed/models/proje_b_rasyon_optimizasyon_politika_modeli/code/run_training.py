from __future__ import annotations

import argparse

from config import ProjectBTrainingConfig
from data import dataset_summary, load_project_b_dataset
from train import run_experiment


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Project B Smart Feed baseline models.")
    parser.add_argument("--target", default="reward")
    parser.add_argument("--split-method", default="time", choices=["time", "cow_hash"])
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--save-artifacts", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = ProjectBTrainingConfig(
        target_name=args.target,
        split_method=args.split_method,
        test_size=args.test_size,
        save_artifacts=args.save_artifacts,
    )
    frame = load_project_b_dataset(schema=config.schema)
    print(dataset_summary(frame, config.target_name))
    result = run_experiment(config=config, frame=frame)
    print(result["metrics"].to_string(index=False))
    print(f"best_model_name={result['best_model_name']}")
    if config.save_artifacts:
        print(f"artifact_dir={result['artifact_dir']}")


if __name__ == "__main__":
    main()
