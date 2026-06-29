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
- `../../reports/project_a_advanced_experiment_results_20260607.md`: PR-AUC
  secimi, kalibrasyon, SCC ablation, ozellik gruplari ve tekrarlı CV
  sonuclarini aciklayan kapsamli modelleme raporu.
- `../../reports/project_a_training_dataset_audit_20260607.md`: veri
  kaynaklari, satir sayilari ve sentetik/proxy etiket sinirlamalari.

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

MmCows ham sensör dosyalari cok buyuk olsa da ayni 10 inegin yaklasik 14
gunluk yuksek frekans olcumleridir. Model birimi `cow-day` oldugu icin bu
satirlar bagimsiz egitim satiri olarak kullanilmaz. Once gercek gunluk
sensor feature'lari uretilir:

```bash
python KDS/Smart_Feed/scripts/build_mmcows_daily_sensor_features.py
psql -d <db_name> -f KDS/Smart_Feed/sql/ml_smart_feed_create.sql
psql -d <db_name> -f KDS/Smart_Feed/sql/02_load_external_project_a.sql
psql -d <db_name> -f KDS/Smart_Feed/sql/04_generate_synthetic_project_a_features.sql
```

Bu akis ankle, UWB, IMMU ve pressure verisinden lying time, hareket mesafesi,
ivme buyuklugu ve basinc/yukseklik istatistiklerini `cow-day` feature'larina
ekler. Sut omurgasi 16 inek x 15 gun oldugu icin toplam hedef satiri yine
240'tir; final model `refit_full_data=True` ile bu 240 satirin tamaminda
yeniden egitilir.

Model geliştirme ve pipeline stres testi için ayrı longitudinal sentetik
kohort üretilebilir:

```bash
psql -d <db_name> -f KDS/Smart_Feed/sql/06_generate_synthetic_project_a_longitudinal.sql
```

Bu kohort 120 inek x 180 gün = 21.600 satır üretir. Satırlar
`data_origin='synthetic_longitudinal_v1'` olarak işaretlenir. Üretim önce
`norm_*` katmanını doldurur, ardından `feat_cow_day_snapshot`,
`feat_milk_trend`, `feat_health_risk_label`, `feat_feeding_need_label`,
`feat_model_input_a` ve `feat_prediction_a` tablolarını türetir
(`generator_version='synthetic_project_a_longitudinal_v2_normalized'`).
Klinik olay etiketleri ileri 7/14 günlük pencere ile üretilir. MmCows proxy
satırları `data_origin='mmcows_observed_with_proxy'` olarak tutulur.
Sentetik veride yüksek metrik alınması gerçek çiftlik performansı değildir;
sentetik kohort yalnızca geliştirme, regresyon testi ve model karşılaştırması
için kullanılmalıdır.

Kaynak filtresi `allowed_data_origins` ile kontrol edilir. Örneğin yalnızca
MmCows proxy omurgasını incelemek için:

```python
ProjectATrainingConfig(
    allowed_data_origins=["mmcows_observed_with_proxy"],
)
```

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
regression hedefleri icin `elastic_net` de var. Derin tabular modeller:
`torch_mlp`, `torch_resnet` ve `tabnet`.

Model parametresi notebook/config icinden verilir:

```python
ProjectATrainingConfig(
    model_names=["academic_top_10"],
    split_method="cow_stratified",
    validation_size=0.20,
    enable_group_cv=True,
    cv_folds=5,
    cv_repeats=1,
    primary_metric="pr_auc",
    calibrate_probabilities=True,
    calibration_method="sigmoid",
    refit_full_data=True,
    model_params={
        "random_forest": {"n_estimators": 500, "min_samples_leaf": 2},
        "xgboost": {"n_estimators": 400, "max_depth": 3},
        "torch_resnet": {"max_epochs": 100, "patience": 12},
        "tabnet": {"max_epochs": 100, "patience": 10},
    },
)
```

Validation akisi train/validation/test seklinde ayrilir. Model secimi
`enable_group_cv=True` iken train+validation gelistirme havuzunda 5-fold
`StratifiedGroupKFold` ile yapilir. Ayni inege ait tum cow-day satirlari ayni
fold icinde kalir ve secim `cv_<primary_metric>_mean` ile yapilir. Raporlanan
ana metrikler dokunulmamis test split'inden gelir. `refit_full_data=True` ise
secilen model metrikler uretildikten sonra
tum satirlarla tekrar egitilir ve artifact kaydinda bu final model yazilir.
`cow_stratified` ayni inege ait satirlari tek split'te tutarken sinif
dagilimini train, validation ve test arasinda dengelemeye calisir.

Binary hedeflerde ana secim metrigi PR-AUC'dir. Secilen modelin OOF
olasiliklari ile sigmoid veya isotonic calibration uygulanabilir. Sigmoid
varsayilani PR-AUC siralamasini korurken olasilik kalibrasyonunu iyilestirir. Notebook
ham/kalibre Brier score, log-loss, ECE ve calibration curve raporlar.

Notebook ek deneyleri:

- SCC dahil / SCC haric ablation.
- Sensor, sut ve besleme ozellik gruplarinin tek basina karsilastirilmasi.
- PR-AUC siralamasindaki en iyi dort model icin 5 tekrar x 5 fold cow-group
  CV.

Yeni model ekleme adimi:

1. `code/models/` altina yeni dosya ekle.
2. `builder(task_type, random_state, params, y_train)` imzali fonksiyon yaz.
3. `ModelDefinition` ile modeli tanimla.
4. `code/models/registry.py` icinde import edip `MODEL_ALIASES` listesine ekle.
