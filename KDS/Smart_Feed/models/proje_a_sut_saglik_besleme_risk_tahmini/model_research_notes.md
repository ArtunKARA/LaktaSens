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

## Extension Rule

To add a new model:

1. Create a new file under `code/models/`.
2. Add a builder function with signature
   `builder(task_type, random_state, params, y_train)`.
3. Register it as a `ModelDefinition`.
4. Import it in `code/models/registry.py`.
5. Add its key to `model_names` or an alias in `MODEL_ALIASES`.
