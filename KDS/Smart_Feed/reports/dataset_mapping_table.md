# Smart Feed Dış Veri Kaynağı - Tablo Eşleme Matrisi

Bu rapor `ml_smart_feed` için dış veri kaynaklarının rolünü, hangi katmanı
beslediğini ve hangi tabloya ineceğini özetler. Kaynak listesi
`config/data_sources.yaml` ile uyumludur.

## Rol Kararı

| Rol | Kaynaklar | Karar |
|---|---|---|
| Ana cow-day omurga | `mmcows_multimodal` | Birincil omurga. Süt, sensör, çevre ve sınırlı sağlık kayıtlarını aynı zaman penceresinde bağlar. |
| Ana sağlık/metabolik label omurgası | `transition_cow_part2` | Proje A risk etiketleri için ana destek. Biomarker + sağlık + üretim/üreme sonuçları taşır. |
| Yardımcı sağlık/üreme/sensör | `czech_production_repro`, `plos_rumiwatch_calving`, `agroscope_activity_zenodo` | Laktasyon, üreme, davranış ve hastalık penceresi bilgisini tamamlar. |
| Besin/rasyon parametresi | `ns_dairy_cattle`, `nasem_2021_ncbi`, `feedipedia` | Yem kompozisyonu, DMI, enerji/protein/mineral gereksinimi ve rasyon kısıtlarını sağlar. |
| Çevre parametresi | `nasa_power_environment` | Dış sıcaklık/nem serileri ve THI türetimi sağlar. |
| Ekonomik/reward parametresi | `usda_ams_dairy`, `eu_agri_food_milk`, `ulusal_sut_konseyi`, `turib_feed_commodities` | Süt geliri, yem maliyeti ve reward senaryolarını besler. |

## Kaynak - Hedef Tablo Matrisi

| Kaynak | Ne işe yarıyor | Ham hedef | Normalize/feature hedefi | Opt/sim hedefi | Veri tipi |
|---|---|---|---|---|---|
| `mmcows_multimodal` | Multimodal cow-day state kurar | `raw_cow`, `raw_milk`, `raw_sensor`, `raw_environment`, `raw_health` | `norm_cow_profile`, `norm_milk_daily`, `norm_sensor_daily`, `norm_environment_daily`, `norm_health_event`, `feat_cow_day_snapshot`, `feat_milk_trend`, `feat_health_risk_label` | `sim_state` | Snapshot / high-frequency |
| `transition_cow_part2` | Sağlık-metabolik risk ve üretim/üreme outcome label'ı verir | `raw_cow`, `raw_lactation`, `raw_health`, `raw_milk` | `norm_cow_profile`, `norm_lactation_daily`, `norm_health_event`, `norm_milk_daily`, `feat_health_risk_label`, `feat_feeding_need_label` | `sim_state` | Event + outcome |
| `czech_production_repro` | Breed/parity/süt/üreme ilişkisi verir | `raw_cow`, `raw_lactation`, `raw_milk` | `norm_cow_profile`, `norm_lactation_daily`, `norm_milk_daily`, `feat_cow_day_snapshot`, `feat_milk_trend` | Yok | Result / test-day |
| `plos_rumiwatch_calving` | Geçiş dönemi davranış, hastalık tanı kriteri ve rasyon özeti verir | `raw_sensor`, `raw_health`, `raw_feed` | `norm_sensor_daily`, `norm_health_event`, `norm_feeding_daily`, `feat_health_risk_label`, `feat_feeding_need_label` | `opt_ration_constraint`, `sim_reward_parameter` | Group-level result / relative event |
| `agroscope_activity_zenodo` | Aktivite ve alan kullanımı normalizasyonunu test eder | `raw_sensor` | `norm_sensor_daily`, `feat_cow_day_snapshot` | `sim_state` | 1 dakikalık sensor snapshot |
| `ns_dairy_cattle` | DMI, enerji, protein ve besin ihtiyacı motoru sağlar | `raw_feed`, `raw_feed_ingredient` | `norm_feeding_daily`, `feat_feeding_need_label` | `opt_feed_ingredient`, `opt_feed_nutrient_value`, `opt_ration_constraint`, `sim_reward_parameter` | Reference/model |
| `nasem_2021_ncbi` | Yem kompozisyonu ve bilimsel kısıt referansı sağlar | `raw_feed_ingredient` | `feat_feeding_need_label` | `opt_feed_ingredient`, `opt_feed_nutrient_value`, `opt_ration_constraint`, `sim_reward_parameter` | Reference table |
| `feedipedia` | Alternatif/yaygın yem kompozisyonlarını tamamlar | `raw_feed_ingredient` | Yok | `opt_feed_ingredient`, `opt_feed_nutrient_value` | Reference table |
| `nasa_power_environment` | Günlük sıcaklık/nem ve THI bağlamı sağlar | `raw_environment` | `norm_environment_daily`, `feat_cow_day_snapshot` | `sim_state` | Location-day parameter |
| `usda_ams_dairy` | ABD süt/yem fiyat ve market raporu sağlar | `raw_economic_parameter` | Yok | `opt_feed_price`, `opt_milk_price`, `sim_reward_parameter` | Economic time series |
| `eu_agri_food_milk` | AB çiğ süt ve dairy fiyat serileri sağlar | `raw_economic_parameter` | Yok | `opt_milk_price`, `sim_reward_parameter` | Economic time series |
| `ulusal_sut_konseyi` | Türkiye çiğ süt fiyatı sağlar | `raw_economic_parameter` | Yok | `opt_milk_price`, `sim_reward_parameter` | Economic time series |
| `turib_feed_commodities` | Türkiye arpa/mısır/buğday yem fiyat proxy sağlar | `raw_economic_parameter` | Yok | `opt_feed_price`, `sim_reward_parameter` | Market snapshot / time series |

## Ana Omurga Neden Tek Kaynak Değil?

Smart Feed problemi hem biyolojik state tahmini hem de rasyon optimizasyonu
istiyor. Açık veri ekosisteminde aynı anda cow-day süt, sensör, sağlık, DMI,
yem hammaddesi, fiyat ve gerçek rasyon aksiyonu veren tek bir kaynak yok.

Bu nedenle ana omurga iki parçalı seçildi:

- `mmcows_multimodal`: gerçek cow-day multimodal state omurgası.
- `transition_cow_part2`: sağlık/metabolik risk label omurgası.

Besin ve ekonomik kaynaklar hayvan-bazlı olmadığı için ana omurga değil,
parametre katmanıdır.

## Load Önceliği

1. `agroscope_activity_zenodo` ile sensör ETL dry-run.
2. `plos_rumiwatch_calving` ile diagnosis/risk sözlüğü ve rasyon referans seed'i.
3. `mmcows_multimodal` ile cow-day omurga.
4. `transition_cow_part2` ile health-risk label zenginleştirme.
5. `ns_dairy_cattle`, `nasem_2021_ncbi`, `feedipedia` ile besin/rasyon referansı.
6. `nasa_power_environment`, `ulusal_sut_konseyi`, `turib_feed_commodities`,
   `usda_ams_dairy`, `eu_agri_food_milk` ile senaryo/reward katmanı.
