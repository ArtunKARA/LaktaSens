# Sürüden Keep/Cull RL-MDP Prototipi

Bu klasör, `suru_karar` PostgreSQL şeması için dış veri toplama ve normalizasyon fazının çalışma alanıdır. Bu fazda model eğitimi yapılmaz; önce veri kaynakları kataloglanır, indirilebilir dosyalar yerleştirilir, dosya şemaları incelenir ve raw/event tablo mapping şablonu üretilir.

## 1. Ortam Kurulumu

```bash
cd KDS/Sürüden_keep_cull
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` içindeki PostgreSQL değerlerini kendi ortamına göre doldur. Gerçek şifre repoya yazılmamalıdır.

## 2. Klasör Hazırlama

```bash
python scripts/01_prepare_directories.py
```

Bu komut `docs/`, `sql/`, `data/`, `data/raw/`, `data/external/`, `data/manual_downloads/`, `data/processed/`, `scripts/`, `notebooks/`, `reports/` ve `config/` klasörlerini idempotent olarak oluşturur.

## 3. SQL Şema Kurulumu

Mevcut DDL:

```bash
psql -d laktasens_poc -f Data/Database/create.sql
```

Yeni `sql/00_schema_suru_karar.sql` dosyası sadece placeholder'dır; mevcut DDL bozulmasın diye gerçek şema `Data/Database/create.sql` içinde bırakıldı.

## 4. Kaynakları Kayıt Etme

```bash
python scripts/02_register_sources.py
```

Bu komut `config/data_sources.yaml` dosyasını okuyup `suru_karar.meta_veri_kaynagi` tablosuna `insert ... on conflict` mantığıyla işler.

Alternatif olarak SQL seed:

```bash
psql -d laktasens_poc -f sql/01_seed_meta_veri_kaynagi.sql
psql -d laktasens_poc -f sql/02_seed_reward_parametre_baseline.sql
```

## 5. Veri İndirme

```bash
python scripts/03_download_sources.py
```

Doğrudan indirilebilen kaynaklar `data/external/<source_code>/` altına yazılır. Manuel işlem gereken kaynaklar `data/manual_downloads/README.md` içine eklenir. Her deneme `reports/download_log.csv` dosyasına kaydedilir.

## 6. Dosya İnceleme

```bash
python scripts/04_inspect_downloaded_files.py
```

CSV, TSV/TAB, XLSX ve ZIP içindeki desteklenen dosyalar taranır. Sonuçlar `reports/file_inspection_report.md` içine yazılır.

## 7. Mapping Template Üretme

```bash
python scripts/05_generate_column_mapping_template.py
```

Her indirilen dosya kolonu için `reports/column_mapping_template.csv` üretilir. Otomatik öneriler başlangıçtır; raw tablo yükleme öncesinde manuel onay gerekir.

## 8. Ekonomik Reward Adaylarını Çıkarma

```bash
python scripts/06_extract_reward_parameter_candidates.py
python scripts/11_build_reward_baseline.py
```

İlk komut USDA NASS ve USDA ERS dosyalarından `feat_reward_parametre` için aday ekonomik değerleri çıkarır. İkinci komut kaynak değerlerinden `baseline_us_2025_mixed_source_v1` senaryosunu üretir:

- `data/processed/reward_baseline_us_2025.csv`
- `reports/reward_baseline_us_2025_review.md`
- `sql/08_seed_reward_parametre_us_2025.sql`

Bu baseline içinde `sut_fiyati` ve `gunluk_bakim_maliyeti` kaynak veriden türetilir; replacement, cull satış, tedavi ve tohumlama maliyetleri açıkça sentetik prototip varsayımı olarak işaretlenir.

PostgreSQL'e yazmak için:

```bash
psql -d laktasens -f sql/08_seed_reward_parametre_us_2025.sql
```

## 9. Kolon Anlamı ve Raw Yerleşim Raporları

```bash
python scripts/07_build_column_semantic_review.py
```

Bu komut `config/canonical_event_rules.yaml` ile mapping template'i birleştirir. `reports/column_semantic_review.md` ve `reports/raw_load_plan.md` üretilir.

## 10. Raw ve Event Candidate CSV Üretimi

```bash
python scripts/08_build_raw_and_event_candidates.py
```

Güvenilir tabular kaynaklardan dry-run çıktılarını üretir:

- `data/processed/raw_candidates/*.csv`
- `data/processed/event_candidates/*.csv`
- `data/processed/event_normalized_candidates.csv`
- `data/processed/map_external_inek_candidates.csv`
- `data/processed/rejected_rows.csv`

## 11. Opsiyonel PostgreSQL Yükleme

```bash
python scripts/09_load_canonical_to_postgres.py
```

`.env` yoksa hata vermeden DB yüklemeyi atlar. `.env` varsa candidate CSV'leri `suru_karar` şemasına kaynak bazlı replace mantığıyla yüklemeye çalışır.

Alternatif olarak candidate CSV'leri doğrudan PostgreSQL'e yüklemek için:

```bash
psql -d laktasens -f sql/06_load_raw_event_candidates_from_csv.sql
```

## 12. Eğitim Veri Seti Snapshot Üretimi

```bash
python scripts/10_build_training_snapshots.py
```

Candidate event CSV'lerinden aylık hayvan snapshot veri setini üretir:

- `data/processed/training/inek_aylik_snapshot.csv`
- `data/processed/training/inek_aylik_snapshot_model_ready.csv`
- `data/processed/training/train_test_split.csv`
- `reports/training_feature_list.md`
- `reports/training_dataset_review.md`

PostgreSQL karşılığı için:

```bash
psql -d laktasens -f sql/03_build_feat_inek_aylik_snapshot.sql
psql -d laktasens -f sql/04_select_training_dataset_with_split.sql
```

Dry-run CSV çıktısını doğrudan PostgreSQL tablosuna yüklemek için:

```bash
psql -d laktasens -f sql/05_load_training_snapshot_from_csv.sql
```

Prototip UI/DB smoke-test için RL tablolarını açıkça sentetik olarak doldurmak için:

```bash
psql -d laktasens -f sql/07_seed_synthetic_smoke_test_records.sql
```

## 13. Baseline Risk Modeli

```bash
python scripts/12_train_baseline_risk_models.py
python scripts/13_validate_baseline_robustness.py
python scripts/14_build_culling_observable_training_set.py
python scripts/12_train_baseline_risk_models.py --rules config/baseline_model_culling_observable_rules.yaml
python scripts/13_validate_baseline_robustness.py --rules config/baseline_model_culling_observable_rules.yaml
python scripts/15_engineer_culling_observable_features.py
python scripts/12_train_baseline_risk_models.py --rules config/baseline_model_engineered_rules.yaml
python scripts/13_validate_baseline_robustness.py --rules config/baseline_model_engineered_rules.yaml
python scripts/16_train_calibrated_engineered_baseline.py
python scripts/24_tabularize_health_auxiliary_sources.py
python scripts/17_engineer_payload_enriched_features.py
python scripts/25_engineer_health_auxiliary_features.py
python scripts/12_train_baseline_risk_models.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/13_validate_baseline_robustness.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/16_train_calibrated_engineered_baseline.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/18_build_data_coverage_audit.py
python scripts/19_enrich_culling_reason_labels.py
python scripts/20_validate_strict_splits.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/21_train_survival_time_to_event_baseline.py --rules config/baseline_model_payload_enriched_rules.yaml
python scripts/22_build_risk_band_calibration_report.py
python scripts/23_build_reason_specific_audit.py
python scripts/26_build_health_auxiliary_improvement_report.py
python scripts/27_select_health_feature_ablation.py
```

Bu komut Logistic Regression, Random Forest ve kuruluysa XGBoost/LightGBM
baseline modellerini `cull_within_30d`, `cull_within_60d`, `cull_within_90d`
hedefleri için dener. Ana seçim metriği PR-AUC'tur. İkinci komut `source_code`
shortcut riskini ölçmek için no-source ve source-holdout validasyon yapar.
Sonraki üç komut culling label gözlenebilirliği düzeltmesini uygular ve aynı
baseline/robustluk testlerini culling-observable eğitim setinde tekrarlar.
Son dört komut rolling/missingness feature engineering ve calibrated baseline
çalıştırır. Payload-enriched komutları ise mevcut raw/event payload alanlarından
sensör, dry-off ve leakage-safe Marcenat laktasyon feature'ları çıkarıp aynı
model/robustluk/kalibrasyon kontrollerini tekrarlar. Son beş komut MDP öncesi
sağlamlaştırma adımıdır: veri coverage audit, culling reason audit etiketi,
animal/cohort/source holdout validasyon, survival-style hazard baseline ve risk
band kalibrasyon raporu üretir.
Son komut Primiparous survival sheet, CatBoost ve culling reason segmentleri
sonrası iyileşmeyi özetler.
Health auxiliary komutları ise SCC RAR, organic SCM DOCX ve Chiozza lameness
XLSX kaynaklarını tabular hale getirir; culling label taşımayan kaynakları
negatif örnek gibi kullanmadan Marcenat/Primiparous tarafındaki leakage-safe
sağlık feature ablation katmanını ve etki raporunu üretir.
Son ablation komutu source-code kullanmayan 90 günlük risk adayı seçer; amaç
source shortcut riskini azaltıp MDP smoke-test için daha taşınabilir skor
üretmektir.

Çıktılar:

- `data/processed/models/baseline_model_metrics.csv`
- `data/processed/models/baseline_risk_scores.csv` seçilen en iyi primary modelin test risk skorlarıdır
- `data/processed/models/baseline_feature_importance.csv`
- `data/processed/models/baseline_best_model_metadata.json`
- `Model/baseline_risk/*.joblib`
- `reports/baseline_model_report.md`
- `reports/baseline_feature_importance.md`
- `reports/baseline_robustness_report.md`
- `reports/culling_label_quality_audit.md`
- `reports/baseline_model_culling_observable_report.md`
- `reports/baseline_robustness_culling_observable_report.md`
- `reports/baseline_culling_observable_comparison.md`
- `reports/engineered_feature_review.md`
- `reports/baseline_model_engineered_report.md`
- `reports/baseline_robustness_engineered_report.md`
- `reports/baseline_calibration_engineered_report.md`
- `reports/phase_4_1_engineered_baseline_summary.md`
- `reports/payload_enriched_feature_review.md`
- `reports/baseline_model_payload_enriched_report.md`
- `reports/baseline_robustness_payload_enriched_report.md`
- `reports/baseline_calibration_payload_enriched_report.md`
- `reports/phase_4_2_payload_enriched_summary.md`
- `reports/data_coverage_audit.md`
- `reports/culling_reason_enrichment_report.md`
- `reports/strict_validation_payload_enriched_report.md`
- `reports/survival_time_to_event_baseline_report.md`
- `reports/risk_band_calibration_payload_enriched_report.md`
- `reports/phase_4_3_pre_mdp_readiness_summary.md`
- `reports/reason_specific_audit_payload_enriched_report.md`
- `reports/phase_4_4_survival_catboost_reason_summary.md`
- `reports/health_auxiliary_tabularization_report.md`
- `reports/health_auxiliary_feature_enrichment_report.md`
- `reports/phase_4_5_health_auxiliary_improvement_summary.md`
- `reports/phase_4_6_health_feature_ablation_report.md`

## 14. Ortam Kontrolü

```bash
python scripts/00_check_environment.py
```

Python sürümü, paketler, klasörler, `.env` varlığı ve opsiyonel PostgreSQL bağlantısı kontrol edilir.

## 15. RL / MDP Cevre Spesifikasyonu

Faz 5'in ilk çıktısı environment sözleşmesidir:

- `docs/07_rl_cevresi_cow_replacement_env_spec.md`
- `config/rl_env_rules.yaml`
- `scripts/28_build_mdp_transition_dataset.py`
- `scripts/29_build_empirical_transition_model.py`
- `scripts/30_simulate_cow_replacement_env.py`

Bu doküman `CowReplacementEnv` için state/action/reward/transition sınırlarını,
terminal durumları, reward bileşenlerini, empirical transition V1 mantığını ve
baseline policy smoke-test gerekliliğini tanımlar. Transition dataset üretmek
için:

```bash
python scripts/28_build_mdp_transition_dataset.py
python scripts/29_build_empirical_transition_model.py
python scripts/30_simulate_cow_replacement_env.py
```

Çıktılar:

- `data/processed/rl/mdp_state_table.csv`
- `data/processed/rl/mdp_transition_dataset.csv`
- `data/processed/rl/mdp_transition_summary.csv`
- `data/processed/rl/mdp_state_bucket_summary.csv`
- `reports/mdp_transition_dataset_review.md`
- `data/processed/rl/empirical_transition_model.csv`
- `data/processed/rl/transition_fallback_model.csv`
- `reports/empirical_transition_model_review.md`
- `data/processed/rl/policy_simulation_results.csv`
- `data/processed/rl/policy_simulation_trace.csv`
- `reports/cow_replacement_env_smoke_test_report.md`

Bu adımda RL eğitimi yapılmaz; state bucket, observed keep transition,
empirical transition probability model ve baseline policy smoke-test üretilir.

## 16. Ana RL Çözümü: Model-Based MDP

Faz 6 çıktısı value iteration ile çözülen ilk model-based MDP policy
prototipidir:

- `docs/08_ana_rl_cozumu_mdp.md`
- `scripts/31_build_mdp_reward_table.py`
- `scripts/32_solve_mdp_value_iteration.py`
- `scripts/33_analyze_mdp_policy_scenarios.py`

Çalıştırma sırası:

```bash
python scripts/31_build_mdp_reward_table.py
python scripts/32_solve_mdp_value_iteration.py
python scripts/33_analyze_mdp_policy_scenarios.py
```

Çıktılar:

- `data/processed/rl/mdp_reward_table.csv`
- `data/processed/rl/mdp_value_iteration_result.csv`
- `data/processed/rl/optimal_policy_table.csv`
- `data/processed/rl/mdp_scenario_results.csv`
- `data/processed/rl/mdp_scenario_policy_comparison.csv`
- `reports/mdp_reward_table_review.md`
- `reports/mdp_policy_decision_report.md`
- `reports/mdp_scenario_analysis_report.md`

Baseline çözüm mevcut prototip ekonomisiyle `144` state için `keep`, `18` state
için `cull` üretir. Senaryo analizinde düşük süt fiyatı, düşük replacement
maliyeti veya yüksek cull satış değeri bazı ek state'leri `cull` aksiyonuna
çevirir. Bu sonuç production policy olarak değil, reward kalibrasyonu gerektiren
ilk MDP çekirdeği olarak yorumlanmalıdır.

## 17. Karşılaştırmalı RL Deneyleri

Faz 7 çıktısı, MDP referans çözümünü heuristic ve simulator RL benchmark'larıyla
karşılaştırır:

- `docs/09_karsilastirmali_rl_deneyleri.md`
- `scripts/34_audit_rl_algorithm_readiness.py`
- `scripts/35_compare_rl_algorithms.py`

Çalıştırma sırası:

```bash
python scripts/34_audit_rl_algorithm_readiness.py
python scripts/35_compare_rl_algorithms.py
```

Çıktılar:

- `data/processed/rl/rl_algorithm_readiness.csv`
- `data/processed/rl/rl_algorithm_comparison_results.csv`
- `data/processed/rl/rl_algorithm_policy_table.csv`
- `reports/rl_algorithm_readiness_report.md`
- `reports/rl_algorithm_comparison_report.md`

Bu fazda CQL/IQL/BCQ çalıştırılmaz; gerçek logged keep/cull action verisi
olmadığı için eligibility-only olarak raporlanır. PPO/DQN tarafı ise production
RL sonucu değil, empirical simulator üzerinde smoke benchmark olarak ele alınır.

## 18. Gymnasium + Stable-Baselines3 PPO/DQN

Gerçek Gymnasium wrapper ve Stable-Baselines3 train/eval loop Faz 7.1 olarak
eklendi:

- `docs/10_gymnasium_sb3_ppo_dqn_egitimi.md`
- `scripts/cow_replacement_gym_env.py`
- `scripts/36_train_sb3_ppo_dqn.py`
- `requirements-rl.txt`

Opsiyonel RL paketleri ana `requirements.txt` dosyasından ayrı tutulur. Linux
CPU-only kurulum için:

```bash
python -m venv /tmp/laktasens-rl-venv
/tmp/laktasens-rl-venv/bin/python -m pip install --upgrade pip wheel
/tmp/laktasens-rl-venv/bin/python -m pip install -r requirements-rl.txt
```

Çalıştırma:

```bash
/tmp/laktasens-rl-venv/bin/python scripts/36_train_sb3_ppo_dqn.py
```

Çıktılar:

- `data/processed/rl/sb3_training_results.csv`
- `data/processed/rl/sb3_policy_table.csv`
- `data/processed/rl/sb3_eval_episodes.csv`
- `reports/sb3_ppo_dqn_training_report.md`
- `Model/rl/sb3/`

Bu script dependency eksikse hata vermez; `missing_dependency` raporu üretir.
Paketler kurulduğunda PPO ve DQN modellerini eğitir, kaydeder ve MDP policy ile
karşılaştırır.

İlk CPU prototip çalışmasında PPO ve DQN `5000` timestep ile eğitildi:

- `Model/rl/sb3/ppo_cow_replacement.zip`
- `Model/rl/sb3/dqn_cow_replacement.zip`

Sonuçlar `reports/sb3_ppo_dqn_training_report.md` içinde tutulur. Daha uzun
eğitim için `config/rl_env_rules.yaml` altındaki
`stable_baselines3.algorithms.*.total_timesteps` değerleri artırılabilir.

## 19. RL Deney Notebook ve Model Code Runner

RL deneylerini parametre değiştirerek notebook veya terminalden çalıştırmak için
ayrı bir code runner katmanı eklendi. `--mode model` ile çalışan modeller
artık eski `scripts/` dosyalarına paslamaz; algoritma kodu doğrudan
`Model/rl/code/models/*.py` içinde durur.

- `Model/rl/code/README.md`
- `Model/rl/code/experiment_parameters.yaml`
- `Model/rl/code/training_environment.py`
- `Model/rl/code/models/common.py`
- `Model/rl/code/model_registry.py`
- `Model/rl/code/experiment_runner.py`
- `Model/rl/code/run_all_experiments.py`
- `Model/rl/code/models/`
- `notebooks/rl_experiment_runner.ipynb`

Model kodlari `models/` altinda ailelere ayrildi:

- `models/model_based/`: MDP/value iteration
- `models/tabular/`: tabular Q-learning ve PPO-style smoke
- `models/approximate/`: fitted Q / MLP yaklasimlari
- `models/stable_baselines/`: SB3 PPO/DQN modelleri
- `models/offline/`: CQL/IQL/BCQ uygunluk placeholder'lari

Notebook üzerinden:

1. `notebooks/rl_experiment_runner.ipynb` dosyasını aç.
2. Model aileleri ve çıktı sözleşmesi bölümlerini oku.
3. Parametre hücresinde MDP, tabular RL, fitted Q ve SB3 timestep/eval değerlerini değiştir.
4. `RUN_MODELS` ve `RUN_DEEP_RL` değerleriyle hangi modellerin çalışacağını seç.
5. Çıktı tabloları, policy dağılımları, scenario sensitivity ve SB3 artifact durumunu notebook içinden incele.

Terminalden:

```bash
python Model/rl/code/run_all_experiments.py --mode mdp
python Model/rl/code/run_all_experiments.py --mode compare
python Model/rl/code/run_all_experiments.py --mode sb3 --sb3-python /tmp/laktasens-rl-venv/bin/python
```

Tek model:

```bash
python Model/rl/code/run_all_experiments.py --mode list-models
python Model/rl/code/run_all_experiments.py --mode model --model mdp_value_iteration
python Model/rl/code/run_all_experiments.py --mode model --model sb3_ppo --sb3-python /tmp/laktasens-rl-venv/bin/python
```

Tüm pipeline:

```bash
python Model/rl/code/run_all_experiments.py --mode all
```

## Sonraki Adım

Faz 7.1 sonunda model-based MDP hala ana referanstır. Sonraki mantıklı adım
opsiyonel RL ortamında SB3 eğitimini çalıştırmak, reward parametrelerini
çiftlik/ülke ekonomisine göre kalibre etmek ve ardından learned transition model
denemesine geçmektir.
