### Proje İçin Öneri Dosyası

Bu projede çözmeyi planladığım ana problem, ineğin laktasyon evresine göre mevcut durumunu anlayıp besleme ihtiyacını ve sağlık/metabolik riskini tahmin etmek, ardından bu duruma göre maliyet-verim-risk dengesini gözeten uygun yem/rasyon önerisi üretmektir.

Projeyi iki bağlı kısım olarak ele alıyorum:

- **Proje A:** İneğin durumunu anlayan, laktasyon evresini belirleyen, süt verimi ve besleme ihtiyacını tahmin eden, sağlık/metabolik risk için erken uyarı üreten tahmin sistemi.
- **Proje B:** Proje A’dan gelen ihtiyaç skoru, risk skoru, tahmini verim ve inek/grup sınıfına göre yem/rasyon optimizasyonu yapan karar destek sistemi.

Bu yüzden sistemde ilk olarak ineğin hangi laktasyon evresinde olduğu, süt veriminin nasıl ilerlediği, yem ihtiyacının artıp artmadığı ve sağlık/metabolik risk olup olmadığı anlaşılacak. Daha sonra mevcut yemler, yemlerin besin değerleri, fiyatları ve biyolojik kısıtlar dikkate alınarak en uygun rasyon önerisi oluşturulacak.

#### Hangi çevreyi kullanacaksın?

Bu proje için doğrudan canlı çiftlik verisi üzerinde karar veren bir sistem yerine, ilk fazda tarihsel veri ve dış veri setlerinden beslenen özel bir eğitim/simülasyon ortamı kullanmayı planlıyorum.

Bu ortamda `ml_smart_feed` benzeri ayrı bir schema altında ham dış veri, normalize edilmiş inek/süt/sağlık/yem kayıtları, eğitim snapshotları, ekonomik parametreler ve simülasyon çıktıları tutulacak. Böylece canlı LaktaSens operasyonel verisi bozulmadan, model eğitimi ve optimizasyon denemeleri ayrı bir katmanda yapılabilecek.

Çevrenin yapısı:

- ajan: inek veya grup bazlı besleme/rasyon karar verici
- zaman adımı: ilk fazda 1 gün veya 1 hafta
- epizod: doğumdan laktasyon sonuna, kuru döneme veya belirlenen gözlem ufkunun sonuna kadar
- veri katmanı: `core` operasyonel tablolarından ve dış veri setlerinden türetilen `ml_smart_feed` eğitim/simülasyon tabloları

Bu yapıda Proje A, çevrenin state kısmını güçlü hale getirecek; Proje B ise bu state’e göre rasyon aksiyonu üretecek.

#### PostgreSQL dış veri yükleme SQL'leri

`KDS/Smart_Feed/Data/external` altındaki hazır dış veri dosyalarını PostgreSQL'e almak için SQL'ler Proje A ve Proje B olarak ayrıldı:

- **Proje A SQL:** `KDS/Smart_Feed/sql/02_load_external_project_a.sql`
  - Hayvan kimliği, süt verimi, laktasyon/DIM bağlamı, sağlık olayları, sensör verisi ve çevre/THI verisini `raw_cow`, `raw_milk`, `raw_lactation`, `raw_health`, `raw_sensor`, `raw_environment` ve gerektiğinde `raw_external_reference` tablolarına yükler.
- **Proje B SQL:** `KDS/Smart_Feed/sql/03_load_external_project_b.sql`
  - Yem hammaddesi besin değerleri, NASEM/Voederbomen referansları, süt fiyatı, yem fiyatı ve ekonomik parametreleri `raw_feed_ingredient`, `raw_economic_parameter`, `opt_feed_ingredient`, `opt_feed_nutrient_value`, `opt_feed_price`, `opt_milk_price` ve `raw_external_reference` tablolarına yükler.

Çalıştırma sırası:

```bash
psql -d <db_name> -f KDS/Smart_Feed/sql/ml_smart_feed_create.sql
psql -d <db_name> -f KDS/Smart_Feed/sql/01_seed_meta_veri_kaynagi.sql
psql -d <db_name> -f KDS/Smart_Feed/sql/02_load_external_project_a.sql
psql -d <db_name> -f KDS/Smart_Feed/sql/03_load_external_project_b.sql
```

Not: `mmcows_multimodal` içindeki IMMU ve pressure yüksek frekans CSV'leri yaklaşık 11 GB olduğu için Proje A scriptinde varsayılan olarak yüklenmez; önce özetleme/partition kararı verildikten sonra ayrı bir high-frequency ETL ile alınmalıdır. Excel, PDF ve DOCX dosyaları da doğrudan PostgreSQL `COPY` ile okunamadığı için önce CSV'ye parse edilmelidir.

#### Sisteme girecek temel veriler

##### Giriş 1: Hayvan durumu

- CowId
- Parity
- BodyWeight
- BCS
- DIM
- PregnancyStatus

##### Giriş 2: Üretim durumu

- DailyMilkYield
- MilkFat
- MilkProtein
- FatProteinRatio
- SCC
- MilkElectricalConductivity

##### Giriş 3: Besleme durumu

- RationType
- DryMatterRatio
- EstimatedDMI
- ForageConcentrateRatio
- FeedChangeLast7Days

##### Giriş 4: Davranış / sensör verisi

- RuminationMinutes
- ActivityLevel
- LyingTime
- BodyTemperature
- WaterIntake
- THI

Bu verilerle ineğin mevcut üretim, beslenme, sağlık ve çevre durumunu temsil eden günlük veya haftalık snapshot oluşturulacak.

#### State (s), Action (a), Reward (r), Probability (P)

##### State (s)

State, ineğin o andaki laktasyon, üretim, besleme, sağlık ve çevre durumunu temsil edecek. İlk fazda aşağıdaki değişkenleri kullanmayı planlıyorum:

- laktasyon evresi
- DIM yani doğumdan beri geçen gün
- parite
- gebelik durumu
- canlı ağırlık
- BCS
- günlük süt verimi
- son 7/14/30 günlük süt trendi
- süt yağı
- süt proteini
- yağ/protein oranı
- SCC
- tahmini DMI
- mevcut rasyon tipi
- yem değişim durumu
- rumination süresi
- aktivite seviyesi
- THI
- son dönemdeki sağlık olayı sayısı
- ketozis/mastitis/asidoz risk skoru
- besleme ihtiyaç sınıfı

Burada Proje A’nın çıktıları, Proje B için state’in en önemli kısmını oluşturacak. Yani risk skoru, ihtiyaç skoru, tahmini verim ve inek/grup sınıfı rasyon optimizasyonuna giriş olacak.

##### Action (a)

Bu projede action, ineğe veya inek grubuna uygulanacak besleme/rasyon kararını temsil edecek.

İlk fazda aksiyon uzayını daha yönetilebilir olması için ayrık tanımlamayı planlıyorum:

- 0 = mevcut rasyonu koru
- 1 = enerji yoğunluğu artırılmış rasyon öner
- 2 = protein dengesi odaklı rasyon öner
- 3 = sağlık/metabolik risk azaltıcı rasyon öner
- 4 = maliyet odaklı dengeli rasyon öner
- 5 = geçiş dönemi destek rasyonu öner

İkinci fazda ise rasyon miktarları daha ayrıntılı hesaplanacak. Bu noktada aksiyon, her yem hammaddesinden kaç kg kuru madde verileceği şeklinde sürekli karar değişkenlerine dönüşebilir.

Örneğin:

- mısır silajı kg DM/gün
- yonca kg DM/gün
- kesif yem kg DM/gün
- protein kaynağı kg DM/gün
- mineral/vitamin katkısı kg DM/gün

Bu yüzden ilk fazda karar sınıflı/ayrık, optimizasyon fazında ise sürekli karar değişkenli hibrit bir yapı daha mantıklı görünüyor.

##### Reward (r)

Reward, verilen rasyon kararının ekonomik, üretimsel ve sağlık etkisini birlikte değerlendirecek.

Temel reward mantığı şöyle olacak:

- süt geliri
- yem maliyeti
- sağlık/metabolik risk cezası
- karşılanmayan besin ihtiyacı cezası
- ani rasyon değişim cezası
- kalite/verim düşüş cezası

Genel formül şu şekilde düşünülebilir:

```text
Reward = süt geliri
         - yem maliyeti
         - sağlık/metabolik risk cezası
         - besin ihtiyacı eksikliği cezası
         - ani rasyon değişim cezası
```

Buradaki amaç sadece en ucuz yemi bulmak değil, uzun vadede ineğin sağlığını bozmadan süt verimi, yem maliyeti ve risk dengesini optimize etmektir.

##### Probability (P)

Bir state’ten sonraki state’e geçiş olasılığı stokastik olacak. Çünkü aynı laktasyon evresinde ve benzer süt veriminde olan iki inek, aynı rasyona aynı tepkiyi vermeyebilir.

Örneğin:

- enerji yoğunluğu artırıldığında bazı ineklerde süt verimi artabilir
- bazı ineklerde DMI değişmeyebilir
- bazı ineklerde metabolik risk düşebilir
- bazı ineklerde sağlık riski aynı kalabilir
- sıcaklık stresi veya yem kalitesi gibi dış faktörler sonucu değiştirebilir

Bu yüzden geçiş modeli sabit/deterministik olmayacak. Dış veri ve tarihsel veriden öğrenilmiş olasılıksal geçiş modeli ile tanımlanacak.

#### Model-free mi, model-based mi? Neden?

Bu projede ilk faz için model-based ve hibrit bir yaklaşım daha doğru görünüyor.

Çünkü elimizde gerçek çiftlikte farklı rasyon aksiyonlarının uzun vadeli etkilerini gösteren yeterli canlı aksiyon logu olmayabilir. Bu durumda doğrudan model-free RL ile ajan eğitmek sağlıklı olmaz. Bunun yerine önce ineğin durumunu tahmin eden Proje A modelleri kurulacak, sonra bu çıktılarla besin gereksinimi ve rasyon optimizasyonu yapılacak.

Yani ilk yaklaşım:

- Proje A için kural tabanlı laktasyon evresi + supervised ML tahmin/sınıflandırma
- Proje B için kural tabanlı besin gereksinimi motoru + kısıtlı optimizasyon
- Simülasyon tarafında ise öğrenilmiş stokastik geçiş modeli ile model-based MDP/RL denemesi

Bu yaklaşım hem veri gerçekliğiyle daha uyumlu hem de açıklanabilir ve savunulabilir bir sistem kurmamızı sağlar.

Model-free yöntemler ise özellikle canlı ortamla etkileşim kurmadan zorlaşır. Çünkü ajan farklı rasyon kararlarını deneyip sonuçlarını göremeden öğrenmek zorunda kalır. Bu yüzden PPO, A3C veya temel DQN gibi çevreyle etkileşim isteyen yöntemler ilk faz için uygun değildir. İleride yeterli canlı veri ve aksiyon-sonuç logu oluşursa offline RL veya daha gelişmiş RL yaklaşımları değerlendirilebilir.

##### Deterministik mi, stokastik mi? Neden stokastik seçiyoruz?

Bu problem stokastik bir problemdir.

Çünkü hayvan biyolojisi, yem kalitesi, çevre şartları, sağlık durumu ve bireysel farklılıklar nedeniyle aynı rasyon her inekte aynı sonucu üretmez. Aynı DIM, aynı süt verimi ve aynı BCS değerine sahip iki inek bile sonraki hafta farklı süt verimi, farklı DMI veya farklı sağlık riski gösterebilir.

Bu nedenle sistemi deterministik kurmak problemi gereğinden fazla basitleştirir. Gerçek çiftlik koşullarında kararlar belirsizlik altında verildiği için geçişlerin olasılıksal modellenmesi daha mantıklıdır.

Stokastik yapı sayesinde sistem sadece tek bir kesin sonuç üretmez; beklenen süt verimi, beklenen risk, belirsizlik ve alternatif rasyon sonuçlarını birlikte değerlendirebilir.

##### Eylem uzayı ayrık mı sürekli mi?

Bu projede eylem uzayı iki katmanlı ele alınacak.

İlk fazda, RL/simülasyon tarafında eylem uzayı ayrık olacak. Çünkü ilk aşamada doğrudan her yem hammaddesinin miktarını RL ajanına bırakmak problemi gereğinden fazla karmaşık hale getirir.

İlk faz ayrık aksiyon örnekleri:

- mevcut rasyonu koru
- enerji destekli rasyona geç
- protein dengeli rasyona geç
- sağlık riski azaltıcı rasyon seç
- maliyet odaklı dengeli rasyon seç

Ancak Proje B’nin gerçek rasyon optimizasyon kısmında karar değişkenleri sürekli olacaktır. Çünkü her yem hammaddesinin kg DM/gün miktarı hesaplanacaktır. Bu kısım Linear Programming veya çok amaçlı optimizasyon ile çözülür.

Bu yüzden nihai yapı hibrittir:

- simülasyon/RL seviyesi: ayrık aksiyon
- rasyon formülasyonu seviyesi: sürekli miktar optimizasyonu

##### Hangi yöntemi kullanmayı planlıyorsun?

İlk fazda doğrudan tek bir RL algoritmasıyla başlamak yerine, hibrit bir karar destek sistemi kurmayı planlıyorum.

Proje A için:

- kural tabanlı laktasyon evresi belirleme
- Random Forest / Gradient Boosting / XGBoost ile süt verimi ve DMI tahmini
- Logistic Regression, Random Forest veya XGBoost ile sağlık/metabolik risk sınıflandırması
- zaman serisi özellikleri ile süt trendi, DMI değişimi ve davranış bozulumu yakalama
- SHAP veya feature importance ile açıklanabilir erken uyarı üretme

Proje B için:

- NASEM benzeri besin gereksinimi mantığına dayalı kural motoru
- Linear Programming ile least-cost baseline rasyon
- NSGA-II, MOPSO veya benzeri çok amaçlı optimizasyon ile maliyet-verim-risk dengesi
- Pareto optimal rasyon alternatifleri
- IOFC yani income over feed cost mantığıyla ekonomik değerlendirme

Simülasyon/RL fazında ise:

- state-action-transition-reward yapısı kurulacak
- stokastik geçiş modeli tarihsel/dış veriden öğrenilecek
- ilk deneme olarak model-based MDP mantığı kullanılacak
- ileride offline RL karşılaştırması yapılabilecek

##### Hangi yöntemleri araştırıp seçiminizi yaptınız?

Bu problem için PPO, A3C, DQN, DDPG, TD3, SAC gibi RL yöntemleri değerlendirilebilir. Ancak ilk fazda bunların çoğu veri gerçekliği nedeniyle doğrudan uygun değildir.

PPO ve A3C çevreyle etkileşim kurarak veri toplamaya daha uygun yöntemlerdir. Bizim ilk fazda canlı çiftlik ortamında farklı rasyon kararlarını deneyerek veri toplama şansımız olmayacağı için bu yöntemleri doğrudan kullanmak doğru olmaz.

DQN ayrık aksiyon uzayı için teorik olarak düşünülebilir. Ancak temel DQN de genellikle çevreyle etkileşim içinde öğrenmeye daha uygundur. Bizim elimizde başlangıçta sabit ve tarihsel veri olacağı için DQN ilk tercih olmayacaktır.

DDPG ve TD3 sürekli aksiyon problemleri için uygundur. Rasyon miktarları sürekli değişken gibi görünse de bu yöntemler ilk aşamada problemi gereğinden fazla karmaşık hale getirir. Ayrıca güvenli biyolojik kısıtları doğrudan garanti etmek zordur.

SAC güçlü bir off-policy yöntemdir ancak başlangıçta bu sistem için fazla karmaşık kalabilir. Sürekli aksiyon varyantları rasyon miktarı optimizasyonu için düşünülebilir ama ilk fazda açıklanabilir ve kısıtlı optimizasyon daha güvenlidir.

Bu nedenle ilk deneyeceğim yöntem şu olacaktır:

- Proje A tarafında supervised ML + kural tabanlı durum analizi
- Proje B tarafında kısıtlı optimizasyon + çok amaçlı karar destek
- simülasyon tarafında stokastik model-based MDP

Bu seçim daha mantıklı çünkü problem:

- uzun vadeli karar problemi
- belirsizlik içeriyor
- başlangıçta sabit/tarihsel veriyle ilerliyor
- hayvan sağlığı nedeniyle güvenli kısıtlar gerektiriyor
- ekonomik ve biyolojik hedefleri birlikte taşıyor
- açıklanabilir karar üretimi gerektiriyor

İleride canlı LaktaSens verisi, gerçek rasyon aksiyonları ve sonuç kayıtları biriktikçe offline RL yöntemleri, özellikle CQL veya BCQ gibi sabit veriyle politika öğrenmeye çalışan yaklaşımlar karşılaştırma deneyi olarak değerlendirilebilir.

#### Proje sonunda beklenen çıktı

Bu proje sonunda sistemin aşağıdaki çıktıları üretmesini hedefliyorum:

- laktasyon evresi
- tahmini DMI
- beklenen süt verimi
- besleme ihtiyaç sınıfı
- ketozis/mastitis/asidoz risk skoru
- erken uyarı mesajı
- önerilen rasyon alternatifi
- yem maliyeti
- beklenen süt geliri
- IOFC değeri
- maliyet-verim-risk dengesi
- kararın açıklaması

Kısaca bu proje, önce ineğin durumunu anlayan sonra da bu duruma göre yem/rasyon kararını optimize eden açıklanabilir bir akıllı karar destek sistemi olarak tasarlanacaktır.
