# Proje A Süt, Sağlık ve Besleme Risk Tahmini

## Modelleme, Doğrulama ve Deney Sonuç Raporu

**Rapor tarihi:** 7 Haziran 2026  
**Hedef değişken:** `energy_deficit_high`  
**Model birimi:** İnek-gün (`cow-day`)  
**Ana seçim metriği:** PR-AUC  
**Seçilen model:** Linear Discriminant Analysis (`linear_discriminant_analysis`)

> **Dataset notu:** Bu rapordaki sayısal deney sonuçları, longitudinal sentetik
> kohortun `v2_normalized` pipeline ile yeniden üretilmesinden **önce**
> koşulmuştur. Kohort artık tam `norm_* → feat_*` zincirini doldurmakta ve
> klinik olay etiketleri ileri 7/14 günlük pencere ile üretilmektedir.
> Güncel kohort üzerinde eğitim yeniden çalıştırıldığında metrikler
> güncellenmelidir.

---

## 1. Yönetici Özeti

Bu çalışmada Proje A için süt, sağlık, davranış, çevre ve besleme
özelliklerinden yüksek enerji açığı riskini tahmin eden modelleme altyapısı
kurulmuş ve kapsamlı biçimde doğrulanmıştır.

Çalışmanın sonunda:

- Model seçim metriği sınıf dengesizliğine uygun olan **PR-AUC** olarak
  belirlenmiştir.
- Aynı ineğin kayıtlarının eğitim ve doğrulama tarafına karışmasını engelleyen
  **inek bazlı 5-fold cross-validation** uygulanmıştır.
- Toplam 19 sınıflandırma modeli karşılaştırılmıştır.
- En iyi dört model ayrıca **5 tekrar × 5 fold = 25 fold** üzerinde yeniden
  değerlendirilmiştir.
- Seçilen modelin olasılık çıktıları, geliştirme verisinin out-of-fold
  tahminleri kullanılarak **sigmoid calibration** ile kalibre edilmiştir.
- SCC dahil/hariç ablation ve sensör, süt, besleme özellik grubu deneyleri
  gerçekleştirilmiştir.

Ana 5-fold PR-AUC sıralamasında LDA birinci olmuştur:

| Metrik | Sonuç |
|---|---:|
| CV PR-AUC | 0,7418 ± 0,0280 |
| Test PR-AUC | 0,7048 |
| Test F1 | 0,6077 |
| Test Recall | 0,6548 |
| Test Precision | 0,5670 |
| Kalibrasyon sonrası Test Brier Score | 0,0274 |
| Kalibrasyon sonrası Test ECE | 0,0077 |

Tekrarlı CV sonucunda Torch ResNet ortalama PR-AUC değerinde LDA'nın çok az
önüne geçmiştir. Ancak aradaki fark yalnızca **0,0006** olup fold'lar arası
standart sapmanın yaklaşık **0,055** olduğu dikkate alındığında anlamlı
değildir. LDA çok daha hızlı eğitildiği ve daha iyi kalibre edilmiş olasılıklar
ürettiği için mevcut koşullarda daha pragmatik modeldir.

> **Kritik sınırlama:** Datasetin tamamı sentetik/proxy sağlık etiketi
> içermektedir. Bu rapordaki metrikler gerçek çiftlik performansı olarak
> yorumlanamaz. Sonuçlar model altyapısını, deney tasarımını ve veri
> pipeline'ını doğrulamaktadır.

---

## 2. Çalışmanın Amacı

Çalışmanın temel amacı, bir ineğin günlük süt üretimi, süt bileşenleri,
davranış/sensör verileri, çevre koşulları ve besleme göstergelerinden
yararlanarak yüksek enerji açığı riskini sınıflandırmaktır.

Model çıktısının karar destek sisteminde şu amaçlarla kullanılması
hedeflenmektedir:

- Riskli inekleri erken belirlemek,
- Veteriner veya besleme uzmanı incelemesine yönlendirmek,
- Rasyon optimizasyon modülüne risk sinyali sağlamak,
- Modelin yalnızca sınıf üretmesini değil, anlamlı risk olasılığı vermesini
  sağlamak.

---

## 3. Dataset Özeti

| Veri kaynağı | İnek | İnek-gün satırı | Açıklama |
|---|---:|---:|---|
| `mmcows_observed_with_proxy` | 16 | 240 | Kısmi gerçek süt/sensör gözlemleri, proxy sağlık etiketleri |
| `synthetic_longitudinal_v1` | 120 | 21.600 | Longitudinal sentetik geliştirme kohortu (`v2_normalized`) |

Longitudinal kohort `KDS/Smart_Feed/sql/06_generate_synthetic_project_a_longitudinal.sql`
ile üretilir. Güncel sürüm önce normalize katmanı (`norm_lactation_daily`,
`norm_milk_daily`, `norm_feeding_daily`, `norm_sensor_daily`,
`norm_environment_daily`, `norm_health_event`) doldurur; ardından
`feat_cow_day_snapshot`, `feat_milk_trend`, `feat_health_risk_label`,
`feat_feeding_need_label`, `feat_model_input_a` ve `feat_prediction_a`
tablolarını türetir.

| **Toplam** | **136** | **21.840** | Modelleme datasetinin tamamı |

Hedef dağılımı:

| Sınıf | Satır | Oran |
|---|---:|---:|
| Risksiz (`0`) | 20.852 | %95,48 |
| Yüksek risk (`1`) | 988 | %4,52 |

Pozitif sınıfın yaklaşık %4,5 olması nedeniyle accuracy tek başına anlamlı bir
başarı ölçütü değildir. Bütün satırları risksiz tahmin eden bir model bile
yaklaşık %95,5 accuracy elde edebilir. Bu nedenle model seçiminde PR-AUC
kullanılmıştır.

### Kullanılan Özellik Aileleri

- **Süt özellikleri:** günlük süt verimi, süt yağı, süt proteini,
  yağ/protein oranı, SCC, elektriksel iletkenlik.
- **Sensör ve davranış özellikleri:** rumination, aktivite, yatma süresi,
  vücut sıcaklığı, su tüketimi, hareket mesafesi, ivme, basınç ve yükseklik
  istatistikleri.
- **Besleme özellikleri:** kuru madde oranı, tahmini DMI, kaba/kesif yem
  oranı, son yedi günlük yem değişimi ve rasyon tipi.
- **Temel hayvan özellikleri:** parite, canlı ağırlık, BCS, DIM, gebelik ve
  laktasyon evresi.

Datasetin ayrıntılı denetimi:
`project_a_training_dataset_audit_20260607.md`

---

## 4. Doğrulama Tasarımı

### 4.1 Train, Validation ve Test Ayrımı

| Bölüm | Satır | Pozitif | Açıklama |
|---|---:|---:|---|
| Train | 12.000 | 542 | İlk eğitim bölümü |
| Validation | 4.380 | 194 | Geliştirme havuzuna dahil |
| Development toplamı | 16.380 | 736 | Cross-validation ve model seçimi |
| Test | 5.460 | 252 | Model seçiminden tamamen ayrı |

Split işlemi inek bazında yapılmıştır. Aynı ineğe ait farklı günlerin train,
validation veya test bölümlerine dağılması engellenmiştir.

### 4.2 5-Fold Cow-Group Cross-Validation

Ana model karşılaştırması development verisindeki 102 inek üzerinde
`StratifiedGroupKFold` ile yapılmıştır.

Bu tasarım:

- Aynı ineğin fold train ve fold validation tarafına karışmasını önler.
- Pozitif sınıf oranını fold'lar arasında mümkün olduğunca dengeler.
- Satır bazlı rastgele bölmenin oluşturacağı iyimser ve hatalı metrikleri
  azaltır.

### 4.3 Tekrarlı Cross-Validation

Ana PR-AUC sıralamasındaki ilk dört model, beş farklı random seed ile beşer
fold üzerinde tekrar değerlendirilmiştir.

Her model için:

- 5 tekrar,
- Her tekrarda 5 fold,
- Toplam 25 bağımsız validation sonucu

üretilmiştir.

Bu deney tek bir fold dağılımının model sıralamasını tesadüfen değiştirip
değiştirmediğini ölçmektedir.

---

## 5. Kullanılan Metrikler

| Metrik | Açıklama |
|---|---|
| PR-AUC | Dengesiz sınıflarda pozitif risk sınıfını ayırma başarısı. Ana seçim metriğidir. |
| ROC-AUC | Pozitif ve negatif sıralama başarısı. Dengesiz veride yüksek görünebilir. |
| Precision | Üretilen risk alarmlarının ne kadarının gerçekten pozitif olduğu. |
| Recall | Gerçek pozitif risklerin ne kadarının yakalandığı. |
| F1 | Precision ve recall'un harmonik ortalaması. |
| Brier Score | Tahmin olasılığı ile gerçek sonuç arasındaki karesel hata. Düşük olması iyidir. |
| Log-loss | Yanlış ve aşırı güvenli olasılık tahminlerini cezalandırır. Düşük olması iyidir. |
| ECE | Tahmin edilen olasılık ile gözlenen olay oranı arasındaki kalibrasyon farkı. Düşük olması iyidir. |

---

## 6. Ana Model Karşılaştırması

5-fold CV PR-AUC sonuçlarına göre ilk dört model:

| Sıra | Model | CV PR-AUC Ort. | CV PR-AUC Std. | CV F1 Ort. | CV Eğitim Süresi |
|---:|---|---:|---:|---:|---:|
| 1 | Linear Discriminant Analysis | 0,741820 | 0,028010 | 0,676323 | 0,84 sn |
| 2 | Torch ResNet | 0,741574 | 0,030712 | 0,684100 | 137,82 sn |
| 3 | Torch MLP | 0,737425 | 0,029875 | 0,672541 | 97,98 sn |
| 4 | AdaBoost | 0,721549 | 0,039251 | 0,677083 | 170,91 sn |

### Yorum

- LDA ve Torch ResNet ana CV sonucunda neredeyse aynıdır. PR-AUC farkı
  yalnızca **0,000246** düzeyindedir.
- Torch ResNet'in CV F1 değeri biraz daha yüksektir; ancak ana hedef modelin
  pozitif sınıf sıralama başarısını ölçmek olduğu için seçim PR-AUC ile
  yapılmıştır.
- LDA'nın eğitim süresi Torch ResNet'ten yaklaşık 160 kat daha kısadır.
- Karmaşık modelin belirgin bir kazanım sağlamaması, mevcut sentetik tabular
  veride doğrusal ayrımın güçlü olduğunu göstermektedir.

### Model Metrik Bar Grafiği Açıklaması

Notebook'taki model metrik bar grafiği PR-AUC, ROC-AUC, F1, precision ve recall
değerlerini bütün modeller için birlikte gösterir.

Grafikten çıkarılan temel sonuç:

- Birçok model yaklaşık 0,98 ROC-AUC elde etmektedir.
- Buna karşın PR-AUC değerleri modeller arasında daha fazla ayrışmaktadır.
- Bu durum, dengesiz datasetlerde ROC-AUC'nin tek başına kullanılması halinde
  model başarısının olduğundan iyi algılanabileceğini göstermektedir.

---

## 7. Seçilen Modelin Test Sonuçları

Seçilen LDA modeli, model seçiminde hiç kullanılmamış 5.460 test satırı
üzerinde değerlendirilmiştir.

| Metrik | Test Sonucu |
|---|---:|
| PR-AUC | 0,704750 |
| ROC-AUC | 0,979639 |
| F1 | 0,607735 |
| Precision | 0,567010 |
| Recall | 0,654762 |
| Accuracy | 0,960989 |
| Ham Brier Score | 0,036980 |
| Ham ECE | 0,035818 |

CV PR-AUC değeri 0,7418 iken test PR-AUC değeri 0,7048 olmuştur. Yaklaşık
0,037 puanlık düşüş, yeni ineklerde beklenen genelleme kaybını göstermektedir.
Fark dikkat çekicidir ancak aşırı bir train/test çöküşü değildir.

### 7.1 ROC ve Precision-Recall Eğrileri

ROC eğrisi yaklaşık 0,98 AUC göstermektedir. Model negatif ve pozitif
örnekleri genel olarak doğru sıralamaktadır. Ancak pozitif sınıf az olduğu
için ROC-AUC operasyonel performansı olduğundan güçlü gösterebilir.

Precision-recall eğrisi yaklaşık 0,70 average precision göstermektedir.
Recall artırıldıkça precision değerinin düşmesi, daha fazla riskli ineği
yakalamak için daha fazla yanlış alarm kabul edilmesi gerektiğini gösterir.

### 7.2 Confusion Matrix Açıklaması

| Gerçek / Tahmin | Risksiz | Riskli |
|---|---:|---:|
| Gerçek risksiz | 5.082 | 126 |
| Gerçek riskli | 87 | 165 |

Operasyonel karşılığı:

- 252 gerçek risk olayının **165'i yakalanmıştır**.
- 252 gerçek risk olayının **87'si kaçırılmıştır**.
- Toplam **126 yanlış alarm** üretilmiştir.
- Riskli vakaların %65,48'i yakalanmıştır.
- Riskli vakaların %34,52'si kaçırılmıştır.
- Üretilen alarmların %43,30'u yanlış alarmdır.
- Risksiz kayıtların %97,58'i doğru biçimde risksiz olarak sınıflandırılmıştır.

Model mevcut threshold ile temkinli davranmakta, düşük yanlış pozitif oranı
karşılığında pozitif vakaların yaklaşık üçte birini kaçırmaktadır. Gerçek
çiftlik uygulamasında kaçırılan riskin maliyeti yüksekse threshold yeniden
ayarlanarak recall artırılmalıdır.

---

## 8. Olasılık Kalibrasyonu

Sınıflandırma modelinin yalnızca doğru sıralama yapması yeterli değildir.
Üretilen `0,20`, `0,50` veya `0,80` risk olasılıklarının gerçek olay
oranlarıyla uyumlu olması gerekir.

Kalibrasyon modeli yalnızca development verisinin out-of-fold tahminleriyle
eğitilmiş, test verisi kalibrasyon eğitiminde kullanılmamıştır.

| Split | Olasılık | Brier | Log-loss | ECE | PR-AUC |
|---|---|---:|---:|---:|---:|
| CV OOF | Ham | 0,029081 | 0,215850 | 0,027971 | 0,738525 |
| CV OOF | Kalibre | 0,022737 | 0,089996 | 0,001186 | 0,738525 |
| Test | Ham | 0,036980 | 0,253316 | 0,035818 | 0,704750 |
| Test | Kalibre | 0,027449 | 0,104386 | 0,007737 | 0,704750 |

### Kalibrasyon Kazancı

- Test Brier Score yaklaşık **%25,8 iyileşmiştir**.
- Test ECE yaklaşık **%78,4 iyileşmiştir**.
- Test log-loss yaklaşık **%58,8 iyileşmiştir**.
- PR-AUC değişmemiştir; modelin örnek sıralaması korunmuştur.
- Karar threshold'u ham olasılıkta 0,861 iken kalibrasyon sonrası daha
  yorumlanabilir olan 0,493 seviyesine gelmiştir.

### Calibration Curve Açıklaması

Grafikteki kesikli diyagonal çizgi kusursuz kalibrasyonu temsil eder.

- Ham model yüksek risk olasılıklarında gözlenen olay oranından daha yüksek
  tahmin üretmektedir; yani fazla güvenlidir.
- Sigmoid kalibrasyon noktaları diyagonal çizgiye belirgin biçimde
  yaklaştırmıştır.
- Olasılık dağılımı kayıtların büyük kısmının düşük risk bölgesinde olduğunu,
  küçük bir grubun ise yüksek riskli olarak ayrıldığını göstermektedir.

Sonuç olarak uygulama tarafında ham model olasılığı yerine kalibre edilmiş
olasılık kullanılmalıdır.

---

## 9. SCC Ablation Deneyi

SCC özelliğinin model başarısındaki etkisini ölçmek için seçilen LDA modeli
aynı split yapısıyla SCC dahil ve SCC hariç yeniden eğitilmiştir.

| Özellik Seti | CV PR-AUC Ort. | CV PR-AUC Std. | Test PR-AUC | Test F1 | Test Brier |
|---|---:|---:|---:|---:|---:|
| Tüm özellikler | 0,741820 | 0,028010 | 0,704750 | 0,607735 | 0,036980 |
| SCC hariç | 0,610971 | 0,063885 | 0,595104 | 0,588424 | 0,040184 |

SCC kaldırıldığında:

- CV PR-AUC **0,130849** düşmüştür.
- Test PR-AUC **0,109646** düşmüştür.
- Fold'lar arası değişkenlik artmıştır.

### Yorum

SCC mevcut datasetin en baskın sinyalidir. Ancak bu sonuç gerçek çiftlikte
SCC'nin enerji açığının nedensel göstergesi olduğunu kanıtlamaz.

Longitudinal sentetik üretimde SCC ve birçok süt/sensör özelliği hâlâ ortak
`latent_risk` değişkeninden türetilmektedir; `energy_deficit_high` hedefi de bu
skordan gelir. Klinik olay etiketleri (`ketosis_*`, `mastitis_*` vb.) ise
`v2_normalized` sürümünde aynı gün eşiği yerine `norm_health_event` tablosu
üzerinden ileri 7/14 günlük pencere ile üretilmektedir. Bu ayrım sızıntıyı
kısmen azaltır; SCC ablation sonuçları yine de sentetik üretim mekanizmasına
bağlıdır. Gerçek sağlık etiketi geldiğinde SCC ablation deneyi mutlaka
tekrarlanmalıdır.

---

## 10. Özellik Grubu Karşılaştırması

Seçilen LDA modeli; tüm özellikler, yalnızca süt, yalnızca sensör ve yalnızca
besleme özellikleriyle ayrı ayrı eğitilmiştir.

| Özellik Grubu | Özellik Sayısı | CV PR-AUC Ort. | Test PR-AUC | Test F1 | Test Brier |
|---|---:|---:|---:|---:|---:|
| Yalnızca süt | 6 | 0,743276 | 0,719831 | 0,637631 | 0,034450 |
| Tüm özellikler | 30 | 0,741820 | 0,704750 | 0,607735 | 0,036980 |
| Yalnızca sensör | 13 | 0,717468 | 0,695607 | 0,631083 | 0,034120 |
| Yalnızca besleme | 5 | 0,221140 | 0,206990 | 0,300366 | 0,050576 |

### Yorum

- Süt özellikleri tek başına bütün özelliklerden az farkla daha iyi sonuç
  vermiştir.
- Sensör özellikleri tek başına güçlü ve bağımsız bir sinyal taşımaktadır.
- Tüm özelliklerin süt-only modelinden daha iyi olmaması, bazı özelliklerin
  gürültü veya gereksiz tekrar eklediğini göstermektedir.
- Besleme özellikleri bu hedef için tek başına kullanılabilir değildir.
- Besleme grubunun zayıflığı, mevcut sentetik enerji açığı hedefinin besleme
  değişkenlerinden yeterince doğrudan üretilmemesinden de kaynaklanabilir.

Bu sonuç gerçek veri geldiğinde özellik seçimi ve sensör maliyet analizi için
önemlidir. Yalnızca süt özellikleriyle çalışan daha ucuz bir baseline ve
sensör eklenmiş alternatif model birlikte değerlendirilmelidir.

---

## 11. Permutation Feature Importance

Test setinde permutation importance kullanılmıştır. Bir özellik karıştırılıp
modelin PR-AUC kaybı ölçülerek modelin o özelliğe ne kadar bağımlı olduğu
hesaplanmıştır.

Grafikte öne çıkan özellikler:

1. `scc`
2. `fat_protein_ratio`
3. `elevation_std_m`
4. `estimated_dmi_kg`
5. `milk_protein_percent`
6. `milk_fat_percent`
7. `daily_milk_yield_kg`
8. `pressure_std_pa`

### Yorum

- SCC'nin yüksek önemi ablation deneyiyle tutarlıdır.
- Süt bileşenleri ve yağ/protein oranı ana tahmin sinyalinin önemli bölümünü
  oluşturmaktadır.
- `elevation_std_m` ve `pressure_std_pa` gibi sensör türevi değişkenlerin
  yüksek görünmesi gerçek biyolojik ilişki olarak kabul edilmemelidir;
  sentetik üretim sürecinde latent riskle ilişkilidir.
- Korelasyonlu özelliklerde permutation importance bir özellik
  karıştırıldığında diğer özelliklerle kurulan ortak yapıyı da bozabilir.
  Bu nedenle değerler nedensellik değil, model bağımlılığı olarak
  yorumlanmalıdır.

---

## 12. Tekrarlı Top-4 Cow-Group CV

| Model | 25-Fold PR-AUC Ort. | PR-AUC Std. | F1 Ort. | CV Brier Ort. | Toplam CV Süresi |
|---|---:|---:|---:|---:|---:|
| Torch ResNet | 0,736551 | 0,057226 | 0,680339 | 0,047068 | 643,59 sn |
| Linear Discriminant Analysis | 0,735944 | 0,054727 | 0,679703 | 0,029159 | 3,43 sn |
| Torch MLP | 0,733916 | 0,059911 | 0,680063 | 0,048988 | 743,80 sn |
| AdaBoost | 0,724584 | 0,057486 | 0,679696 | 0,073173 | 999,26 sn |

### Boxplot Açıklaması

Repeated CV boxplot'unda dört modelin kutuları büyük ölçüde örtüşmektedir.
Bu durum modeller arasındaki ortalama farkların fold ve inek seçimine bağlı
değişkenlikten daha küçük olduğunu göstermektedir.

- Torch ResNet'in ortalama PR-AUC değeri LDA'dan yalnızca **0,000607**
  yüksektir.
- Her iki modelin standart sapması yaklaşık **0,055** düzeyindedir.
- Bu farkla Torch ResNet'in LDA'dan daha iyi olduğu söylenemez.
- LDA'nın Brier Score değeri bütün top-4 modellerden daha iyidir.
- LDA repeated CV eğitimi Torch ResNet'ten yaklaşık 188 kat daha hızlıdır.

### Model Seçim Kararı

Mevcut dataset için LDA şampiyon model olarak korunmuştur.

Gerekçeler:

- PR-AUC açısından Torch ResNet ile pratikte eşittir.
- Olasılık kalitesi daha iyidir.
- Çok daha hızlı eğitilir.
- Daha az hesaplama kaynağı gerektirir.
- Katsayı tabanlı ve açıklanabilir bir yapıya sahiptir.

---

## 13. Notebook Çıktılarının Okunması

`project_a_training_notebook.ipynb` aşağıdaki çıktıları üretmektedir:

| Notebook Çıktısı | Nasıl Yorumlanmalı |
|---|---|
| Dataset summary | Satır, inek, tarih aralığı, sentetik oranı ve hedef dağılımını doğrular. |
| Ana metrics table | Modelleri ana seçim metriği olan CV PR-AUC'a göre sıralar. Test metriği seçim için kullanılmaz. |
| Fold metrics table | Her modelin her fold'daki kararlılığını ve inek sayılarını gösterir. |
| Metric bar chart | Modellerin test PR-AUC, ROC-AUC, F1, precision ve recall dengesini gösterir. |
| ROC / PR curves | Sıralama başarısını ve recall arttıkça precision kaybını gösterir. |
| Confusion matrix | Doğru alarm, yanlış alarm ve kaçırılan risk sayılarını gösterir. |
| Calibration curve | Tahmin edilen risk olasılıklarının gerçek olay sıklığıyla uyumunu gösterir. |
| Permutation importance | Test performansının hangi değişkenlere bağımlı olduğunu gösterir. |
| SCC ablation | SCC özelliği kaldırıldığında performans kaybını gösterir. |
| Feature group study | Süt, sensör ve besleme verilerinin bağımsız katkısını gösterir. |
| Repeated CV boxplot | Model sıralamasının farklı fold ve seed'lerde kararlı olup olmadığını gösterir. |

---

## 14. Sınırlamalar ve Riskler

### 14.1 Sentetik ve Proxy Etiketler

En önemli sınırlama gerçek klinik sağlık etiketinin bulunmamasıdır.

- MmCows satırlarının risk etiketleri proxy kural ile oluşturulmuştur.
- Longitudinal kohort latent risk ile korele özellikler üretir; klinik olay
  etiketleri `norm_health_event` üzerinden ileri pencere mantığıyla
  (`synthetic_longitudinal_forward_event_v1`) işaretlenir.
- Datasetin %100'ü sentetik veya proxy etiketlidir.

Bu nedenle hiçbir metrik üretim ortamı başarısı olarak kabul edilmemelidir.

### 14.2 Ortak Sentetik Üretim Mekanizması

Longitudinal kohortta süt ve sensör özellikleri ile `energy_deficit_high`
hedefi ortak `latent_risk` değişkeninden etkilenmektedir. Bu durum modelin
yüksek başarı göstermesini kolaylaştırabilir; SCC baskınlığı bunun açık
örneğidir. `v2_normalized` sürümünde klinik olay etiketleri aynı gün
eşiğinden ayrılarak ileri pencere mantığına taşınmıştır; ancak enerji açığı
hedefi hâlâ latent skordan türetilmektedir.

### 14.3 Test Setinin İçeriği

Test seti inek bazında ayrılmış olsa da büyük ölçüde sentetik longitudinal
kohorttan oluşmaktadır. Gerçek çiftlik, farklı çiftlik ve farklı sensör
cihazlarına genelleme ölçülmemiştir.

### 14.4 Threshold Kararı

Mevcut threshold F1 optimizasyonuna göre seçilmiştir. Gerçek uygulamada
threshold şu maliyetlere göre belirlenmelidir:

- Kaçırılan sağlık vakasının maliyeti,
- Yanlış alarm inceleme maliyeti,
- Veteriner/uzman kapasitesi,
- Alarm başına yapılacak operasyon.

---

## 15. Sonuç ve Karar

Çalışma sonucunda teknik eğitim ve doğrulama pipeline'ı tamamlanmıştır.

Alınan kararlar:

1. Model seçimi için PR-AUC kullanılacaktır.
2. Champion model mevcut durumda LDA olacaktır.
3. Model olasılıkları sigmoid calibration sonrasında kullanılacaktır.
4. Brier Score, log-loss ve ECE üretim izleme metriklerine eklenecektir.
5. SCC dahil ve SCC hariç performans birlikte izlenecektir.
6. Süt-only ve sensör-only alternatifleri korunacaktır.
7. Accuracy tek başına başarı metriği olarak kullanılmayacaktır.
8. Gerçek klinik etiket olmadan model üretime alınmayacaktır.

---

## 16. Önerilen Sonraki Adımlar

### Kısa Vadeli

- Gerçek klinik ketozis, mastitis, asidoz ve enerji açığı olaylarını cow-day
  kayıtlarıyla hizalamak.
- Kalibre edilmiş LDA modelini artifact olarak kaydetmek.
- Alarm threshold'unu operasyonel maliyet matrisi ile belirlemek.
- Model raporuna bootstrap güven aralıkları eklemek.
- SCC-only, milk-only ve sensor-only baseline'larını düzenli regresyon testi
  olarak çalıştırmak.

### Orta Vadeli

- Farklı çiftlik veya dönem üzerinde external validation yapmak.
- Gerçek veriyle SCC ablation ve feature importance deneylerini tekrarlamak.
- Günlük bağımsız satırlar yerine geçmiş 7/14/30 günlük trend ve pencere
  özellikleri oluşturmak.
- Yeterli gerçek longitudinal veri oluştuğunda LSTM veya temporal Transformer
  için ayrı sequence pipeline kurmak.
- Veri ve model drift izleme mekanizması eklemek.

### Üretime Geçiş Kriterleri

Model ancak aşağıdaki şartlar sağlandığında üretim adayı olarak
değerlendirilmelidir:

- Yeterli sayıda gerçek pozitif klinik vaka,
- Farklı inek ve zaman dönemlerinde bağımsız doğrulama,
- Veteriner tarafından kabul edilmiş alarm eşiği,
- Kalibrasyon ve Brier Score'un gerçek veride doğrulanması,
- Yanlış alarm ve kaçırılan vaka maliyetlerinin tanımlanması.

---

## 17. İlgili Dosyalar

- Eğitim notebook'u:  
  `KDS/Smart_Feed/models/proje_a_sut_saglik_besleme_risk_tahmini/project_a_training_notebook.ipynb`
- Eğitim ve deney kodu:  
  `KDS/Smart_Feed/models/proje_a_sut_saglik_besleme_risk_tahmini/code/train.py`
- Grafik kodu:  
  `KDS/Smart_Feed/models/proje_a_sut_saglik_besleme_risk_tahmini/code/plots.py`
- Model araştırma notları:  
  `KDS/Smart_Feed/models/proje_a_sut_saglik_besleme_risk_tahmini/model_research_notes.md`
- Dataset audit raporu:  
  `KDS/Smart_Feed/reports/project_a_training_dataset_audit_20260607.md`
- Longitudinal sentetik üretim scripti:  
  `KDS/Smart_Feed/sql/06_generate_synthetic_project_a_longitudinal.sql`

