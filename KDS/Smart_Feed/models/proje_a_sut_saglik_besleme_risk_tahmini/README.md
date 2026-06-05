# Project A - Sut, Saglik ve Besleme Risk Tahmini

Amaç: `ml_smart_feed` semasindaki cow-day feature tablolarindan Project A icin
sut, saglik riski ve besleme ihtiyaci tahmin modellerini egitmek.

## Icerik

- `project_a_training_notebook.ipynb`: veri import, parametre, egitim, metrik,
  grafik ve model kaydi akisi.
- `code/`: notebook tarafindan import edilen temiz Python kodu.
- `code/models/`: model aileleri ve registry. Yeni model eklemek icin ana yer.
- `model_research_notes.md`: bu problem tipi icin incelenen akademik/teknik
  kaynaklar ve secilen model aileleri.
- `artifacts/`: egitim sonucunda uretilen metrikler, tahminler ve opsiyonel
  model dosyalari.

## Desteklenen hedefler

- `energy_deficit_high`: binary classification.
- `ketosis_7d`: binary classification.
- `ketosis_14d`: binary classification.
- `mastitis_7d`: binary classification.
- `mastitis_14d`: binary classification.
- `asidosis_7d`: binary classification.
- `feeding_need_class`: multiclass classification.
- `early_warning_flag`: binary classification.
- `next_day_milk_yield_kg`: regression.

## Not

Mevcut veri kucuk ve sentetik/proxy agirliklidir. Bu modul pipeline ve
baseline denemeleri icindir; daha uzun gercek veri geldikce ayni notebook
parametreleri ile tekrar egitim alinabilir.

## Model registry

Varsayilan `model_names=['academic_top_10']` asagidaki model ailelerini dener:

- `logistic_or_ridge`
- `svm_rbf`
- `random_forest`
- `extra_trees`
- `gradient_boosting`
- `adaboost`
- `xgboost`
- `lightgbm`
- `catboost`
- `mlp`

Ek olarak registry icinde `decision_tree`, `hist_gradient_boosting`,
`linear_svm`, `knn`, `gaussian_naive_bayes`, `linear_discriminant_analysis` ve
regression hedefleri icin `elastic_net` de var.

Model parametresi notebook/config icinden verilir:

```python
ProjectATrainingConfig(
    model_names=["academic_top_10"],
    model_params={
        "random_forest": {"n_estimators": 500, "min_samples_leaf": 2},
        "xgboost": {"n_estimators": 400, "max_depth": 3},
    },
)
```

Yeni model ekleme adimi:

1. `code/models/` altina yeni dosya ekle.
2. `builder(task_type, random_state, params, y_train)` imzali fonksiyon yaz.
3. `ModelDefinition` ile modeli tanimla.
4. `code/models/registry.py` icinde import edip `MODEL_ALIASES` listesine ekle.
