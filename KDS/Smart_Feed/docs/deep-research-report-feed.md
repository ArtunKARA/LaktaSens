# ml_smart_feed için şema odaklı veri araştırması

## Sonuç özeti

Yüklediğin proje tanımı ve tablo dokümanları, sistemi iki ana hatta ayırıyor: birinci hat inek bazında laktasyon, süt verimi, DMI/besleme ihtiyacı ve sağlık-metabolik risk tahmini; ikinci hat ise bu çıktıları kullanarak rasyon optimizasyonu, maliyet-verim-risk dengesi ve daha sonra MDP/RL için state-action-transition-reward üretimi. Şema da buna uygun biçimde `raw_*`, `norm_*`, `feat_*`, `opt_*` ve `sim_*` katmanlarına ayrılmış durumda. Bu ayrım, “tek dataset yükle-geç” yaklaşımından çok, çok kaynaklı bir veri havuzi ve ETL kurgusunu gerektiriyor. fileciteturn0file0L293-L330 fileciteturn0file1L677-L739 fileciteturn0file1L847-L893 fileciteturn0file1L934-L1012

En kritik bulgu şu: bu proje için tek ve “mükemmel” açık dataset pratikte görünmüyor. Açık kaynaklar parçalı durumda. Bazıları sağlık-biyobelirteç ve geçiş dönemi olaylarını iyi veriyor ama yem ve fiyat tarafını vermiyor; sensör veri setleri davranış ve aktiviteyi iyi veriyor ama DMI ve detaylı süt kompozisyonunu vermiyor; NASEM/Feedipedia gibi kaynaklar ise rasyon ve besin tarafında çok güçlü ama bunlar cow-day değil, referans/kompozisyon verisi. Ekonomik kaynaklar da çoğunlukla piyasa zaman serisi veriyor, hayvan-bazlı sonuç vermiyor. Bu nedenle en mantıklı mimari, hibrit veri havuzu + sentetik tamamlama + kurallı biyolojik sınırlar yaklaşımıdır. citeturn15view7turn15view4turn17view2turn10view3turn10view4turn13view0turn28view2

Pratikte önerdiğim çekirdek veri paketi şu kombinasyondur: geçiş dönemi sağlık ve biyobelirteçleri için Cornell/Mendeley transition cow veri seti; üretim-üreme ilişkileri için Czech Republic Mendeley veri seti; sensör ve davranış için PLOS RumiWatch supplement + Agroscope time-series + MmCows; besin ve rasyon tarafı için NASEM 2021 + NCBI feed composition tables + Feedipedia + NS Dairy Cattle; çevre için NASA POWER veya ERA5; fiyat ve ekonomik parametreler için USDA AMS, AB agri-food portalı, Türkiye için Ulusal Süt Konseyi ve TÜRİB. Bu kombinasyon Proje A için yüksek doğruluklu feature engineering, Proje B için ise güvenli ve denetlenebilir optimizasyon altyapısı kurar. citeturn15view7turn16view5turn34view0turn15view4turn17view2turn10view3turn10view4turn11view1turn32view0turn32view1turn13view0turn13view3turn14view4turn14view2

## En iyi kaynaklar

Aşağıdaki tablo, projeye en çok katkı verecek on çekirdek kaynağı, doğrudan şema eşlenebilirliği perspektifiyle özetler.

| Sıra | Veri kaynağı | Link | Proje A | Proje B | Schema uyumluluğu | En uygun tablolar | Ana eksik |
|---|---|---|---:|---:|---:|---|---|
| 1 | Transition cow nutrition and management strategies Part II dataset | Mendeley veri kaynağı citeturn15view7 | 9 | 6 | 8 | `raw_health`, `norm_health_event`, `raw_lactation`, `norm_lactation_daily`, `feat_health_risk_label` | Günlük yem/rasyon ve detaylı süt kompozisyonu sınırlı |
| 2 | Association between production and reproduction parameters based on parity and breed of dairy cows in the Czech Republic | Mendeley veri kaynağı citeturn15view2turn16view5turn29search0 | 8 | 4 | 7 | `raw_cow`, `raw_lactation`, `norm_cow_profile`, `norm_lactation_daily` | Cow-day sensör, DMI, hastalık olayları yok |
| 3 | Assessment of feeding, ruminating and locomotion behaviors around calving | PLOS makale ve supplement ham veri citeturn34view0turn15view6turn35view0turn35view1 | 9 | 4 | 8 | `raw_sensor`, `raw_health`, `norm_sensor_daily`, `norm_health_event`, `feat_health_risk_label` | Uzun dönem süt/ekonomi yok |
| 4 | Time Series of Dairy Cow Activity and Barn Area Use | Zenodo veri kaynağı citeturn15view4turn16view0 | 8 | 5 | 7 | `raw_sensor`, `norm_sensor_daily`, `feat_cow_day_snapshot` | Sağlık label ve süt kompozisyonu yok |
| 5 | MmCows: A Multimodal Dataset for Dairy Cattle Monitoring | GitHub/Kaggle mirror açıklaması citeturn17view2 | 8 | 6 | 8 | `raw_sensor`, `raw_environment`, `raw_milk`, `norm_sensor_daily`, `norm_environment_daily`, `norm_milk_daily` | Süre kısa; hayvan sayısı sınırlı |
| 6 | The Nutrition System for Dairy Cattle | Mendeley veri kaynağı citeturn10view4 | 7 | 10 | 9 | `feat_feeding_need_label`, `opt_ration_constraint`, `sim_reward_parameter` | Ham çiftlik verisi değil; hesaplayıcı/model |
| 7 | Nutrient Requirements of Dairy Cattle 8th ed. + NCBI Feed Composition chapter | National Academies + NCBI citeturn10view2turn10view3 | 7 | 10 | 9 | `opt_feed_ingredient`, `opt_feed_nutrient_value`, `opt_ration_constraint` | Makineye hazır CSV değil; ETL gerekir |
| 8 | Feedipedia | Feedipedia citeturn11view1turn11view3 | 5 | 9 | 8 | `opt_feed_ingredient`, `opt_feed_nutrient_value`, `raw_feed_ingredient` | Yapılandırılmış veri kalitesi heterojen |
| 9 | NASA POWER / ERA5 / NOAA CDO | Resmî çevre verileri citeturn32view0turn32view1turn32view2 | 8 | 7 | 8 | `raw_environment`, `norm_environment_daily`, `feat_cow_day_snapshot`, `sim_state` | Ahır içi mikroklima doğrudan yok |
| 10 | USDA AMS + EU agri-food portal + Türkiye USK/TÜRİB | Resmî fiyat kaynakları citeturn13view0turn13view1turn13view3turn28view2turn14view4turn14view2 | 4 | 10 | 9 | `raw_economic_parameter`, `opt_feed_price`, `opt_milk_price`, `sim_reward_parameter` | Tedavi maliyeti ve hastalık cezası için ek literatür gerekir |

Top 10 dışında iki yardımcı kaynak da not edilmeli. İlki, 4.467 kayıt ve 32 parametre içeren, süt verimi, laktasyon numarası, lameness score ve BCS veren 2026 Zenodo veri seti; bu kaynak `raw_cow`, `raw_health`, `norm_cow_profile` ve `feat_health_risk_label` için iyi bir yardımcıdır. İkincisi, Kaggle’daki “Cattle Health and Feeding Data” gibi demonstratif veri setleridir; bunlar PoC veya UI demosu için işe yarayabilir ama provenance ve toplama metodolojisi açık olmadığından ana veri omurgası yapılmamalıdır. citeturn36view0turn2search5

## Detaylı kaynak değerlendirmesi

**Transition cow nutrition and management strategies of dairy herds in the northeastern United States: Part II — Associations of metabolic and inflammation-related analytes with health, milk yield, and reproduction**

**Kaynak linki:** Mendeley veri sayfası citeturn15view7  
**Kaynak türü:** Akademik / Mendeley Data. **Lisans:** CC BY 4.0. **Veri formatı:** Mendeley dosyaları. **Veri seviyesi:** Cow-level transition cohort + herd-level. **Zaman kapsama alanı:** Geçiş dönemi ve 305 gün/üreme çıktıları. **Kayıt büyüklüğü:** 1.473 inek, 72 çiftlik. **Bölge:** Northeastern United States. **Proje A uygunluğu:** 9/10. **Proje B uygunluğu:** 6/10. **Schema uyumluluğu:** 8/10. Gücü; biyobelirteçler ile klinik ketosis ve displaced abomasum gibi olayları bağlamasıdır. Eksiği; ham yem bileşenleri, ekonomik seri ve tam cow-day süt kompozisyonu olmamasıdır. citeturn15view7turn23search1

Bu kaynak, `raw_health`, `raw_lactation`, `norm_health_event`, `norm_lactation_daily` ve `feat_health_risk_label` için birincil adaydır. `pregnancy_status`, `days_open`, `milk_yield`, `calving_date` benzeri alanları destekler; ayrıca CK ve DA gibi olaylar doğrudan health label üretimi için kullanılabilir. Proje A’da çok değerlidir; Proje B’de ise doğrudan optimizasyon verisi vermez, fakat risk cezası katsayılarını ve reward fonksiyonundaki sağlık cezası bileşenini kalibre etmek için güçlüdür. citeturn15view7turn23search1turn37view2

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| cow id | inek kimliği | `raw_cow` | `source_animal_id` | Hayır | `farm_id` ile birlikte normalize edilmeli |
| parity / lactation number | laktasyon numarası | `raw_lactation` | `lactation_number` | Hayır | |
| health disorder | klinik olay | `raw_health` | `event_type` | Evet | CK, DA, metritis vb. kodlanmalı |
| biomarker threshold | risk göstergesi | `feat_health_risk_label` | `risk_label` / `risk_score` | Evet | Rule-based ve model-based etiket birlikte tutulmalı |
| reproductive outcome | days open / pregnancy | `norm_lactation_daily` | `days_open`, `pregnancy_status` | Evet | Günlük takvime expand edilmeli |

**ETL önerisi:** önce çiftlik ve hayvan kimlikleri `raw_cow` ve `raw_lactation` içine alınır; biyobelirteç ve hastalık olayları `raw_health` içine yüklenir; ardından olay tipleri standardize edilerek `norm_health_event` oluşturulur; calving başlangıç noktasıyla günlük laktasyon takvimi açılarak `norm_lactation_daily` üretilir; son aşamada biyobelirteç eşikleri ve olay pencereleri kullanılarak `feat_health_risk_label` doldurulur. **Genel skor:** 9/10. citeturn15view7turn23search1

**Association between production and reproduction parameters based on parity and breed of dairy cows in the Czech Republic**

**Kaynak linki:** Mendeley veri sayfası citeturn15view2turn16view5  
**Kaynak türü:** Akademik / Mendeley Data. **Lisans:** CC BY 4.0. **Veri formatı:** Mendeley dosyaları. **Veri seviyesi:** Cow-lactation ve performance-control türevi. **Zaman kapsama alanı:** 2018. **Kayıt büyüklüğü:** 659 inek. **Bölge:** Czech Republic. **Proje A uygunluğu:** 8/10. **Proje B uygunluğu:** 4/10. **Schema uyumluluğu:** 7/10. Gücü; breed, parity, süt bileşenleri ve üreme sonuçlarını birlikte vermesidir. Eksiği; sensör, DMI ve doğrudan sağlık olayları içermemesidir. citeturn15view2turn16view5turn29search0

Bu kaynak özellikle `raw_cow`, `norm_cow_profile`, `raw_lactation` ve `norm_lactation_daily` için uygundur. `breed`, `parity`, üretim ölçüleri, calving interval gibi alanlar Proje A’daki laktasyon ve verim tahminleri için yararlıdır. Ancak günlük örnekleme eksik olduğu için `norm_milk_daily` ve `feat_milk_trend` bölümü için ancak test-day veya lactation-summary kaynağı olarak kullanılmalıdır; tek başına trend veri seti değildir. citeturn15view2turn29search0

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| breed | ırk / melezlik | `norm_cow_profile` | `breed` | Hayır | Breed standardization gerekir |
| parity | parite | `norm_cow_profile` | `parity` | Hayır | |
| milk yield / fat / protein / lactose | üretim ve kalite | `raw_milk` | ilgili kolonlar | Evet | Günlük değilse test-day etiketiyle tutulmalı |
| calving interval | reprodüksiyon sonucu | `raw_lactation` | `days_open` / türetilmiş alan | Evet | CI’den days_open türetimi varsayımsal olabilir |
| calving date class | laktasyon başlangıç bağlamı | `raw_lactation` | `calving_date` | Kısmi | Tam tarih yoksa approx flag tutulmalı |

**ETL önerisi:** önce cow-level kimlik ve breed-parity alanları `raw_cow` içine; üretim-üreme kayıtları `raw_lactation` ve `raw_milk` içine; test-day/lactation summary ayrımı yapıldıktan sonra `norm_cow_profile` ve `norm_lactation_daily` üretilir; eğer örnekleme tarihi sınırlıysa `record_granularity='test_day'` gibi bir kalite alanı tutulmalıdır. **Genel skor:** 8/10. citeturn15view2turn16view5turn29search0

**Assessment of feeding, ruminating and locomotion behaviors in dairy cows around calving — PLOS supplement ham verisi**

**Kaynak linki:** PLOS makalesi ve S1 ham veri bağlantısı citeturn34view0turn15view6  
**Kaynak türü:** Akademik / makale eki. **Lisans:** Makale CC BY; supplement landing page ayrı lisansı açık göstermese de PLOS open-access ekosistemi içinde sunuluyor. **Veri formatı:** XLSX + DOCX ekler. **Veri seviyesi:** Cow-event ve cow-behavior around-calving. **Zaman kapsama alanı:** 2018’de üç aylık saha dönemi; inek başına wk -2, wk -1, wk +1 ve dd-2/dd-1/dd0 pencereleri. **Kayıt büyüklüğü:** 42 yetişkin Holstein-Friesian, 47 teşhis edilmiş hastalık olayı. **Bölge:** Güney İtalya. **Proje A uygunluğu:** 9/10. **Proje B uygunluğu:** 4/10. **Schema uyumluluğu:** 8/10. Büyük avantajı, doğrudan hastalık olayları ile sensör davranışlarını bağlamasıdır. citeturn34view0turn35view0turn35view1

Bu veri setinde puerperal metritis, retained fetal membrane, ketosis, subacute ruminal acidosis ve ayak-dijital lezyon tabanlı lameness ilişkili olaylar var. Bu nedenle `raw_health` ve `raw_sensor` bir arada beslenebilir. Ayrıca makalenin supporting information bölümünde close-up ve fresh cows için rasyon tablosu da bulunduğundan `raw_feed` için küçük bir seed/reference veri elde edilebilir. Proje A’da erken uyarı label’ları için çok değerlidir; Proje B’de ise doğrudan optimizer veri kaynağı değil, daha çok risk penaltesi ve feed-intake behavior proxy’leri için yardımcıdır. citeturn34view0turn35view0turn35view1

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| eating / rumination / lying / strides | sensör davranışı | `raw_sensor` | metrik kolonları | Evet | Dakika/sayı birimleri normalize edilmeli |
| disease diagnosis | hastalık tanısı | `raw_health` | `event_type` | Hayır | Doğrudan label |
| dd-2 / dd-1 / dd0 | olay referans penceresi | `norm_health_event` | `event_date` / `days_from_event` | Evet | Relative date -> absolute/relative yapı |
| ration close-up / fresh | rasyon özeti | `raw_feed` | `ration_type` ve içerik | Evet | Sınırlı ama faydalı seed veri |
| group H/S | sağlıklı-hasta label | `feat_health_risk_label` | `risk_label` | Hayır | Binary başlangıç etiketi |

**ETL önerisi:** sensor ham verisi `raw_sensor`, klinik olaylar `raw_health`, rasyon ek tablosu `raw_feed`; sonra davranış birimleri `norm_sensor_daily` içinde standartlaştırılır; olaylar `norm_health_event` içinde tip/kategoriye bağlanır; hastalık öncesi pencerelerden risk label üretilerek `feat_health_risk_label` oluşturulur. **Genel skor:** 9/10. citeturn34view0turn35view0turn35view1

**Time Series of Dairy Cow Activity and Barn Area Use**

**Kaynak linki:** Zenodo veri sayfası citeturn15view4turn16view0  
**Kaynak türü:** Zenodo / akademik açık veri. **Lisans:** CC BY 4.0. **Veri formatı:** Veri seti dosyaları. **Veri seviyesi:** 1 dakikalık sensor time-series. **Zaman kapsama alanı:** 55 ardışık gün. **Kayıt büyüklüğü:** 20 laktasyondaki inek. **Bölge:** İsviçre/Agroscope kümelenmesi. **Proje A uygunluğu:** 8/10. **Proje B uygunluğu:** 5/10. **Schema uyumluluğu:** 7/10. Avantajı; yüksek frekanslı aktivite ve barn-area use üretmesidir. Dezavantajı; doğrudan süt kompozisyonu ve hastalık label’ının olmamasıdır. citeturn15view4turn16view0

Bu kaynak `raw_sensor` ve `norm_sensor_daily` için çok iyi, fakat `raw_health` için ya olay yok ya da çok sınırlı. Bu yüzden doğrudan diagnosis yerine behavioral baseline ve anomaly detection için kullanılmalı. RL tarafında da `sim_state` içine “activity baseline”, “visit pattern entropy”, “lying/standing transitions” gibi türetilmiş durum değişkenleri vermesi açısından değerlidir. citeturn15view4turn16view0

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| activity measure | aktivite düzeyi | `raw_sensor` | `activity_level` | Evet | Günlük özet çıkarılmalı |
| barn area use | alan kullanımı | `raw_sensor` | türetilmiş alan | Evet | Zone-level feature |
| minute timestamp | zaman damgası | `raw_sensor` | `ts` | Hayır | |
| cow id | hayvan kimliği | `raw_cow` | `source_animal_id` | Hayır | |

**ETL önerisi:** 1 dakikalık kayıtlar `raw_sensor` içine alınır; günlük rumination/activity/lying proxy’leri `norm_sensor_daily` içinde toplanır; bireysel baseline ve sapma metrikleri `feat_cow_day_snapshot` için türetilir. **Genel skor:** 8/10. citeturn15view4turn16view0

**MmCows: A Multimodal Dataset for Dairy Cattle Monitoring**

**Kaynak linki:** GitHub açıklaması ve Kaggle/HuggingFace dağıtım bilgisi citeturn17view2  
**Kaynak türü:** Akademik açık veri / GitHub / Kaggle mirror. **Lisans:** Repo MIT lisansı gösteriyor; veri aynalarının kullanım şartları ayrıca doğrulanmalı. **Veri formatı:** ZIP, sensör dosyaları, görüntü, davranış label’ları. **Veri seviyesi:** Multimodal sensor + visual + milk + environment. **Zaman kapsama alanı:** 14 gün. **Kayıt büyüklüğü:** Görüntü verisi 16 inek; wearable sensor verisi 10 inek; günlük milk kayıtları 14 gün. **Bölge:** Purdue/ABD saha kurulumu. **Proje A uygunluğu:** 8/10. **Proje B uygunluğu:** 6/10. **Schema uyumluluğu:** 8/10. En güçlü yanı, aynı pakette `milk`, `cbt`, `thi`, `weather`, `health_records` ve davranış label’ı vermesidir. citeturn17view2

Bu veri seti tek başına bütün projeyi çözmez ama `raw_sensor`, `raw_environment` ve `raw_milk` için çok değerli bir “joined multimodal” çekirdek sağlar. Günlük süt verimi, core body temperature, indoor THI ve outdoor weather aynı zaman penceresinde bulunur. Bu yüzden Proje A için sensör-enviro-milk feature fusion denemelerinde çok işe yarar; Proje B’de ise doğrudan ration optimization yapmaz ama `sim_state` için gerçek çok-modlu durum örnekleri üretir. citeturn17view2

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| milk | günlük süt kg | `raw_milk` | `daily_milk_yield_kg` | Hayır | |
| cbt | core body temp | `raw_sensor` | `body_temperature` | Hayır | |
| thi / weather | çevre | `raw_environment` | `THI`, `temperature_c`, `humidity_percent` | Evet | Indoor/outdoor ayrımı korunmalı |
| health_records | sağlık kayıtları | `raw_health` | `event_type` | Evet | Sözlük gerekir |
| behavior_labels | davranış sınıfı | `raw_sensor` | davranış etiketleri | Evet | Vision-sensor fusion için |

**ETL önerisi:** önce sensör, milk ve environment kaynakları ayrı `raw_*` katmanlarına ayrılır; zaman damgaları ortak UTC/CDT standardına getirilir; günlük agregasyonla `norm_sensor_daily`, `norm_milk_daily`, `norm_environment_daily` oluşturulur; daha sonra bunlar `feat_cow_day_snapshot` içinde join edilir. **Genel skor:** 8/10. citeturn17view2

**The Nutrition System for Dairy Cattle**

**Kaynak linki:** Mendeley veri sayfası citeturn10view4  
**Kaynak türü:** Akademik model / spreadsheet. **Lisans:** Apache-2.0. **Veri formatı:** Spreadsheet/Calculator. **Veri seviyesi:** Requirement calculator ve diet evaluation model. **Zaman kapsama alanı:** Sürüm 5.0, 2024 güncellemesi. **Kayıt büyüklüğü:** Ham saha veri seti değil. **Bölge:** Brezilya kaynaklı model, genel kullanım. **Proje A uygunluğu:** 7/10. **Proje B uygunluğu:** 10/10. **Schema uyumluluğu:** 9/10. Gücü; DMI, su, enerji, protein, mineral ve vitamin gereksinimlerini hesaplayabilmesidir. citeturn10view4

Bu kaynak doğrudan `raw_*` tablo üretmez; bunun yerine `feat_feeding_need_label`, `opt_ration_constraint` ve kısmen `sim_reward_parameter` için kuramsal motor görevi görür. NASEM benzeri requirement engine olmadığı sürece Proje B sadece “ucuz yem seçici” olarak kalır; bu araç onu biyolojik kısıtlı optimizer’a çevirir. Ayrıca sentetik veri üretirken DMI ve nutrient requirement alanlarını gerçekçi sınırlar içinde oluşturmak için kullanılmalıdır. citeturn10view4turn10view2

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| predicted DMI | gereksinim DMI | `feat_feeding_need_label` | `estimated_dmi_kg` | Hayır | Model çıktısı |
| energy requirement | enerji ihtiyacı | `opt_ration_constraint` | enerji alt sınırı | Evet | NEL/ME birimine map |
| protein requirement | protein ihtiyacı | `opt_ration_constraint` | CP/MP kısıtı | Evet | |
| mineral requirement | mineral ihtiyacı | `opt_ration_constraint` | Ca/P vb. alt sınırlar | Evet | |
| methane/N excretion | çevresel ceza | `sim_reward_parameter` | penalty component | Evet | Opsiyonel |

**ETL önerisi:** bu kaynağı doğrudan ETL ile yüklemek yerine bir “reference calculator service” olarak kullan; inputları `feat_cow_day_snapshot` ve `norm_environment_daily`den al, çıktıları `feat_feeding_need_label` ve `opt_ration_constraint`a yaz. **Genel skor:** 10/10 Proje B, 7/10 Proje A. citeturn10view4

**NASEM/NRC: Nutrient Requirements of Dairy Cattle 8th edition + Nutrient Composition of Feeds**

**Kaynak linki:** National Academies sayfası ve NCBI bölüm citeturn10view2turn10view3  
**Kaynak türü:** Resmî/akademik referans. **Lisans durumu:** Referans yayın; makineye hazır veri lisansı değil, kullanım biçimi dikkatle yönetilmeli. **Veri formatı:** Kitap bölümü / tablolar. **Veri seviyesi:** Feed ingredient reference ve requirement science. **Zaman kapsama alanı:** 2021 sürümü; feed composition bölümü laboratuvarlardan toplanan çok yıllı veri özetlerine dayanıyor. **Proje A uygunluğu:** 7/10. **Proje B uygunluğu:** 10/10. **Schema uyumluluğu:** 9/10. Gücü; North America’da common feed composition, sınıflandırma ve nutrient requirement mantığını standartlaştırmasıdır. citeturn10view2turn10view3

Bu kaynak `opt_feed_ingredient`, `opt_feed_nutrient_value` ve `opt_ration_constraint` için temel referans olmalı. Ayrıca sentetik rasyon üretirken güvenli kısıtları tanımlamak için de kullanılmalı. Riski, bu kaynağın doğrudan CSV/API biçiminde olmaması ve bazı tabloların manuel/semi-automatic ETL gerektirmesidir. Buna rağmen Proje B’de en kritik referanslardan biridir. citeturn10view2turn10view3

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| feed classification | yem sınıfı | `opt_feed_ingredient` | `group_name` | Evet | Sınıf sözlüğü gerekir |
| DM, CP, NDF, starch, minerals | nutrient profile | `opt_feed_nutrient_value` | ilgili kolonlar | Hayır | Doğrudan map |
| nutrient requirement | ihtiyaç referansı | `opt_ration_constraint` | min/max kısıtlar | Evet | Cow-state’e göre parametrize edilmeli |

**ETL önerisi:** reference ingestion pipeline kur; her yem maddesi için canonical isim, kuru madde bazlı nutrient alanları ve referans kaynağı sakla; sonra optimizer `opt_feed_nutrient_value` tablosunu yalnız bu temiz referans tablodan kullansın. **Genel skor:** 10/10 Proje B. citeturn10view2turn10view3

**Feedipedia**

**Kaynak linki:** Feedipedia ana sayfa ve feed databases sayfası citeturn11view1turn11view3  
**Kaynak türü:** Resmî/uzman konsorsiyum kaynağı. **Lisans durumu:** Açık erişimli referans sitesi; toplu veri çekiminde kullanım şartları ayrıca doğrulanmalı. **Veri formatı:** Web tabanlı feed monografileri ve bağlantılı veri tabanları. **Veri seviyesi:** Feed ingredient/reference. **Bölge:** Küresel. **Proje A uygunluğu:** 5/10. **Proje B uygunluğu:** 9/10. **Schema uyumluluğu:** 8/10. Gücü; INRAE, CIRAD, AFZ ve FAO ortaklığında yürüyen besin/yem ansiklopedisi olmasıdır. Zayıf yanı; her zaman doğrudan makineye hazır, tek şemalı CSV sunmamasıdır. citeturn11view1turn11view3

Feedipedia, özellikle NASEM’in kapsamadığı ülke ve hammaddelerde `opt_feed_ingredient` ve `opt_feed_nutrient_value` için tamamlayıcıdır. Türkiye’ye yakın yem hammaddeleri ve yan ürünlerde küresel çeşitlilik sağlar. Ben bunu “authoritative backup reference” olarak konumlandırırım; primary source NASEM, secondary source Feedipedia olmalı. citeturn11view1turn11view3

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| feed name | yem adı | `opt_feed_ingredient` | `ingredient_name` | Evet | İsim standardizasyonu şart |
| nutrient descriptors | kimyasal bileşim | `opt_feed_nutrient_value` | DM/CP/NDF/ADF vb. | Evet | Unit harmonization gerekir |
| source metadata | kaynak izi | `opt_feed_nutrient_value` | `source_ref` | Hayır | Audit için önemli |

**ETL önerisi:** manuel kürasyonla seçilen yemleri önce staging alanına al; canonical ingredient ontology kur; nutrient alanlarını kuru madde bazında normalize et; kalite puanı ver; sonra `opt_feed_*` katmanına geçir. **Genel skor:** 9/10 Proje B’de yardımcı kaynak. citeturn11view1turn11view3

**NASA POWER / ERA5 / NOAA CDO çevre verileri**

**Kaynak linki:** NASA POWER Hourly API, ERA5 single levels, NOAA CDO citeturn32view0turn32view1turn32view2  
**Kaynak türü:** Resmî veri servisleri. **Lisans durumu:** Açık erişimli kamu iklim verileri; kullanım koşulları kaynak bazında izlenmeli. **Veri formatı:** JSON, CSV, NetCDF, ASCII, GRIB ve istasyon verileri. **Veri seviyesi:** Farm-day / hourly environment. **Zaman kapsama alanı:** NASA POWER 2001-near-real-time; ERA5 1940-present; NOAA tarihsel istasyon arşivi. **Proje A uygunluğu:** 8/10. **Proje B uygunluğu:** 7/10. **Schema uyumluluğu:** 8/10. Güçleri; hava sıcaklığı, nem ve THI türetimi için standart dış kaynak sağlamalarıdır. citeturn32view0turn32view1turn32view2

Bu kaynak ailesi `raw_environment` ve `norm_environment_daily` için standart omurga olmalı. NASA POWER saatlik meteorolojik veri ve CSV/JSON çıktısı verdiği için hızlı PoC’ye uygundur. ERA5 daha uzun zaman serisi ve reanalysis kalitesi verir. NOAA ise istasyon tabanlı kalite kontrollü tarihsel veriye erişim sunar. Ahır içi mikroklima yoksa dış ortamdan THI üretmek mümkündür; fakat indoor-outdoor farkı önemli olduğunda bu alan `environment_source='external_proxy'` olarak işaretlenmelidir. citeturn32view0turn32view1turn32view2turn25search3turn25search11

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| air temperature | ortam sıcaklığı | `raw_environment` | `temperature_c` | Hayır | |
| relative humidity | bağıl nem | `raw_environment` | `humidity_percent` | Hayır | |
| hourly timestamp | zaman damgası | `raw_environment` | `ts` | Hayır | |
| THI | sıcaklık-nem indeksi | `norm_environment_daily` | `thi_avg`,`thi_max` | Evet | Türetilecek |
| farm geocode | çiftlik lokasyonu | `raw_environment` | `farm_id` / lat-lon | Evet | Harici mapping gerekir |

**ETL önerisi:** farm geocode tablosu kur; saatlik dış ortam verisini `raw_environment` içine çek; THI ve heat-stress bayraklarını `norm_environment_daily`de hesapla; cow-day snapshot ile join ederek `feat_cow_day_snapshot` ve `sim_state`e taşı. **Genel skor:** 8/10. citeturn32view0turn32view1turn32view2

**USDA AMS + EU agri-food + Türkiye USK/TÜRİB ekonomik kaynak ailesi**

**Kaynak linki:** USDA Dairy Market News/Data.gov, USDA feedstuff raporları, EU milk/cereals/oilseeds portalı, USK çiğ süt fiyatı ve TÜRİB arpa/mısır fiyatları citeturn13view0turn13view1turn13view2turn13view3turn28view2turn14view4turn14view2  
**Kaynak türü:** Resmî kurum / piyasa veri setleri. **Lisans durumu:** USDA Dairy Market News Search Data.gov üzerinde CC0 olarak listeleniyor; AB ve Türkiye kaynaklarında kullanım koşulları kaynak sayfasına bağlı. **Veri formatı:** HTML, PDF, Excel indirilebilir portal, piyasa serileri. **Veri seviyesi:** Farm-gate milk price, component price, feed ingredient proxy price, market series. **Proje A uygunluğu:** 4/10. **Proje B uygunluğu:** 10/10. **Schema uyumluluğu:** 9/10. citeturn13view0turn13view1turn13view3turn28view2turn14view4turn14view2

Bu aile, `raw_economic_parameter`, `opt_feed_price`, `opt_milk_price` ve `sim_reward_parameter` için ana veri kaynağıdır. Türkiye tarafında USK 1 Mayıs 2026’dan itibaren %3,6 yağ ve %3,2 protein bazlı çiğ inek sütü tavsiye fiyatını 24,30 TL/L olarak açıklıyor; ayrıca her 0,1 puan yağ/protein farkı için ±0,36 TL/L düzeltme veriyor. TÜRİB ise arpa ve mısır için günlük/haftalık fiyat ve endeks yayımlıyor. ABD tarafında USDA AMS hem süt fiyat/haber datasetini hem feedstuff raporlarını hem de component fiyat açıklamalarını veriyor; ayrıca somatic cell adjustment rate dahi yayımlanıyor. AB portalı ise raw milk, cereals ve oilseeds serilerini Excel ile indirilebilir biçimde sağlıyor. Bunlar birlikte Proje B’nin ekonomik çekirdeğini kurar. citeturn14view4turn14view2turn13view0turn13view1turn31search0turn13view3turn28view2

| Veri kolon adı | Anlamı | Hedef tablo | Hedef kolon | Dönüşüm | Not |
|---|---|---|---|---|---|
| raw milk price | süt fiyatı | `opt_milk_price` | `milk_price_per_kg` | Evet | TL/L -> TL/kg approx veya litresel saklanmalı |
| fat/protein differential | kalite primi | `opt_milk_price` | `fat_bonus`,`protein_bonus` | Hayır | Türkiye için doğrudan var |
| feedstuff price | yem hammaddesi fiyatı | `opt_feed_price` | `price_per_kg_dm` | Evet | As-fed -> DM dönüşümü gerekir |
| SCC adjustment | kalite düzeltmesi | `sim_reward_parameter` | `milk_quality_penalty` | Evet | USDA component pricing’den türetilebilir |
| disease/treatment cost | sağlık maliyeti | `raw_economic_parameter` | `treatment_cost` | Evet | Literatür ile kalibre edilmeli |

**ETL önerisi:** ülke/bölge bazlı price-source registry kur; Türkiye için USK/TÜRİB, AB için agri-data portalı, ABD için USDA AMS pipeline’ları ayrı çalışsın; fiyatları ortak para birimi ve tarih frekansına normalize et; `opt_feed_price` ve `opt_milk_price`ı tarih-bölge bazlı version’la; sağlık maliyetlerini ayrı calibration tablosunda tutup `sim_reward_parameter`a aktar. **Genel skor:** 10/10 Proje B. citeturn13view0turn13view1turn13view3turn28view2turn14view4turn14view2turn37view2

## Tablo bazlı kapsama matrisi

Aşağıdaki matriste kısaltmalar kullandım: **TC** = Transition cow Mendeley, **CZ** = Czech Mendeley, **RW** = PLOS RumiWatch, **AG** = Agroscope time-series, **MM** = MmCows, **NS** = NS Dairy Cattle, **NA** = NASEM/NCBI, **FP** = Feedipedia, **ENV** = NASA/ERA5/NOAA, **ECO** = USDA/EU/USK/TÜRİB. Bu matriste “doğrudan veri” sütunu ham veya yakın-ham yüklemeyi; “dolaylı/türetilebilir” sütunu ise feature engineering, modelleme veya kural bazlı türetimi ifade eder. citeturn15view7turn16view5turn34view0turn15view4turn17view2turn10view4turn10view3turn11view1turn32view0turn13view0

| ml_smart_feed tablosu | Doğrudan veri var mı | Dolaylı/türetilebilir veri var mı | Hangi kaynaklardan gelir | Eksik alanlar | Sentetik veri gerekir mi? |
|---|---|---|---|---|---|
| `raw_cow` | Evet | Evet | TC, CZ, MM, yardımcı olarak HRV Zenodo citeturn15view7turn16view5turn17view2turn36view0 | birth_date, pregnancy_status bazı kaynaklarda yok | Kısmi |
| `raw_milk` | Evet | Evet | CZ, MM, TC citeturn16view5turn17view2turn15view7 | SCC, EC, süt sıcaklığı her kaynakta yok | Evet |
| `raw_lactation` | Evet | Evet | TC, CZ, RW citeturn15view7turn16view5turn34view0 | dry_off_date çoğu açık kaynakta eksik | Evet |
| `raw_health` | Evet | Evet | TC, RW, MM, yardımcı HRV citeturn15view7turn35view0turn17view2turn36view0 | mastitis doğrudan her kaynakta yok | Evet |
| `raw_feed` | Kısmi | Evet | RW ration supplement, DMI çalışmaları, NS citeturn34view0turn21view1turn10view4 | ingredient-level sürekli günlük kayıt yok | Evet |
| `raw_feed_ingredient` | Evet | Evet | NA, FP citeturn10view3turn11view1 | Türkiye’ye özgü bazı yemler | Kısmi |
| `raw_sensor` | Evet | Evet | RW, AG, MM, yardımcı HRV citeturn34view0turn15view4turn17view2turn36view0 | water intake tümünde yok | Evet |
| `raw_environment` | Evet | Evet | ENV, MM citeturn32view0turn32view1turn32view2turn17view2 | ahır içi mikroklima genelde eksik | Kısmi |
| `raw_economic_parameter` | Evet | Evet | ECO + maliyet literatürü citeturn13view0turn13view1turn14view4turn14view2turn37view2turn27search3 | treatment cost ülkeye özel eksik | Evet |
| `norm_cow_profile` | Evet | Evet | TC, CZ, MM, yardımcı HRV citeturn15view7turn16view5turn17view2turn36view0 | BCS ve BW tamlığı değişken | Kısmi |
| `norm_lactation_daily` | Kısmi | Evet | TC, CZ, RW citeturn15view7turn16view5turn34view0 | gerçek günlük timeline eksik | Evet |
| `norm_milk_daily` | Kısmi | Evet | MM, bazı TC/CZ kayıtları citeturn17view2turn15view7turn16view5 | 30 günlük trend için süre yetersiz olabilir | Evet |
| `norm_health_event` | Evet | Evet | TC, RW, MM citeturn15view7turn35view0turn17view2 | event severity sık eksik | Kısmi |
| `norm_feeding_daily` | Kısmi | Evet | NS, NA, FP, DMI literatürü citeturn10view4turn10view3turn11view1turn21view1 | gerçek kg DM/day kayıtları eksik | Evet |
| `norm_sensor_daily` | Evet | Evet | RW, AG, MM, HRV citeturn34view0turn15view4turn17view2turn36view0 | standard sensor ontology gerek | Kısmi |
| `norm_environment_daily` | Evet | Evet | ENV, MM citeturn32view0turn32view1turn32view2turn17view2 | indoor sensor kalibrasyonu | Kısmi |
| `feat_cow_day_snapshot` | Kısmi | Evet | TC + MM + ENV + sensör veri birleşimi citeturn15view7turn17view2turn32view0 | tam günlük join anahtıları | Evet |
| `feat_milk_trend` | Kısmi | Evet | MM, uzun seriler eklenirse TC/CZ | 7/14/30 günlük sürekli seri | Evet |
| `feat_health_risk_label` | Evet | Evet | TC, RW; proxy olarak SCC/EC/FPR/rumination citeturn15view7turn35view0turn24search0turn26view3turn33search3turn26view2 | mastitis/ketosis doğrudan her kaynakta yok | Kısmi |
| `feat_feeding_need_label` | Hayır | Evet | NS, NA, DMI literatürü citeturn10view4turn10view2turn21view1 | gerçek bireysel ihtiyaç etiketi | Evet |
| `feat_model_input_a` | Hayır | Evet | Çok-kaynaklı join citeturn15view7turn17view2turn32view0turn10view4 | tam senkron örnekler | Evet |
| `feat_prediction_a` | Hayır | Hayır | Model çıktısı | Tamamı model çıktısı | Evet |
| `opt_feed_ingredient` | Evet | Evet | NA, FP citeturn10view3turn11view1 | yerel kanonik isimleme | Kısmi |
| `opt_feed_nutrient_value` | Evet | Evet | NA, FP citeturn10view3turn11view1 | mikromineral/vitamin tamlığı değişebilir | Kısmi |
| `opt_feed_price` | Evet | Evet | ECO citeturn13view1turn28view3turn14view2turn28view2 | DM bazında standart fiyat | Evet |
| `opt_milk_price` | Evet | Evet | USK, USDA, EU citeturn14view4turn31search0turn13view3 | ülkeye özgü kalite primi sözleşmeleri | Kısmi |
| `opt_ration_constraint` | Hayır | Evet | NS, NA citeturn10view4turn10view2 | işletme özgü güvenlik sınırları | Evet |
| `opt_ration_scenario` | Hayır | Evet | NS + ECO + işletme kuralları | Tamamı senaryo kurgusu | Evet |
| `opt_ration_candidate` | Hayır | Hayır | Optimizer çıktısı | Tamamı algoritmik | Evet |
| `opt_ration_candidate_item` | Hayır | Hayır | Optimizer çıktısı | Tamamı algoritmik | Evet |
| `opt_ration_score` | Hayır | Hayır | Optimizer ve reward | Tamamı algoritmik | Evet |
| `sim_state` | Kısmi | Evet | TC, MM, AG, ENV, ECO birleşimi citeturn15view7turn17view2turn15view4turn32view0turn13view0 | tam state kapsamı | Evet |
| `sim_action` | Hayır | Evet | Ration policy design | tarihsel action log yok | Evet |
| `sim_transition` | Hayır | Evet | Çok-kaynaklı sentetik geçişler | gerçek state-action-next_state yok | Evet |
| `sim_policy_output` | Hayır | Hayır | RL/MDP çıktısı | Tamamı algoritmik | Evet |

Bu matrisin pratik anlamı şudur: `raw_*` ve `norm_*` katmanlarının büyük kısmı gerçek veriyle doldurulabilir; `feat_*` katmanları ağırlıkla türetme ister; `opt_*` katmanı referans besin/fiyat verileri + optimizer üretir; `sim_*` katmanı ise neredeyse kaçınılmaz biçimde sentetik veya yarı-sentetik olacaktır. Bu, projenin veri mühendisliği karmaşıklığının model karmaşıklığından daha önemli olduğunu gösteriyor. fileciteturn0file1L677-L739 fileciteturn0file1L847-L893 fileciteturn0file1L934-L1012

## Veri mimarisi ve sentetik strateji

Bu proje için tek bir kusursuz dataset aramak mantıklı değil; hibrit veri havuzu kurmak çok daha mantıklı. Bunun üç nedeni var. Birincisi, sağlık olayı ve biyobelirteç veri setleri ile yem/rasyon referansları farklı dünyalardan geliyor. Örneğin transition-cow veri seti CK ve DA gibi olayları iyi taşırken yem bileşen kompozisyonu vermez; NASEM ve Feedipedia ise yem kompozisyonunda güçlüdür ama cow-day klinik olay vermez. İkincisi, sensör veri setleri genelde kısa süreli ve az hayvanlıdır; buna karşın ekonomik ve çevresel kaynaklar geniş süreli ama hayvan-bazlı değildir. Üçüncüsü, RL/MDP için gerekli action ve transition geçmişi açık kaynakta neredeyse hiç yoktur; bu katman ancak çok veri kaynağının birleştirilmesi ve sentetik geçiş üretimiyle kurulabilir. citeturn15view7turn10view3turn11view1turn15view4turn17view2turn13view0turn32view1

**En mantıklı mimari:**  
Bronze katmanında tüm kaynakları kaynağa sadık biçimde `raw_*` tablolara al. Silver katmanında hayvan, tarih, laktasyon ve birim standardizasyonu yaparak `norm_*` tablolara dönüştür. Gold/feature katmanında `feat_cow_day_snapshot`u merkez tablo yap; bu tabloda cow_id + date anahtarıyla süt, laktasyon, sağlık, sensör, çevre ve ekonomik bağlamı tek satırda birleştir. Proje A modelleri bu snapshot üzerinden eğitilsin. Proje B ise `feat_feeding_need_label` + `opt_feed_nutrient_value` + `opt_feed_price` + `opt_milk_price` kullanarak optimizer ve simülasyon katmanını çalıştırsın. fileciteturn0file1L677-L739 fileciteturn0file1L847-L893 fileciteturn0file1L934-L1012

**Proxy label stratejisi:** Mastitis doğrudan yoksa bireysel SCC eşiği kullanılabilir; pratikte 200.000 hücre/mL üstü enfeksiyon şüphesini artırır. Milk electrical conductivity da yardımcıdır; literatürde sağlıklı ineklerde yaklaşık 4.9 mS/cm altı, subclinical aralıkta 4.9–5.15 ve clinical mastitiste 5.15 üstü eşikler raporlanmıştır; ancak eşiklerin çalışma bazlı değiştiğini özellikle not etmek gerekir. Ketosis için milk fat/protein ratio en kuvvetli proxy’lerden biridir; açık literatürde >1.38–1.5 aralığı riskli kabul edilir, bazı çalışmalarda >1.42 kesimi yüksek duyarlılık sağlamıştır. Acidosis için FPR’nin düşük olması, özellikle 1.1 altı veya “fat depression” ile birlikte yorumlanmalıdır; bu tek başına tanı değil, risk bayrağıdır. Rumination düşüşü de erken hastalık uyarısı için güçlü yardımcı değişkendir. citeturn24search0turn26view3turn33search3turn33search7turn33search17turn26view2

**Sentetik veri gerekecek tablolar:** zorunlu sentetik alanlar başta `feat_feeding_need_label`, `feat_model_input_a` içindeki eksik DMI/BCS/BW boşlukları, `opt_ration_scenario`, `opt_ration_candidate`, `opt_ration_candidate_item`, `opt_ration_score`, `sim_state`, `sim_action`, `sim_transition` ve `sim_policy_output`tur. Bunların içinde özellikle `sim_action` ve `sim_transition` için gerçek açık veri bulunmaması beklenir. Bunun yerine mevcut cow-day snapshot’lardan panel veri kurulup “action” sütunu kontrollü biçimde sentetik yazılmalıdır: örneğin konsantre +0.5 kg DM/gün, NDF +1 puan, starch -2 puan, ration_type = transition-to-fresh gibi. Sonraki gün/hafta `next_state`, geçmiş ilişkiler ve biyolojik kısıtlarla üretilmelidir. fileciteturn0file1L934-L1012 citeturn10view4turn10view2turn21view1

**Biyolojik gerçekçilik sınırları:** DMI sentetikleştirilirken NASEM/NS Dairy Cattle requirement engine’den çıkan sınırlar aşılmamalı; ayrıca literatürde mid-late lactation için bildirilen örnek DMI dağılımları referans alınmalı. THI etkisinde sıcaklık stresi, klasik 72 eşiğinin ötesinde yeni çalışmalarda 65–70 bandında bile yüksek verimli ineklerde başlayabildiği için, modelde sert tek eşik yerine yumuşak risk fonksiyonu kullanmak daha doğrudur. SCC, FPR, rumination ve milk drop sinyalleri birlikte kullanıldığında proxy label kalitesi belirgin biçimde artar. Rasyon optimizasyonunda ise CP, NDF, starch, mineral ve enerji alt/üst sınırları hard constraint olmalı; maliyet, süt geliri ve sağlık cezası ise objective function tarafında yer almalıdır. citeturn21view1turn25search0turn25search3turn25search11turn24search0turn33search17turn10view4turn10view2

**Reward önerisi:** `reward = milk_revenue - feed_cost - health_penalty - ration_change_penalty`. Milk revenue Türkiye için USK baz fiyatı ve yağ/protein dizyem farklarıyla, ABD için USDA component prices ile, AB için raw-milk portalıyla hesaplanabilir. Feed cost Türkiye’de TÜRİB arpa/mısır proxy’leri ve yerel katsayılarla; ABD’de USDA feedstuff raporlarıyla; AB’de cereal/oilseed serileriyle kurulabilir. Sağlık penaltesi için literatürde subclinical ketosis maliyetinin çok geniş aralıkta değiştiği, tipik bir modelde yaklaşık €130/vaka/yıl düzeyinde hesaplandığı ve lameness’in yıllık inek başına yüzlerce avro seviyesine çıkabildiği gösterildiğinden, bunları sabit sayı yerine dağılım/region-based parametre olarak tutmak daha sağlamdır. citeturn14view4turn31search0turn13view3turn14view2turn13view1turn37view2turn27search3

## Yol haritası ve sınırlamalar

**Faz 1: hızlı PoC için minimum veri kaynakları**  
MM + ENV + ECO + NA/NS kombinasyonuyla başla. Yani MmCows’tan günlük süt, THI, core body temperature ve davranış; NASA POWER’dan dış çevre; USK/TÜRİB veya USDA/EU’dan fiyat; NASEM/NS’den ration reference. Bu setle `feat_cow_day_snapshot`, `feat_feeding_need_label`, `opt_feed_price`, `opt_milk_price` ve basit bir ration scorer kurulur. Amaç burada yüksek doğruluk değil, uçtan uca veri akışı ve schema’nın doğrulanmasıdır. citeturn17view2turn32view0turn14view4turn14view2turn10view2turn10view4

**Faz 2: Proje A tahmin modeli için veri genişletme**  
Transition-cow ve Czech kaynaklarını ekle; bunlarla parity, breed, calving/reproduction ve health-risk sinyalleri güçlenir. PLOS RumiWatch supplement de erken hastalık sinyallerini kuvvetlendirir. Bu fazın hedefi, `lactation_stage`, `DIM`, `estimated_dmi_kg`, `health_risk_score` ve `milk-risk` çıktılarında daha sağlam feature space üretmektir. citeturn15view7turn16view5turn34view0

**Faz 3: Proje B rasyon optimizasyonu için yem/besin/fiyat verisi**  
NASEM/NCBI ve Feedipedia’dan canonical ingredient table oluştur; NS Dairy Cattle ile ihtiyaç hesaplat; ardından USDA/EU/Türkiye fiyat katmanını ekle. Bu faz sonunda `opt_feed_ingredient`, `opt_feed_nutrient_value`, `opt_feed_price`, `opt_milk_price`, `opt_ration_constraint` ve `opt_ration_score` çalışıyor olmalı. Aksi halde optimizer biyolojik değil, sadece maliyet odaklı yanlış öneriler üretir. citeturn10view3turn11view1turn10view4turn13view1turn13view3turn14view4turn14view2

**Faz 4: MDP/RL simülasyon için state-action-transition-reward yapısı**  
Gerçek açık veride action log olmadığı için burada yarı-sentetik panel yaklaşımı gerekir. `state`, cow-day snapshot’tan; `action`, kontrollü ration perturbation generator’dan; `next_state`, geçmiş veri ilişkileri + requirement constraints + health proxy modellerinden; `reward`, milk-feed-health-cost bileşiminden üretilmeli. İlk sürümde offline contextual bandit veya one-step transition modeli daha akıllıdır; tam RL’ye daha sonra geçmek gerekir. fileciteturn0file1L934-L1012 citeturn10view4turn37view2

**Faz 5: LaktaSens core verisiyle entegrasyon**  
İleride gerçek saha verisi geldiğinde açık veri kaynakları bootstrap veri olarak kalmalı, ana kaynak haline gelmemeli. Entegrasyon noktası `raw_sensor`, `raw_milk`, `raw_environment`, `raw_health` ve `raw_feed` olmalı. Açık veri, eksik kolon sözlükleri, birim standardizasyonu, initial priors, proxy label kuralları ve simülasyon warm-start için kullanılmalı; gerçek LaktaSens verisi ise model re-training ve domain adaptation için temel kaynak olmalı. fileciteturn0file1L677-L739

**Nihai öneri**  
Bu proje için en iyi toplama stratejisi şu sıradır: önce resmi ve yapısal kaynaklarla reference layer kur; sonra multimodal açık veri ile Proje A’yı ayağa kaldır; ardından ekonomik ve besin kısıtlarıyla Proje B optimizer’ı kur; son olarak RL katmanını sentetik/yarı-sentetik transition’larla başlat ve gerçek saha verisi geldikçe bunları kademeli olarak değiştir. Kısacası: **tek dataset arama, hibrit veri havuzu kur; gerçek veriyi mümkün olan her yerde kullan, eksik olanı biyolojik limitler içinde sentetikleştir.** citeturn15view7turn17view2turn10view4turn10view3turn13view0turn32view0

**Açık sorular ve sınırlamalar**  
Bazı kaynakların gerçek dosya kolon listeleri, web önizlemesinde tam görünmediği için burada birkaç eşleme “yüksek olasılıklı” statüdedir; özellikle Mendeley supplement dosyalarının tam sütun sözlükleri indirilip profil çıkarılmalıdır. Kaggle üzerindeki bazı veri setlerinin provenance ve lisans bilgileri web önizlemesinde net olmadığından, bunları çekirdek veri kaynağı değil yardımcı/demo kaynağı olarak değerlendirdim. Ayrıca ekonomik parametrelerde tedavi maliyetleri ülkeye ve işletmeye ciddi biçimde değiştiği için `sim_reward_parameter` içinde tek sabit sayı yerine dağılım veya scenario-based parametre tutmak gerekir. Son olarak, `sim_action` ve `sim_transition` için açık gerçek veri bulunmaması bu katmanda sentetik/yarı-sentetik tasarımı fiilen zorunlu kılıyor. citeturn2search5turn37view2turn27search3