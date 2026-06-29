from __future__ import annotations

from copy import deepcopy
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin, RegressorMixin

from models.base import ModelDefinition, merged_params


class TorchTabularEstimator(BaseEstimator):
    def __init__(
        self,
        task_type: str = "binary",
        architecture: str = "mlp",
        hidden_dim: int = 128,
        depth: int = 3,
        dropout: float = 0.15,
        learning_rate: float = 0.001,
        weight_decay: float = 0.0001,
        batch_size: int = 256,
        max_epochs: int = 100,
        patience: int = 12,
        validation_fraction: float = 0.1,
        device: str = "auto",
        random_state: int = 42,
        verbose: bool = False,
    ) -> None:
        self.task_type = task_type
        self.architecture = architecture
        self.hidden_dim = hidden_dim
        self.depth = depth
        self.dropout = dropout
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.patience = patience
        self.validation_fraction = validation_fraction
        self.device = device
        self.random_state = random_state
        self.verbose = verbose

    @property
    def _estimator_type(self) -> str:
        return "regressor" if self.task_type == "regression" else "classifier"

    def _imports(self) -> tuple[Any, Any, Any]:
        try:
            import torch
            from torch import nn
            from torch.utils.data import DataLoader, TensorDataset
        except ImportError as exc:
            raise ImportError("PyTorch tabular models require the 'torch' package.") from exc
        return torch, nn, (DataLoader, TensorDataset)

    def _build_network(self, nn: Any, input_dim: int, output_dim: int) -> Any:
        hidden_dim = int(self.hidden_dim)
        depth = max(1, int(self.depth))
        dropout = float(self.dropout)

        if self.architecture == "resnet":
            class ResidualBlock(nn.Module):
                def __init__(self) -> None:
                    super().__init__()
                    self.block = nn.Sequential(
                        nn.Linear(hidden_dim, hidden_dim),
                        nn.BatchNorm1d(hidden_dim),
                        nn.ReLU(),
                        nn.Dropout(dropout),
                        nn.Linear(hidden_dim, hidden_dim),
                        nn.BatchNorm1d(hidden_dim),
                        nn.Dropout(dropout),
                    )
                    self.activation = nn.ReLU()

                def forward(self, inputs: Any) -> Any:
                    return self.activation(inputs + self.block(inputs))

            return nn.Sequential(
                nn.Linear(input_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                *[ResidualBlock() for _ in range(depth)],
                nn.Linear(hidden_dim, output_dim),
            )

        layers: list[Any] = []
        current_dim = input_dim
        for _ in range(depth):
            layers.extend([
                nn.Linear(current_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout),
            ])
            current_dim = hidden_dim
        layers.append(nn.Linear(current_dim, output_dim))
        return nn.Sequential(*layers)

    def _device_name(self, torch: Any) -> str:
        if self.device == "auto":
            return "cuda" if torch.cuda.is_available() else "cpu"
        return self.device

    def fit(self, x: Any, y: Any) -> "TorchTabularEstimator":
        torch, nn, data_classes = self._imports()
        DataLoader, TensorDataset = data_classes
        torch.manual_seed(self.random_state)
        np.random.seed(self.random_state)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(self.random_state)

        x_array = np.asarray(x, dtype=np.float32)
        y_array = np.asarray(y)
        self.n_features_in_ = x_array.shape[1]
        self.device_ = self._device_name(torch)

        if self.task_type == "regression":
            encoded_y = y_array.astype(np.float32)
            output_dim = 1
            self.classes_ = None
        else:
            self.classes_, encoded_y = np.unique(y_array, return_inverse=True)
            encoded_y = encoded_y.astype(np.int64)
            output_dim = 1 if self.task_type == "binary" else len(self.classes_)

        row_count = len(x_array)
        rng = np.random.default_rng(self.random_state)
        order = rng.permutation(row_count)
        validation_count = max(1, int(row_count * self.validation_fraction))
        validation_count = min(validation_count, max(1, row_count - 2))
        validation_indices = order[:validation_count]
        train_indices = order[validation_count:]

        x_tensor = torch.as_tensor(x_array)
        if self.task_type == "regression":
            y_tensor = torch.as_tensor(encoded_y, dtype=torch.float32).reshape(-1, 1)
        elif self.task_type == "binary":
            y_tensor = torch.as_tensor(encoded_y, dtype=torch.float32).reshape(-1, 1)
        else:
            y_tensor = torch.as_tensor(encoded_y, dtype=torch.long)

        train_dataset = TensorDataset(x_tensor[train_indices], y_tensor[train_indices])
        validation_dataset = TensorDataset(x_tensor[validation_indices], y_tensor[validation_indices])
        generator = torch.Generator().manual_seed(self.random_state)
        effective_batch_size = min(self.batch_size, len(train_dataset))
        train_loader = DataLoader(
            train_dataset,
            batch_size=effective_batch_size,
            shuffle=True,
            generator=generator,
            drop_last=len(train_dataset) > 1 and len(train_dataset) % effective_batch_size == 1,
        )
        validation_loader = DataLoader(
            validation_dataset,
            batch_size=min(self.batch_size, len(validation_dataset)),
            shuffle=False,
        )

        self.model_ = self._build_network(nn, self.n_features_in_, output_dim).to(self.device_)
        if self.task_type == "binary":
            positives = max(int(np.sum(encoded_y == 1)), 1)
            negatives = max(int(np.sum(encoded_y == 0)), 1)
            pos_weight = torch.tensor([negatives / positives], dtype=torch.float32, device=self.device_)
            loss_function = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        elif self.task_type == "multiclass":
            counts = np.bincount(encoded_y, minlength=len(self.classes_))
            weights = len(encoded_y) / np.maximum(counts * len(self.classes_), 1)
            loss_function = nn.CrossEntropyLoss(
                weight=torch.as_tensor(weights, dtype=torch.float32, device=self.device_)
            )
        else:
            loss_function = nn.MSELoss()

        optimizer = torch.optim.AdamW(
            self.model_.parameters(),
            lr=self.learning_rate,
            weight_decay=self.weight_decay,
        )
        best_loss = float("inf")
        best_state = None
        epochs_without_improvement = 0
        self.training_history_ = []

        for epoch in range(int(self.max_epochs)):
            self.model_.train()
            train_losses = []
            for batch_x, batch_y in train_loader:
                batch_x = batch_x.to(self.device_)
                batch_y = batch_y.to(self.device_)
                optimizer.zero_grad()
                loss = loss_function(self.model_(batch_x), batch_y)
                loss.backward()
                optimizer.step()
                train_losses.append(float(loss.detach().cpu()))

            self.model_.eval()
            validation_losses = []
            with torch.no_grad():
                for batch_x, batch_y in validation_loader:
                    batch_x = batch_x.to(self.device_)
                    batch_y = batch_y.to(self.device_)
                    validation_losses.append(float(loss_function(self.model_(batch_x), batch_y).cpu()))
            validation_loss = float(np.mean(validation_losses))
            self.training_history_.append({
                "epoch": epoch + 1,
                "train_loss": float(np.mean(train_losses)),
                "validation_loss": validation_loss,
            })
            if validation_loss < best_loss - 1e-6:
                best_loss = validation_loss
                best_state = deepcopy(self.model_.state_dict())
                epochs_without_improvement = 0
            else:
                epochs_without_improvement += 1
                if epochs_without_improvement >= self.patience:
                    break

        if best_state is not None:
            self.model_.load_state_dict(best_state)
        self.model_.eval()
        self.epochs_trained_ = len(self.training_history_)
        return self

    def _raw_predict(self, x: Any) -> np.ndarray:
        torch, _, _ = self._imports()
        x_tensor = torch.as_tensor(np.asarray(x, dtype=np.float32), device=self.device_)
        self.model_.eval()
        with torch.no_grad():
            return self.model_(x_tensor).detach().cpu().numpy()

    def predict_proba(self, x: Any) -> np.ndarray:
        if self.task_type == "regression":
            raise AttributeError("predict_proba is unavailable for regression.")
        raw = self._raw_predict(x)
        if self.task_type == "binary":
            positive = 1.0 / (1.0 + np.exp(-raw.reshape(-1)))
            return np.column_stack([1.0 - positive, positive])
        shifted = raw - raw.max(axis=1, keepdims=True)
        probabilities = np.exp(shifted)
        return probabilities / probabilities.sum(axis=1, keepdims=True)

    def predict(self, x: Any) -> np.ndarray:
        if self.task_type == "regression":
            return self._raw_predict(x).reshape(-1)
        indices = np.argmax(self.predict_proba(x), axis=1)
        return self.classes_[indices]


class TabNetEstimator(BaseEstimator):
    def __init__(
        self,
        n_d: int = 16,
        n_a: int = 16,
        n_steps: int = 3,
        gamma: float = 1.3,
        lambda_sparse: float = 0.0001,
        learning_rate: float = 0.02,
        max_epochs: int = 100,
        patience: int = 10,
        validation_fraction: float = 0.1,
        batch_size: int = 1024,
        virtual_batch_size: int = 128,
        device_name: str = "auto",
        random_state: int = 42,
        verbose: int = 0,
    ) -> None:
        self.n_d = n_d
        self.n_a = n_a
        self.n_steps = n_steps
        self.gamma = gamma
        self.lambda_sparse = lambda_sparse
        self.learning_rate = learning_rate
        self.max_epochs = max_epochs
        self.patience = patience
        self.validation_fraction = validation_fraction
        self.batch_size = batch_size
        self.virtual_batch_size = virtual_batch_size
        self.device_name = device_name
        self.random_state = random_state
        self.verbose = verbose

    @property
    def _estimator_type(self) -> str:
        return "classifier"

    def fit(self, x: Any, y: Any) -> "TabNetEstimator":
        try:
            from pytorch_tabnet.tab_model import TabNetClassifier
        except ImportError as exc:
            raise ImportError("TabNet requires the 'pytorch-tabnet' package.") from exc
        self.model_ = TabNetClassifier(
            n_d=self.n_d,
            n_a=self.n_a,
            n_steps=self.n_steps,
            gamma=self.gamma,
            lambda_sparse=self.lambda_sparse,
            optimizer_params={"lr": self.learning_rate},
            seed=self.random_state,
            device_name=self.device_name,
            verbose=self.verbose,
        )
        x_array = np.asarray(x, dtype=np.float32)
        y_array = np.asarray(y)
        rng = np.random.default_rng(self.random_state)
        order = rng.permutation(len(x_array))
        validation_count = max(1, int(len(x_array) * self.validation_fraction))
        validation_count = min(validation_count, max(1, len(x_array) - 2))
        validation_indices = order[:validation_count]
        train_indices = order[validation_count:]
        self.model_.fit(
            x_array[train_indices],
            y_array[train_indices],
            eval_set=[(x_array[validation_indices], y_array[validation_indices])],
            eval_name=["validation"],
            eval_metric=["logloss"],
            max_epochs=self.max_epochs,
            patience=self.patience,
            batch_size=self.batch_size,
            virtual_batch_size=self.virtual_batch_size,
        )
        self.classes_ = self.model_.classes_
        self.feature_importances_ = self.model_.feature_importances_
        return self

    def predict(self, x: Any) -> np.ndarray:
        return self.model_.predict(np.asarray(x, dtype=np.float32))

    def predict_proba(self, x: Any) -> np.ndarray:
        return self.model_.predict_proba(np.asarray(x, dtype=np.float32))


def build_torch_model(
    task_type: str,
    random_state: int,
    params: dict[str, Any],
    y_train: pd.Series | None,
    architecture: str,
) -> Any:
    try:
        import torch  # noqa: F401
    except ImportError as exc:
        raise ImportError("PyTorch tabular models require the 'torch' package.") from exc
    defaults = {
        "task_type": task_type,
        "architecture": architecture,
        "hidden_dim": 128,
        "depth": 3,
        "dropout": 0.15,
        "learning_rate": 0.001,
        "weight_decay": 0.0001,
        "batch_size": 256,
        "max_epochs": 100,
        "patience": 12,
        "validation_fraction": 0.1,
        "device": "auto",
        "random_state": random_state,
    }
    return TorchTabularEstimator(**merged_params(defaults, params))


def build_torch_mlp(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    return build_torch_model(task_type, random_state, params, y_train, architecture="mlp")


def build_torch_resnet(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    return build_torch_model(task_type, random_state, params, y_train, architecture="resnet")


def build_tabnet(task_type: str, random_state: int, params: dict[str, Any], y_train: pd.Series | None) -> Any:
    try:
        from pytorch_tabnet.tab_model import TabNetClassifier
    except ImportError as exc:
        raise ImportError("TabNet requires the 'pytorch-tabnet' package.") from exc
    defaults = {
        "n_d": 16,
        "n_a": 16,
        "n_steps": 3,
        "gamma": 1.3,
        "lambda_sparse": 0.0001,
        "learning_rate": 0.02,
        "max_epochs": 100,
        "patience": 10,
        "validation_fraction": 0.1,
        "batch_size": 1024,
        "virtual_batch_size": 128,
        "device_name": "auto",
        "random_state": random_state,
        "verbose": 0,
    }
    return TabNetEstimator(**merged_params(defaults, params))


TORCH_TABULAR_MODELS = [
    ModelDefinition(
        key="torch_mlp",
        display_name="PyTorch Tabular MLP",
        family="deep_tabular",
        source="pytorch",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_torch_mlp,
        is_optional=True,
    ),
    ModelDefinition(
        key="torch_resnet",
        display_name="PyTorch Tabular ResNet",
        family="deep_tabular",
        source="pytorch",
        supports={"binary", "multiclass", "regression"},
        scale_numeric=True,
        builder=build_torch_resnet,
        is_optional=True,
    ),
    ModelDefinition(
        key="tabnet",
        display_name="TabNet",
        family="deep_tabular_attention",
        source="pytorch-tabnet",
        supports={"binary", "multiclass"},
        scale_numeric=True,
        builder=build_tabnet,
        is_optional=True,
    ),
]
