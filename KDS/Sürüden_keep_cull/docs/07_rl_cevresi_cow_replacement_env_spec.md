# 07 - CowReplacementEnv RL/MDP Cevre Spesifikasyonu

## Amac

Bu fazda supervised culling risk skorunu MDP/RL simülasyonuna bağlayacak ilk
çevre sözleşmesi tanımlanır. Hedef production policy üretmek değildir. Hedef,
aylık zaman adımıyla çalışan, state/action/reward/transition bileşenleri açık
olan ve smoke-test simülasyonları çalıştırılabilen `CowReplacementEnv`
prototipidir.

Bu doküman Faz 5'in ilk çıktısıdır. Sonraki adımda `config/rl_env_rules.yaml`,
transition dataset üretimi ve environment kodu bu sözleşmeye göre yazılacaktır.

## Kapsam

- Ortam adı: `CowReplacementEnv`
- Arayüz: Gymnasium tarzı `reset()`, `step(action)`, `observation_space`,
  `action_space`
- Zaman adımı: 1 ay
- Karar birimi: tek inek
- Firma/tenant/multi-farm yok
- Şema standardı: `suru_karar`
- Dry-run veri kaynağı:
  `data/processed/training/inek_aylik_snapshot_culling_observable_payload_enriched_model_ready.csv`
- Risk skoru adayı:
  `data/processed/models/payload_enriched/health_feature_ablation/selected_source_agnostic_risk_scores.csv`
- Seçili supervised aday:
  `all_health_aux + CatBoost`, `source_code` olmadan, 90 günlük PR-AUC
  `0.379632`

## Cevre Semantigi

Her episode tek bir hayvanın aylık yaşam çizgisidir.

Episode başlangıcı:

- Hayvanın ilk geçerli aylık snapshot satırı
- `referans_tarih` episode başlangıç tarihi olur
- State yalnız bu tarihe kadar gözlenebilir feature'lardan oluşur

Episode bitişi:

- Ajan `action=1` ile hayvanı sürüden çıkarır
- Transition modeli exogenous/observed culling terminali üretir
- Hayvanın son gözlem ayına ulaşılır
- Maksimum episode uzunluğu aşılır

Terminal durumlar:

- `terminal_reason = agent_cull`
- `terminal_reason = observed_or_sampled_cull`
- `terminal_reason = end_of_observation`
- `terminal_reason = max_episode_length`

## State V1

State v1 kompakt tutulur. Amaç tüm model feature setini birebir RL state yapmak
değil, ekonomik/biolojik karar için yorumlanabilir bir MDP state tanımlamaktır.

Önerilen state alanları:

| Alan | Kaynak kolon/adayi | Tip | Not |
|---|---|---|---|
| `laktasyon_no` | `laktasyon_no` | numeric | Eksikse impute + missing flag |
| `parite` | `parite` | numeric | Yas/parite proxy |
| `dim` | `dim` | numeric | Days in milk |
| `dim_month` | `dim_month` | numeric | Aylık transition için daha stabil |
| `yas_gun` | `yas_gun`, `marcenat_age_days_payload` | numeric | Güvenilir değilse null/impute |
| `gebe_mi` | `gebe_mi` | binary/null | Belirsiz durum ayrı flag |
| `servis_sayisi` | `servis_sayisi` | numeric | Son doğum sonrası servis sayısı |
| `son_servis_gun` | `son_servis_gun` | numeric | Eksikse missing flag |
| `son30_ortalama_sut` | `son30_ortalama_sut`, `milk_avg_60/90` | numeric | Aylık gelir için ana süt seviyesi |
| `sut_trend_7g` | `sut_trend_7g`, `milk_trend_30_vs_prev30` | numeric | Üretim trendi |
| `health_count_90` | `health_count_90` | numeric | Yakın sağlık yükü |
| `mastitis_flag` | `mastitis_flag`, `marcenat_prev_lact_mastitis_any` | binary | Sağlık riski |
| `lameness_flag` | `lameness_flag`, `marcenat_prev_lact_lameness_any` | binary | Sağlık riski |
| `cell_risk_flag` | `marcenat_prev_lact_cell_total_source_p75_flag` | binary/null | SCC/proxy risk |
| `cull_risk_90d` | seçili CatBoost risk skoru | numeric | Policy feature değilse ablation ile kapatılabilir |
| `risk_band` | risk skoru bandı | categorical/int | Transition/reward cezası için |

State v1'de `source_code`, `canonical_animal_id`, `snapshot_id`,
`first_cull_date`, label kolonları ve culling reason kolonları observation içine
girmez. Bunlar episode yönetimi, audit veya raporlama için metadata olarak
tutulur.

## Action Space

Discrete action space:

| Action | Anlam | Terminal |
|---:|---|---|
| `0` | keep / elde tut | Hayır, transition bir sonraki aya gider |
| `1` | cull / sürüden çıkar | Evet, agent kaynaklı terminal |

V1'de replacement hayvan seçimi ayrı action değildir. Cull action sonrası
episode biter; replacement maliyeti reward içinde değerlendirilir. Daha sonraki
fazda replacement kalitesi veya heifer availability ayrı state/action boyutu
olabilir.

## Reward V1

Reward aylık net ekonomik katkı olarak tanımlanır. Para birimi config ile
seçilir. Mevcut baseline ekonomik adaylar ABD kaynaklı olduğu için ilk smoke-test
`baseline_us_2025_mixed_source_v1` senaryosuyla çalışabilir.

### Keep Reward

`action = 0` için:

```text
reward_keep =
    milk_revenue_month
  - maintenance_cost_month
  - health_risk_cost_month
  - reproduction_risk_cost_month
  - expected_culling_risk_cost_month
```

Tanımlar:

- `milk_revenue_month = estimated_milk_kg_month * milk_price_per_kg`
- `estimated_milk_kg_month = daily_milk_kg * days_in_month`
- `daily_milk_kg` için öncelik:
  1. `son30_ortalama_sut`
  2. `milk_avg_60`
  3. `milk_avg_90`
  4. kaynak/evre median imputation
- `maintenance_cost_month = daily_maintenance_cost * days_in_month`
- `health_risk_cost_month` mastitis/lameness/SCC risk flag'leri ve health event
  sayısından gelir
- `reproduction_risk_cost_month` gebe olmayan, yüksek servis sayısı veya uzun
  `son_servis_gun` durumlarını cezalandırır
- `expected_culling_risk_cost_month` risk skorundan türetilen beklenen gelecek
  kayıp cezasıdır; V1'de ablation ile açılıp kapatılabilir

### Cull Reward

`action = 1` için:

```text
reward_cull =
    cull_sale_value
  - replacement_cost
  - disposal_or_transaction_cost
```

Notlar:

- `cull_sale_value` kesin kaynak değeri yoksa senaryo parametresidir.
- `replacement_cost` Faz 4 reward baseline içinde açıkça sentetik/prototip
  varsayım olarak işaretlenmiştir.
- V1 smoke-test'te bu değerler config'ten okunur; hard-code edilmez.

## Transition V1

İlk transition modeli empirical/discretized model olacaktır. Learned transition
model V2'dir.

### Keep Transition

`action = 0` için transition:

```text
P(s_{t+1}, terminal | s_t, keep)
```

Dry-run üretim mantığı:

1. Aynı `canonical_animal_id` için snapshot'lar `referans_tarih` sırasına dizilir.
2. Ardışık aylar eşleştirilir: `snapshot_t -> snapshot_t_plus_1`.
3. State discretization yapılır:
   - laktasyon evresi
   - parite grubu
   - DIM bandı
   - süt seviyesi bandı
   - süt trend bandı
   - sağlık risk bandı
   - culling risk bandı
4. Her state bucket için gözlenen `next_state_bucket` dağılımı hesaplanır.
5. Gözlenen culling varsa terminal olasılığı ayrıca hesaplanır.
6. Veri seyrekse fallback sırası kullanılır:
   - exact bucket
   - bucket without risk band
   - lactation stage + parity group
   - global empirical transition

### Cull Transition

`action = 1` deterministiktir:

```text
P(terminal=agent_cull | s_t, cull) = 1
```

### Risk Skoru Kullanımı

Seçili supervised model 90 günlük risk üretir. Aylık transition için iki kullanım
vardır:

1. Smoke-test basit dönüşüm:

```text
p_cull_30d = 1 - (1 - p_cull_90d) ** (1 / 3)
```

2. Survival/hazard dosyası varsa doğrudan 30 günlük hazard skoru kullanımı.

V1'de ikisi de raporlanabilir; environment default'u config ile seçilir.

## Observation ve Metadata Ayrımı

`observation` sadece agent'ın görebileceği state vektörüdür.

`info` içine yazılabilecek metadata:

- `snapshot_id`
- `canonical_animal_id`
- `referans_tarih`
- `source_code`
- `risk_score_model`
- `risk_band`
- `terminal_reason`
- reward bileşenleri
- transition bucket

Bu ayrım leakage kontrolü için zorunludur.

## Baseline Policy'ler

Environment hazır olduğunda ilk testler RL algoritması değildir. Önce basit
policy'ler çalıştırılır:

| Policy | Tanım | Amaç |
|---|---|---|
| `keep_all` | Her ay keep | Alt sınır / mevcut sürüde tutma senaryosu |
| `cull_all_now` | İlk ay cull | Agresif replacement sınırı |
| `risk_threshold` | Risk bandı eşik üstüyse cull | Supervised skorun ekonomik karşılığı |
| `milk_margin_threshold` | Aylık net süt marjı düşükse cull | Ekonomik sezgisel baseline |
| `random_policy` | Rastgele keep/cull | Smoke-test ve environment sanity check |

RL algoritması ancak bu policy'ler çalıştıktan, reward bileşenleri makul
dağıldıktan ve transition terminal oranları kontrol edildikten sonra denenir.

## Dosya ve Kod Çıktıları

Uygulanan Faz 5.2 çıktıları:

1. `config/rl_env_rules.yaml`
   - state kolonları
   - reward parametre kaynakları
   - discretization bandları
   - transition fallback sırası
   - risk skoru dosyası
2. `scripts/28_build_mdp_transition_dataset.py`
   - snapshot çiftleri
   - discretized state bucket
   - next-state ve terminal gözlemleri

Üretilen dry-run dosyaları:

- `data/processed/rl/mdp_state_table.csv`
- `data/processed/rl/mdp_transition_dataset.csv`
- `data/processed/rl/mdp_transition_summary.csv`
- `data/processed/rl/mdp_state_bucket_summary.csv`
- `reports/mdp_transition_dataset_review.md`

Sonraki implementasyon adımları:

3. `scripts/29_build_empirical_transition_model.py`
   - transition probability table
   - fallback transition table
4. `scripts/30_simulate_cow_replacement_env.py`
   - `CowReplacementEnv`
   - baseline policy smoke-test
   - simulation report

Uygulanan Faz 5.3 çıktıları:

- `data/processed/rl/empirical_transition_model.csv`
- `data/processed/rl/transition_fallback_model.csv`
- `reports/empirical_transition_model_review.md`
- `data/processed/rl/policy_simulation_results.csv`
- `data/processed/rl/policy_simulation_trace.csv`
- `reports/cow_replacement_env_smoke_test_report.md`

`CowReplacementEnv` ilk prototipi Gymnasium tarzı `reset()` / `step(action)`
semantiğini uygular, fakat şu an ayrı bir `gymnasium.Env` subclass'i değildir.
Bu tercih ek bağımlılık eklemeden smoke-test yapabilmek içindir.

Model-based transition sampling bucket içinden temsilci state satırı seçer.
Bu nedenle trace dosyasında episode kimliği için `canonical_animal_id`, sampled
state kaynağı için `state_source_canonical_animal_id` ayrı tutulur.

Olası Python modül yapısı:

```text
src/
  suru_karar/
    rl/
      cow_replacement_env.py
      reward.py
      transition.py
      policies.py
```

Repo şu an `src/` kullanmadığı için ilk prototip script içinde kalabilir. Kod
stabil olduğunda modüle taşınır.

## Kabul Kriterleri

Faz 5.1 tamam sayılması için:

- Environment spec dokümanı oluşturulmuş olacak.
- State/action/reward/transition sınırları net olacak.
- Leakage alanları observation dışında kalacak.
- Reward bileşenleri config'ten okunacak şekilde tanımlanacak.
- Transition V1'in empirical/discretized olduğu açık olacak.
- RL eğitimine geçmeden önce baseline policy smoke-test gerekliliği yazılmış
  olacak.

## Bilinen Riskler

- Source-holdout performansı zayıf olduğu için risk skoru gerçek policy bileşeni
  gibi yorumlanamaz.
- Reward parametreleri halen senaryo/prototip niteliği taşır.
- SCC/Chiozza/organic sağlık kaynakları tabular olsa da culling label örtüşmesi
  olmadığı için transition modelinde doğrudan terminal etiketi olarak
  kullanılmaz.
- Empirical transition seyrek bucket'larda gürültülü olabilir; fallback ve
  smoothing gerekir.
- V1 ortamı canlı sistemle entegre değildir.

## Faz 5.1 Karari

Bu spesifikasyonla Faz 5'e geçiş uygundur. İlk kod hedefi RL algoritması değil,
`CowReplacementEnv` için çalışır state/action/reward/transition smoke-test
pipeline'ıdır.

## Faz 6 Baglantisi

Faz 5 çıktıları Faz 6'da model-based MDP çözümüne bağlandı. Ana doküman:

- `docs/08_ana_rl_cozumu_mdp.md`

Faz 6 komutları:

```bash
python scripts/31_build_mdp_reward_table.py
python scripts/32_solve_mdp_value_iteration.py
python scripts/33_analyze_mdp_policy_scenarios.py
```

Bu adım `mdp_reward_table`, `mdp_value_iteration_result`, `optimal_policy_table`
ve senaryo karşılaştırma raporlarını üretir.
