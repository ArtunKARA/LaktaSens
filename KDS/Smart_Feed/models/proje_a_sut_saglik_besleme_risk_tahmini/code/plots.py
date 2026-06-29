from __future__ import annotations

import numpy as np
import pandas as pd
from matplotlib import pyplot as plt
from sklearn.calibration import calibration_curve
from sklearn.inspection import permutation_importance
from sklearn.metrics import PrecisionRecallDisplay, RocCurveDisplay


def _test_predictions(result: dict, model_name: str) -> pd.DataFrame:
    pred = result["predictions"][result["predictions"]["model_name"] == model_name].copy()
    if "split" in pred:
        pred = pred[pred["split"] == "test"].copy()
    return pred


def show_metrics_table(result: dict) -> pd.DataFrame:
    metrics = result["metrics"].copy()
    sort_col = result.get("selection_metric", result["config"].metric_to_select)
    if sort_col in metrics:
        metrics = metrics.sort_values(sort_col, ascending=sort_col.endswith("rmse") or sort_col.endswith("mae"))
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
    ax.set_title(f"Project A metrics - {config.target_name}")
    ax.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    plt.show()


def plot_best_binary_curves(result: dict) -> None:
    config = result["config"]
    if config.target_type != "binary":
        return
    best = result["best_model_name"]
    pred = _test_predictions(result, best)
    if "y_score" not in pred:
        return
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    RocCurveDisplay.from_predictions(pred["y_true"], pred["y_score"], ax=axes[0])
    PrecisionRecallDisplay.from_predictions(pred["y_true"], pred["y_score"], ax=axes[1])
    axes[0].set_title(f"ROC - {best}")
    axes[1].set_title(f"Precision/Recall - {best}")
    plt.tight_layout()
    plt.show()


def plot_probability_calibration(result: dict, n_bins: int = 10) -> None:
    predictions = result.get("calibrated_predictions", pd.DataFrame())
    if predictions.empty:
        return
    test = predictions[predictions["split"] == "test"]
    if test.empty:
        return
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    for column, label in [("y_score_raw", "raw"), ("y_score_calibrated", "calibrated")]:
        observed, predicted = calibration_curve(
            test["y_true"],
            test[column],
            n_bins=n_bins,
            strategy="quantile",
        )
        axes[0].plot(predicted, observed, marker="o", label=label)
        axes[1].hist(test[column], bins=20, alpha=0.5, label=label)
    axes[0].plot([0, 1], [0, 1], linestyle="--", color="black")
    axes[0].set_title(f"Calibration curve - {result['best_model_name']}")
    axes[0].set_xlabel("mean predicted probability")
    axes[0].set_ylabel("observed positive rate")
    axes[0].legend()
    axes[1].set_title("Probability distribution")
    axes[1].set_xlabel("predicted probability")
    axes[1].legend()
    plt.tight_layout()
    plt.show()


def plot_repeated_cv_comparison(result: dict, metric: str = "pr_auc") -> None:
    fold_metrics = result.get("cv_fold_metrics", pd.DataFrame())
    if fold_metrics.empty or metric not in fold_metrics:
        return
    order = (
        fold_metrics.groupby("model_name")[metric]
        .mean()
        .sort_values(ascending=False)
        .index
        .tolist()
    )
    values = [fold_metrics.loc[fold_metrics["model_name"] == model_name, metric] for model_name in order]
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.boxplot(values, labels=order, showmeans=True)
    ax.set_title(f"Repeated cow-group CV - {metric}")
    ax.set_ylabel(metric)
    ax.tick_params(axis="x", rotation=25)
    ax.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    plt.show()


def plot_feature_study(study: dict, metric: str = "cv_pr_auc_mean") -> None:
    summary = study.get("summary", pd.DataFrame()).copy()
    if summary.empty or metric not in summary:
        return
    summary = summary.sort_values(metric)
    ax = summary.plot.barh(
        x="feature_set",
        y=metric,
        xerr=summary.get("cv_pr_auc_std") if metric == "cv_pr_auc_mean" else None,
        figsize=(8, 4),
        legend=False,
    )
    ax.set_title(f"Feature study - {study['model_name']}")
    ax.grid(axis="x", alpha=0.25)
    plt.tight_layout()
    plt.show()


def plot_best_confusion_matrix(result: dict) -> None:
    config = result["config"]
    if config.target_type == "regression":
        return
    best = result["best_model_name"]
    pred = _test_predictions(result, best)
    labels = sorted(pd.unique(pd.concat([pred["y_true"], pred["y_pred"]], ignore_index=True)))
    matrix = pd.crosstab(pred["y_true"], pred["y_pred"], rownames=["true"], colnames=["pred"], dropna=False)
    matrix = matrix.reindex(index=labels, columns=labels, fill_value=0)
    fig, ax = plt.subplots(figsize=(5, 4))
    image = ax.imshow(matrix.values, cmap="Blues")
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
    pred = _test_predictions(result, best)
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


def plot_feature_importance(result: dict, top_n: int = 20, method: str = "permutation") -> None:
    best = result["best_model_name"]
    pipeline = result["models"][best]
    model = pipeline.named_steps["model"]
    preprocessor = pipeline.named_steps["preprocessor"]
    if method == "permutation":
        from train import build_feature_frame

        config = result["config"]
        x_test = build_feature_frame(result["test_frame"], config)
        y_test = result["test_frame"][config.target_name]
        scoring = {
            "binary": "average_precision",
            "multiclass": "f1_macro",
            "regression": "neg_mean_squared_error",
        }[config.target_type]
        importance_result = permutation_importance(
            pipeline,
            x_test,
            y_test,
            scoring=scoring,
            n_repeats=5,
            random_state=config.random_state,
        )
        feature_names = list(x_test.columns)
        values = importance_result.importances_mean
    else:
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
    importance = pd.DataFrame({"feature": feature_names[: len(values)], "importance": values})
    importance = importance[np.isfinite(importance["importance"])]
    if importance.empty:
        print(f"No non-zero feature importance available for {best}.")
        return
    importance["absolute_importance"] = importance["importance"].abs()
    importance = importance.sort_values("absolute_importance", ascending=False).head(top_n)
    ax = importance.sort_values("importance").plot.barh(x="feature", y="importance", figsize=(8, 6), legend=False)
    ax.set_title(f"{method.title()} feature importance - {best}")
    plt.tight_layout()
    plt.show()
