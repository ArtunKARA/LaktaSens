from __future__ import annotations

import numpy as np
import pandas as pd
from matplotlib import pyplot as plt
from sklearn.metrics import PrecisionRecallDisplay, RocCurveDisplay


def show_metrics_table(result: dict) -> pd.DataFrame:
    metrics = result["metrics"].copy()
    sort_col = result["config"].metric_to_select
    if sort_col in metrics:
        metrics = metrics.sort_values(sort_col, ascending=sort_col in {"rmse", "mae"})
    return metrics


def plot_metric_bars(result: dict) -> None:
    metrics = show_metrics_table(result)
    config = result["config"]
    if config.target_type == "regression":
        columns = [col for col in ["rmse", "mae", "r2"] if col in metrics]
    elif config.target_type == "binary":
        columns = [col for col in ["pr_auc", "roc_auc", "f1", "precision", "recall"] if col in metrics]
    else:
        columns = [col for col in ["f1_macro", "f1_weighted", "accuracy", "roc_auc_ovr"] if col in metrics]
    if not columns:
        return
    ax = metrics.set_index("model_name")[columns].plot(kind="bar", figsize=(11, 4), rot=30)
    ax.set_title(f"Project B metrics - {config.target_name}")
    ax.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    plt.show()


def plot_best_binary_curves(result: dict) -> None:
    config = result["config"]
    if config.target_type != "binary":
        return
    best = result["best_model_name"]
    pred = result["predictions"][result["predictions"]["model_name"] == best]
    if "y_score" not in pred:
        return
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    RocCurveDisplay.from_predictions(pred["y_true"], pred["y_score"], ax=axes[0])
    PrecisionRecallDisplay.from_predictions(pred["y_true"], pred["y_score"], ax=axes[1])
    axes[0].set_title(f"ROC - {best}")
    axes[1].set_title(f"Precision/Recall - {best}")
    plt.tight_layout()
    plt.show()


def plot_best_confusion_matrix(result: dict) -> None:
    config = result["config"]
    if config.target_type == "regression":
        return
    best = result["best_model_name"]
    pred = result["predictions"][result["predictions"]["model_name"] == best]
    labels = sorted(pd.unique(pd.concat([pred["y_true"], pred["y_pred"]], ignore_index=True)))
    matrix = pd.crosstab(pred["y_true"], pred["y_pred"], rownames=["true"], colnames=["pred"], dropna=False)
    matrix = matrix.reindex(index=labels, columns=labels, fill_value=0)
    fig, ax = plt.subplots(figsize=(5, 4))
    image = ax.imshow(matrix.values, cmap="Greens")
    ax.set_xticks(range(len(labels)), labels)
    ax.set_yticks(range(len(labels)), labels)
    ax.set_title(f"Confusion matrix - {best}")
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            ax.text(j, i, int(matrix.iloc[i, j]), ha="center", va="center")
    fig.colorbar(image, ax=ax, fraction=0.046)
    plt.tight_layout()
    plt.show()


def plot_regression_diagnostics(result: dict) -> None:
    config = result["config"]
    if config.target_type != "regression":
        return
    best = result["best_model_name"]
    pred = result["predictions"][result["predictions"]["model_name"] == best].copy()
    pred["residual"] = pred["y_true"] - pred["y_pred"]
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    axes[0].scatter(pred["y_true"], pred["y_pred"], alpha=0.75)
    min_val = float(np.nanmin([pred["y_true"].min(), pred["y_pred"].min()]))
    max_val = float(np.nanmax([pred["y_true"].max(), pred["y_pred"].max()]))
    axes[0].plot([min_val, max_val], [min_val, max_val], color="black", linewidth=1)
    axes[0].set_title(f"True vs predicted - {best}")
    axes[0].set_xlabel("true")
    axes[0].set_ylabel("predicted")
    axes[1].hist(pred["residual"], bins=20)
    axes[1].set_title("Residual distribution")
    plt.tight_layout()
    plt.show()


def plot_feature_importance(result: dict, top_n: int = 20) -> None:
    best = result["best_model_name"]
    pipeline = result["models"][best]
    model = pipeline.named_steps["model"]
    preprocessor = pipeline.named_steps["preprocessor"]
    try:
        feature_names = list(preprocessor.get_feature_names_out())
    except Exception:
        feature_names = result["config"].numeric_features + result["config"].categorical_features
    if hasattr(model, "feature_importances_"):
        values = np.asarray(model.feature_importances_)
    elif hasattr(model, "coef_"):
        coef = np.asarray(model.coef_)
        values = np.mean(np.abs(coef), axis=0) if coef.ndim > 1 else np.abs(coef)
    else:
        return
    importance = pd.DataFrame({"feature": feature_names[: len(values)], "importance": values}).sort_values("importance", ascending=False).head(top_n)
    ax = importance.sort_values("importance").plot.barh(x="feature", y="importance", figsize=(8, 6), legend=False)
    ax.set_title(f"Feature importance - {best}")
    plt.tight_layout()
    plt.show()
