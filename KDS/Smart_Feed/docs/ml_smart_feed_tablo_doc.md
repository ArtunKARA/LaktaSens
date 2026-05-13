# ml_smart_feed Tablo Dokümanı

Bu doküman, LaktaSens içinde canlı `core` şemasını bozmadan çalışacak `ml_smart_feed` eğitim/simülasyon katmanının tablo yapısını açıklar.

Amaç iki fazı aynı veri altyapısı altında ayırmaktır:

- **Proje A:** Laktasyon evresi, besleme ihtiyacı, süt performansı ve sağlık/metabolik risk tahmini.
- **Proje B:** Proje A çıktılarıyla yem/rasyon optimizasyonu, maliyet-verim-risk dengesi ve simülasyon/policy çıktıları.

---

## 1. İsimlendirme Mantığı

| Prefix | Anlamı | Kullanım |
|---|---|---|
| `meta_*` | Veri kaynağı, deney koşusu ve senaryo bilgileri | Ortak |
| `raw_*` | Ham dış veri tabloları | A + B |
| `map_*` | Dış veri / core / standart değer eşleme tabloları | A + B |
| `norm_*` | Temizlenmiş ve normalize edilmiş günlük/olay verileri | A + B |
| `feat_*` | Proje A feature, snapshot, label ve tahmin tabloları | A ağırlıklı |
| `opt_*` | Proje B yem, rasyon, fiyat ve optimizasyon tabloları | B |
| `sim_*` | State, action, transition, reward ve policy tabloları | B ağırlıklı |

---

## 2. Genel Tablo Kullanım Haritası

| Grup | Tablo | Amaç | Proje A | Proje B | Girdi/Çıktı |
|---|---|---|---:|---:|---|
| Meta | `meta_veri_kaynagi` | Dış veri kaynağı, dosya, API veya manuel yükleme takibi | Evet | Evet | Girdi |
| Meta | `meta_experiment_run` | Model, optimizasyon veya simülasyon çalıştırma takibi | Evet | Evet | İzleme |
| Meta | `meta_senaryo` | Fiyat, risk, rasyon ve optimizasyon senaryoları | Kısmen | Evet | Girdi |
| Raw | `raw_cow` | Ham hayvan profil verisi | Evet | Kısmen | Girdi |
| Raw | `raw_milk` | Ham süt ölçüm verisi | Evet | Kısmen | Girdi |
| Raw | `raw_lactation` | Ham doğum, DIM, laktasyon ve kuru dönem verisi | Evet | Kısmen | Girdi |
| Raw | `raw_health` | Ham sağlık olayları | Evet | Kısmen | Girdi/Label kaynağı |
| Raw | `raw_feed` | Ham yemleme/rasyon kayıtları | Evet | Evet | Girdi |
| Raw | `raw_feed_ingredient` | Ham yem hammaddesi ve besin değeri verisi | Hayır | Evet | Girdi |
| Raw | `raw_sensor` | Ham rumination, aktivite, yatma süresi, sıcaklık verileri | Evet | Kısmen | Girdi |
| Raw | `raw_environment` | Ham sıcaklık, nem ve THI verileri | Evet | Kısmen | Girdi |
| Raw | `raw_economic_parameter` | Ham süt fiyatı, yem fiyatı ve maliyet parametreleri | Hayır | Evet | Girdi |
| Map | `map_external_cow` | Dış hayvan ID ile `norm_cow_profile` ve opsiyonel core ID eşlemesi | Evet | Evet | Eşleme |
| Map | `map_lactation_stage` | Laktasyon evresi isimlerini standartlaştırma | Evet | Evet | Eşleme |
| Map | `map_health_event_type` | Hastalık/sağlık olaylarını standart tipe çevirme | Evet | Kısmen | Eşleme |
| Map | `map_feed_type` | Yem adlarını standart yem koduna çevirme | Kısmen | Evet | Eşleme |
| Map | `map_sensor_type` | Sensör ölçüm tiplerini standartlaştırma | Evet | Kısmen | Eşleme |
| Map | `map_unit` | Birimleri standartlaştırma | Evet | Evet | Eşleme |
| Norm | `norm_cow_profile` | Standart hayvan profili | Evet | Evet | Girdi |
| Norm | `norm_lactation_daily` | Günlük DIM ve laktasyon evresi | Evet | Evet | Girdi |
| Norm | `norm_milk_daily` | Günlük süt ve süt kalite verileri | Evet | Evet | Girdi |
| Norm | `norm_health_event` | Normalize sağlık olayları | Evet | Kısmen | Girdi/Label kaynağı |
| Norm | `norm_feeding_daily` | Günlük yemleme ve tahmini DMI | Evet | Evet | Girdi |
| Norm | `norm_sensor_daily` | Günlük sensör özetleri | Evet | Kısmen | Girdi |
| Norm | `norm_environment_daily` | Günlük çevre/THI özetleri | Evet | Kısmen | Girdi |
| Feature | `feat_cow_day_snapshot` | Proje A ana günlük eğitim snapshotı | Evet | Evet | Girdi |
| Feature | `feat_milk_trend` | 7/14/30 günlük süt trend özellikleri | Evet | Kısmen | Girdi |
| Feature | `feat_health_risk_label` | Ketozis, mastitis, asidoz gibi hedef etiketleri | Evet | Hayır | Label |
| Feature | `feat_feeding_need_label` | Besleme ihtiyacı sınıfı | Evet | Evet | Çıktı/Label |
| Feature | `feat_model_input_a` | Proje A final model girdi veri seti | Evet | Hayır | Girdi |
| Feature | `feat_prediction_a` | Proje A tahmin çıktısı | Evet | Evet | Çıktı/Girdi |
| Opt | `opt_feed_ingredient` | Standart yem hammaddeleri | Hayır | Evet | Girdi |
| Opt | `opt_feed_nutrient_value` | Yemlerin enerji/protein/lif/mineral değerleri | Hayır | Evet | Girdi |
| Opt | `opt_feed_price` | Yem fiyatları | Hayır | Evet | Girdi |
| Opt | `opt_milk_price` | Süt fiyatı ve kalite katsayıları | Hayır | Evet | Girdi |
| Opt | `opt_ration_constraint` | Laktasyon/ihtiyaç sınıfına göre rasyon kısıtları | Hayır | Evet | Girdi |
| Opt | `opt_ration_scenario` | Optimizasyon amaç ve ağırlıkları | Hayır | Evet | Girdi |
| Opt | `opt_ration_candidate` | Üretilen rasyon adayları | Hayır | Evet | Çıktı |
| Opt | `opt_ration_candidate_item` | Rasyon adayı içindeki yem miktarları | Hayır | Evet | Çıktı |
| Opt | `opt_ration_score` | Rasyon maliyet, gelir, risk ve toplam skorları | Hayır | Evet | Çıktı |
| Sim | `sim_reward_parameter` | Reward/ceza katsayıları | Hayır | Evet | Girdi |
| Sim | `sim_state` | Proje A çıktısından üretilen state | Kısmen | Evet | Girdi |
| Sim | `sim_action` | Rasyon seçimi veya yem miktarı aksiyonu | Hayır | Evet | Girdi/Çıktı |
| Sim | `sim_transition` | State-action sonrası yeni durum ve reward | Kısmen | Evet | Çıktı |
| Sim | `sim_policy_output` | Son önerilen politika/rasyon çıktısı | Hayır | Evet | Çıktı |
| Sim | `sim_action_log` | Simülasyon aksiyon logları | Hayır | Evet | İzleme |

---

## 3. Proje A Veri Akışı

Proje A'nın amacı ineğin durumunu anlamak, laktasyon evresini belirlemek, besleme ihtiyacını tahmin etmek ve risk/erken uyarı üretmektir.

```text
raw_cow
raw_milk
raw_lactation
raw_health
raw_feed
raw_sensor
raw_environment
        ↓
map_*
        ↓
norm_cow_profile
norm_lactation_daily
norm_milk_daily
norm_health_event
norm_feeding_daily
norm_sensor_daily
norm_environment_daily
        ↓
feat_cow_day_snapshot
feat_milk_trend
feat_health_risk_label
feat_feeding_need_label
        ↓
feat_model_input_a
        ↓
feat_prediction_a
```

### Proje A Ana Girdileri

| Veri Grubu | Örnek Alanlar | Kaynak Tablo |
|---|---|---|
| Hayvan durumu | `cow_id`, `parity`, `body_weight_kg`, `bcs`, `pregnancy_status` | `norm_cow_profile`, `feat_cow_day_snapshot` |
| Laktasyon | `dim`, `lactation_stage`, `calving_date`, `dry_off_date` | `norm_lactation_daily` |
| Üretim | `daily_milk_yield_kg`, `milk_fat_percent`, `milk_protein_percent`, `scc` | `norm_milk_daily` |
| Besleme | `ration_type`, `estimated_dmi_kg`, `forage_concentrate_ratio` | `norm_feeding_daily` |
| Sensör | `rumination_minutes`, `activity_level`, `lying_time_minutes`, `body_temperature` | `norm_sensor_daily` |
| Çevre | `avg_thi`, `max_thi`, `avg_temperature_c` | `norm_environment_daily` |

### Proje A Ana Çıktıları

| Çıktı | Açıklama | Tablo |
|---|---|---|
| `lactation_stage` | Erken, orta, geç, kuru veya geçiş dönemi | `feat_prediction_a` |
| `feeding_need_class` | Yüksek enerji, protein destekli, bakım, geçiş desteği vb. | `feat_prediction_a` |
| `estimated_dmi_kg` | Tahmini kuru madde tüketimi | `feat_prediction_a` |
| `expected_milk_yield_kg` | Beklenen süt verimi | `feat_prediction_a` |
| `energy_deficit_risk_score` | Enerji açığı risk skoru | `feat_prediction_a` |
| `ketosis_risk_score` | Ketozis riski | `feat_prediction_a` |
| `mastitis_risk_score` | Mastitis riski | `feat_prediction_a` |
| `asidosis_risk_score` | Asidoz riski | `feat_prediction_a` |
| `early_warning_flag` | Erken uyarı bayrağı | `feat_prediction_a` |

---

## 4. Proje B Veri Akışı

Proje B'nin amacı Proje A çıktılarıyla en uygun rasyonu bulmak, maliyet-verim-risk dengesini kurmak ve karar destek çıktısı üretmektir.

```text
feat_prediction_a
feat_cow_day_snapshot
norm_feeding_daily
        +
opt_feed_ingredient
opt_feed_nutrient_value
opt_feed_price
opt_milk_price
opt_ration_constraint
opt_ration_scenario
        ↓
opt_ration_candidate
opt_ration_candidate_item
opt_ration_score
        ↓
sim_state
sim_action
sim_transition
sim_policy_output
```

### Proje B Ana Girdileri

| Veri Grubu | Örnek Alanlar | Kaynak Tablo |
|---|---|---|
| Proje A çıktısı | `feeding_need_class`, `estimated_dmi_kg`, `risk_score`, `expected_milk_yield_kg` | `feat_prediction_a` |
| Hayvan durumu | `cow_id`, `record_date`, `dim`, `bcs`, `lactation_stage` | `feat_cow_day_snapshot` |
| Yem listesi | `feed_code`, `feed_name`, `feed_category` | `opt_feed_ingredient` |
| Besin değeri | `nel_mcal_kg_dm`, `cp_percent_dm`, `ndf_percent_dm`, `starch_percent_dm` | `opt_feed_nutrient_value` |
| Yem fiyatı | `price_per_kg_dm` | `opt_feed_price` |
| Süt fiyatı | `milk_price_per_kg`, `fat_bonus`, `protein_bonus`, `scc_penalty` | `opt_milk_price` |
| Rasyon kısıtı | `nutrient_code`, `min_value`, `max_value`, `hard_constraint` | `opt_ration_constraint` |
| Senaryo | `objective_type`, `weight_cost`, `weight_health_risk` | `opt_ration_scenario` |

### Proje B Ana Çıktıları

| Çıktı | Açıklama | Tablo |
|---|---|---|
| Önerilen rasyon adayı | İnek/grup için oluşturulan rasyon önerisi | `opt_ration_candidate` |
| Rasyon içeriği | Hangi yemden kaç kg DM / as-fed verileceği | `opt_ration_candidate_item` |
| Yem maliyeti | Toplam günlük yem maliyeti | `opt_ration_score` |
| Beklenen süt geliri | Tahmini süt verimi üzerinden gelir | `opt_ration_score` |
| Beklenen marj | Süt geliri - yem maliyeti - risk cezaları | `opt_ration_score` |
| Sağlık riski cezası | Ketozis, mastitis, asidoz vb. risklerin ekonomik cezası | `opt_ration_score` |
| Toplam skor | Optimizasyon sonucu seçimi destekleyen skor | `opt_ration_score` |
| Policy çıktısı | Son önerilen aksiyon/rasyon | `sim_policy_output` |

---

## 5. Temel Tabloların Kolon Sözlüğü

### `feat_cow_day_snapshot`

Proje A'nın ana günlük snapshot tablosudur. Her satır bir ineğin bir gündeki durumunu temsil eder.

| Kolon | Açıklama |
|---|---|
| `cow_id` | Normalize edilmiş inek ID |
| `record_date` | Snapshot tarihi |
| `parity` | Parite / doğum sayısı |
| `body_weight_kg` | Canlı ağırlık |
| `bcs` | Vücut kondisyon skoru |
| `dim` | Doğumdan itibaren geçen gün |
| `pregnancy_status` | Gebelik durumu |
| `lactation_stage` | Laktasyon evresi |
| `daily_milk_yield_kg` | Günlük süt verimi |
| `milk_fat_percent` | Süt yağ oranı |
| `milk_protein_percent` | Süt protein oranı |
| `fat_protein_ratio` | Yağ/protein oranı |
| `scc` | Somatik hücre sayısı |
| `estimated_dmi_kg` | Tahmini kuru madde tüketimi |
| `rumination_minutes` | Günlük geviş süresi |
| `activity_level` | Aktivite düzeyi |
| `thi` | Sıcaklık-nem indeksi |

### `feat_prediction_a`

Proje A modelinin ürettiği tahmin ve risk çıktılarıdır. Proje B'nin ana girişlerinden biridir.

| Kolon | Açıklama |
|---|---|
| `run_id` | Model koşusu |
| `cow_id` | İnek ID |
| `record_date` | Tahmin tarihi |
| `lactation_stage` | Tahmin edilen / doğrulanan laktasyon evresi |
| `feeding_need_class` | Besleme ihtiyacı sınıfı |
| `estimated_dmi_kg` | Tahmini DMI |
| `expected_milk_yield_kg` | Beklenen süt verimi |
| `energy_deficit_risk_score` | Enerji açığı risk skoru |
| `ketosis_risk_score` | Ketozis risk skoru |
| `mastitis_risk_score` | Mastitis risk skoru |
| `asidosis_risk_score` | Asidoz risk skoru |
| `early_warning_flag` | Erken uyarı bayrağı |
| `explanation_json` | SHAP/feature importance/açıklama çıktısı |

### `opt_ration_candidate`

Optimizer tarafından üretilen rasyon adaylarını tutar.

| Kolon | Açıklama |
|---|---|
| `run_id` | Optimizasyon koşusu |
| `ration_scenario_id` | Kullanılan optimizasyon senaryosu |
| `cow_id` | İnek bazlı optimizasyon için inek ID |
| `group_id` | Grup bazlı optimizasyon için grup ID |
| `record_date` | Rasyon öneri tarihi |
| `source_prediction_id` | Proje A tahmin çıktısı referansı |
| `candidate_rank` | Aday sıralaması |
| `selected_flag` | Seçilen öneri mi? |
| `feasible_flag` | Kısıtlara uygun mu? |
| `infeasible_reason` | Uygun değilse nedeni |

### `opt_ration_candidate_item`

Bir rasyon adayının içindeki yem hammaddelerini ve miktarlarını tutar.

| Kolon | Açıklama |
|---|---|
| `ration_candidate_id` | Rasyon adayı |
| `feed_ingredient_id` | Yem hammaddesi |
| `amount_kg_dm` | Kuru madde bazında miktar |
| `amount_kg_asfed` | Yaş/as-fed bazda miktar |
| `cost` | Bu kalemin maliyeti |

### `opt_ration_score`

Rasyon adayının ekonomik, biyolojik ve risk skorunu tutar.

| Kolon | Açıklama |
|---|---|
| `total_dmi_kg` | Toplam kuru madde miktarı |
| `total_feed_cost` | Günlük toplam yem maliyeti |
| `expected_milk_yield_kg` | Beklenen süt verimi |
| `expected_milk_revenue` | Beklenen süt geliri |
| `expected_margin` | Beklenen marj |
| `health_risk_penalty` | Sağlık riski cezası |
| `ration_change_penalty` | Rasyon değişim cezası |
| `total_score` | Optimizasyon toplam skoru |
| `nutrient_summary_json` | Rasyonun besin özeti |
| `score_detail_json` | Skor hesabı detayları |

### `sim_state`, `sim_action`, `sim_transition`, `sim_policy_output`

Bu tablolar Proje B'nin ileri fazında MDP/RL veya simülasyon tabanlı karar destek için kullanılır.

| Tablo | Açıklama |
|---|---|
| `sim_state` | İneğin o anki durumunu JSON state olarak tutar |
| `sim_action` | Rasyon seçimi veya yem miktarı vektörü gibi aksiyonu tutar |
| `sim_transition` | State + action sonrası oluşan yeni state ve reward bilgisini tutar |
| `sim_policy_output` | Son önerilen policy/rasyon kararını tutar |

---

## 6. Kısa Özet

`ml_smart_feed` şeması; ham dış veri, mapping, normalize veri, eğitim snapshotları, Proje A tahmin çıktıları, Proje B yem/rasyon optimizasyon tabloları ve simülasyon/policy çıktılarını PostgreSQL üzerinde düzenli şekilde saklamak için tasarlanmıştır. Bu sayede canlı LaktaSens `core` yapısı korunur; risk tahmini ve yem optimizasyonu güvenli bir POC katmanında geliştirilir.
