from __future__ import annotations

import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from training_environment import CommandResult, RLTrainingEnvironment

ModelRunner = Callable[[RLTrainingEnvironment, str, str | None, bool], list[CommandResult]]


@dataclass
class ModelRunSpec:
    key: str
    display_name: str
    family: str
    description: str
    runner: ModelRunner
    python_role: str = "default"
    config_overrides: dict[str, Any] = field(default_factory=dict)
    trainable_now: bool = True
    production_valid: bool = False
    notes: str = ""

    def run(
        self,
        env: RLTrainingEnvironment,
        default_python: str = sys.executable,
        sb3_python: str | None = None,
        check: bool = True,
    ) -> list[CommandResult]:
        env.apply_overrides(self.config_overrides)
        if (
            self.python_role == "sb3"
            and sb3_python
            and os.environ.get("LAKTASENS_DIRECT_MODEL_SUBPROCESS") != "1"
            and Path(sb3_python).exists()
            and Path(sb3_python).resolve() != Path(sys.executable).resolve()
        ):
            command = [
                sb3_python,
                str(Path(__file__).resolve().parents[1] / "run_all_experiments.py"),
                "--mode",
                "model",
                "--model",
                self.key,
                "--sb3-python",
                sb3_python,
            ]
            process_env = os.environ.copy()
            process_env["LAKTASENS_DIRECT_MODEL_SUBPROCESS"] = "1"
            completed = subprocess.run(
                command,
                cwd=env.project_root,
                env=process_env,
                text=True,
                capture_output=True,
                check=False,
            )
            result = CommandResult(
                name=self.key,
                returncode=completed.returncode,
                command=command,
                stdout=completed.stdout,
                stderr=completed.stderr,
            )
            env.print_command_result(result)
            if check and completed.returncode != 0:
                raise RuntimeError(f"{self.key} failed with exit code {completed.returncode}")
            return [result]
        results = self.runner(env, default_python, sb3_python, check)
        for result in results:
            env.print_command_result(result)
        return results
