# Project A Model Research Notes

Date: 2026-06-05

Scope: Smart Feed Project A is a tabular cow-day prediction problem with milk,
lactation, sensor, environment, and synthetic/proxy health-risk features. The
current dataset is small, so the first model set should emphasize tabular
baselines, tree ensembles, and boosting models before heavier sequence models.

## Sources Checked

| Source | Relevant point |
|---|---|
| Machine learning-based prediction of clinical mastitis in dairy cows, PubMed: https://pubmed.ncbi.nlm.nih.gov/41397607/ | A mastitis study compared 9 algorithms: random forest, MLP, SVM, decision tree, gradient boosting, AdaBoost, LDA, logistic regression, and naive Bayes. |
| Time-series mastitis prediction with AMS data, PubMed: https://pubmed.ncbi.nlm.nih.gov/40466393/ | Compared logistic regression, SVM, decision tree, random forest, gradient boosting, and MLP for mastitis prediction one day before or on observation day. |
| Mastitis risk with time-series characteristics, PubMed: https://pubmed.ncbi.nlm.nih.gov/40343367/ | Compared XGBoost, GBDT, SVM, KNN, logistic regression, and LSTM for mastitis risk. |
| Clinical mastitis prediction using milk yield, rumination, and EC, PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC10854744/ | Notes common mastitis ML methods including SVM, decision tree, random forest, gradient-boosted trees, naive Bayes, logistic regression, and neural networks. |
| Predicting Subclinical Ketosis in Dairy Cows, PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC8300340/ | Uses regression and ensemble models including ElasticNet, SVR, decision tree, AdaBoost, bagging, random forest, ExtraTrees, XGBoost, and LightGBM for ketosis-related prediction. |
| Udder health status prediction, Scientific Reports: https://www.nature.com/articles/s41598-021-93056-4 | Compares LDA, GLM/logistic, naive Bayes, CART, KNN, SVM, random forest, and neural network on udder health status. |
| XGBoost paper: https://arxiv.org/abs/1603.02754 | XGBoost is a scalable tree boosting system widely used for structured/tabular prediction. |
| LightGBM paper: https://papers.nips.cc/paper/6907-lightgbm-a-highly-efficient-gradient-boosting-decision-tree.pdf | LightGBM is an efficient GBDT system for high-dimensional and larger data. |
| CatBoost paper: https://arxiv.org/abs/1706.09516 | CatBoost targets unbiased boosting and categorical feature handling. |
| Random Forests, Breiman 2001: https://www.ovid.com/journals/male/fulltext/00010134-200145010-00001~random-forests | Random forests are strong non-linear tabular baselines with internal importance diagnostics. |
| Support-vector networks, Cortes and Vapnik 1995: https://link.springer.com/article/10.1007/BF00994018 | SVM is a classic strong-margin classifier used in many dairy-health ML comparisons. |
| Roberts et al. 2017, structured cross-validation: https://doi.org/10.1111/ecog.02881 | Ignoring hierarchical dependence can underestimate prediction error. Repeated cow-day rows therefore must stay grouped by cow during CV. |
| StratifiedGroupKFold documentation: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.StratifiedGroupKFold.html | Preserves class proportions as far as possible while keeping groups non-overlapping. |
| TabNet, Arik and Pfister: https://arxiv.org/abs/1908.07442 | Uses sequential attention for tabular feature selection and interpretable feature attribution. |
| Revisiting Deep Learning Models for Tabular Data: https://arxiv.org/abs/2106.11959 | Identifies a ResNet-like architecture as a strong deep tabular baseline and finds no universally superior solution versus GBDT. |
| Why do tree-based models still outperform deep learning on tabular data?: https://arxiv.org/abs/2207.08815 | Shows tree ensembles remain particularly strong on medium-sized tabular datasets, so deep models should supplement rather than replace boosting. |

## Selected Academic Top 10

The registry alias `academic_top_10` maps to:

1. `logistic_or_ridge`
2. `svm_rbf`
3. `random_forest`
4. `extra_trees`
5. `gradient_boosting`
6. `adaboost`
7. `xgboost`
8. `lightgbm`
9. `catboost`
10. `mlp`

Additional implemented candidates:

- `decision_tree`
- `hist_gradient_boosting`
- `linear_svm`
- `knn`
- `gaussian_naive_bayes`
- `linear_discriminant_analysis`
- `elastic_net` for regression targets
- `torch_mlp`
- `torch_resnet`, based on the strong ResNet-like tabular baseline
- `tabnet`, using the optional `pytorch-tabnet` package

## Validation Protocol

- The final test cows are held out before model comparison.
- Five-fold `StratifiedGroupKFold` runs on the remaining development cows for
  classification; regression uses `GroupKFold`.
- Every cow belongs to exactly one fold at a time, preventing repeated
  cow-day rows from leaking between fold train and validation sets.
- Model selection uses `cv_<primary_metric>_mean`.
- Binary decision thresholds are derived from out-of-fold predictions, then
  applied once to the untouched test set.
- The binary default primary metric is PR-AUC because positive health-risk
  rows are rare and accuracy is dominated by the negative class.
- Probability calibration is fitted only on development out-of-fold
  predictions. Brier score, log-loss, ECE, and a calibration curve are
  evaluated on the untouched test cows.
- The top four models are additionally compared with repeated
  `StratifiedGroupKFold` to measure seed/fold sensitivity.
- SCC ablation and standalone sensor/milk/feeding feature-group studies use
  the same cow-level split protocol.

## Deep Learning Scope

The current pipeline models one pre-aggregated cow-day row at a time. MLP,
tabular ResNet, and TabNet are therefore valid additions. LSTM/GRU/temporal
Transformer models are not added to this row-based registry because they
require explicit ordered windows, sequence masks, and a separate
sequence-level validation pipeline. Adding an LSTM without that redesign
would not actually learn longitudinal dynamics.

## Extension Rule

To add a new model:

1. Create a new file under `code/models/`.
2. Add a builder function with signature
   `builder(task_type, random_state, params, y_train)`.
3. Register it as a `ModelDefinition`.
4. Import it in `code/models/registry.py`.
5. Add its key to `model_names` or an alias in `MODEL_ALIASES`.
