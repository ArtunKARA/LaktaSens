# Smart Feed Veri Uygunluk ve Tutarlilik Kontrolu

Kontrol tarihi: 2026-06-05

Kapsam: PostgreSQL `laktasens.ml_smart_feed` semasina yuklenen Proje A ve
Proje B dis veri katmani.

## Kisa Karar

Veriler POC ve arastirma katmani icin ise yarar, fakat dogrudan tam otomatik
Proje A tahmin modeli ve Proje B rasyon optimizer'i icin yeterli degil.

- Proje A icin sut, DIM, CBT ve THI omurgasi var; ancak hayvan profil alanlari,
  sut bilesenleri, yem/DMI, rumination/lying/water ve hizalanmis klinik risk
  etiketleri eksik.
- Proje B icin yem referanslari ve ekonomik fiyat serileri var; ancak enerji
  degeri, rasyon kisitlari, senaryo/reward parametreleri ve fiyat-besin ortusmesi
  yetersiz.
- `norm_*`, `feat_*`, `sim_*` ve rasyon aday tablolari bos. Bu yukleme ham ve
  referans katmanini kuruyor; egitim/simulasyon dataset'i henuz uretilmemis.

## Kontrol Maddeleri ve Sonuclar

### Genel Yukleme

| Madde | Sonuc |
|---|---|
| `ml_smart_feed` semasi var mi? | Var |
| Meta kaynak sayisi | 14 |
| Ham tablo dolulugu | `raw_cow=17`, `raw_milk=240`, `raw_lactation=240`, `raw_health=3503`, `raw_sensor=198055`, `raw_environment=138987`, `raw_feed_ingredient=1129`, `raw_economic_parameter=6960` |
| Normalize/feature katmani | `norm_*` ve `feat_*` tablolari bos |
| Simulasyon/aksiyon katmani | `sim_*` tablolari bos |
| Rasyon optimizasyon ciktisi | `opt_ration_*` tablolari bos |

### Proje A - Cow-Day State Uygunlugu

| Madde | Sonuc | Degerlendirme |
|---|---:|---|
| Sut verisi | 16 inek, 240 kayit, her inek 15 gun | POC icin yeterli, model egitimi icin kucuk |
| Sut tarih araligi | 2023-07-21 - 2023-08-04 | Kisa pencere |
| Sut verimi araligi | 29.08 - 57.61 kg/gun, ort. 45.26 | Negatif veya >100 kg outlier yok |
| DIM verisi | 240/240 dolu | Kullanilabilir |
| DIM outlier | 75 kayit >500 DIM | C03, C04, C12, C14, C16 icin kontrol gerekli |
| Hayvan profil alanlari | parity, BW, BCS, pregnancy, breed bos | Laktasyon stage ve risk modeli icin ciddi eksik |
| Sut bilesenleri | fat, protein, SCC, conductivity bos | Mastitis/asidosis/fat-protein riskleri icin yetersiz |
| Yem/DMI/rasyon | `raw_feed=0` | Besleme ihtiyaci etiketi dogrudan uretilemez |
| CBT sensor | 10 inek, 197920 kayit | Ana sensor omurgasi olarak faydali |
| CBT outlier | 7 dusuk deger, C09 2023-07-25 12:20-12:26 | Temizleme gerekli |
| Aktivite sensor | 1 inek, 135 kayit probe | Genel model icin yetersiz |
| Rumination/lying/water | 0 dolu | Beklenen state alanlari eksik |
| Cevre/THI | 138987 kayit; tum sut tarihlerinde MmCows THI var | State icin faydali |
| NASA cevre proxy | 2025-2026 Ankara gunluk seri | MmCows tarihleriyle hizali degil; senaryo/proxy olarak kullanilmali |
| Milk-CBT gun ortusmesi | 240 sut-gunun 149'u, %62.08 | Kismi ortusme; C11-C16 CBT yok |
| Duplicate raw milk | 0 | Gecti |
| Duplicate CBT timestamp | 0 | Gecti |
| Duplicate environment key | 0 | Gecti |
| Health kayitlari | 3503 kayit, 16 inek | Ham olay gecmisi var |
| Klinik tanilar | Ketosis 38, Clinical Mastitis 25, Metritis 14, DA 9 vb. | Risk sozlugu icin faydali |
| Milk penceresinde klinik tani | ±14 gunde `medical_diagnosis=0` | Denetimli risk label'i icin dogrudan yeterli degil |

### Proje B - Rasyon ve Ekonomi Uygunlugu

| Madde | Sonuc | Degerlendirme |
|---|---:|---|
| Yem/hammadde sayisi | 1129 kayit, 846 farkli feed name | Geniş referans tabani |
| Kategori dagilimi | forage 953, concentrate 49, mineral 61, other 66 | Forage agirlikli |
| Kuru madde dolulugu | 972/1129 | Iyi ama 517 kayitta DM=0 outlier var |
| CP dolulugu | 950/1129 | Iyi; 1 kayitta CP >100 outlier |
| NDF dolulugu | 931/1129 | Iyi |
| Starch dolulugu | 170/1129 | Dusuk |
| Enerji NEL dolulugu | 0/1129 | Rasyon optimizer icin kritik eksik |
| Fiyatli yem sayisi | 3 hammadde | Sadece arpa, misir, bugday |
| Yem fiyat tarih araligi | 2019-07-26 - 2026-05-18 | Guncel; son veri 18 gun once |
| Sut fiyati | 43 kayit, 2011-01-01 - 2026-05-01 | Guncel; son veri 35 gun once |
| Para birimi | TRY fiyatlar var; EU raw ekonomik tabloda EUR da var | Opt katmaninda TRY agirlikli |
| Fiyat-besin ortusmesi | 3/3 fiyatli yemde besin kaydi var | Gecti, ama sadece 3 yem |
| Besin var fiyat yok | 1126 yem | Maliyet optimizasyonu icin fiyat atama/proxy gerekli |
| Rasyon kısıtlari | 0 | Besin gereksinimi motoru henuz yok |
| Reward parametreleri | 0 | RL/simulasyon reward katmani henuz yok |

## Uygunluk Karari

### Proje A

Uygun oldugu isler:

- Kisa pencereli cow-day POC state kurma.
- Sut verimi + DIM + CBT + THI ile basit feature engineering.
- Klinik olay sozlugu ve kural tabanli risk siniflari icin ham referans.

Yetersiz oldugu isler:

- Guclu supervised saglik/metabolik risk modeli.
- Mastitis/asidosis gibi sut bileseni veya SCC isteyen modeller.
- Besleme ihtiyaci / DMI tahmini.
- Rumination, lying time, water intake tabanli davranis modeli.

### Proje B

Uygun oldugu isler:

- Yem/hammadde ve fiyat referans katmani kurma.
- Arpa/misir/bugday maliyet senaryolari.
- Sut geliri ve yem maliyeti reward taslagi.

Yetersiz oldugu isler:

- Tam rasyon formulasyonu.
- NEL/enerji kisitli optimizasyon.
- Geniş yem sepetiyle maliyet minimizasyonu.
- RL/MDP action-reward-transition uretimi.

## Yapilmasi Gerekenler

1. Proje A icin `norm_milk_daily`, `norm_sensor_daily`, `norm_environment_daily`
   ve `feat_cow_day_snapshot` uretim SQL'i yazilmali.
2. `raw_health` icindeki operasyonel olaylar ile klinik tanilar ayrilmali;
   `medical_diagnosis` subtype'lari `map_health_event_type` tablosuna
   standartlanmali.
3. Milk penceresinde klinik tani olmadigi icin health-risk label dogrudan
   supervised label degil, kural/proxy label olarak uretilmeli.
4. DIM >500 kayitlar icin stage kurali belirlenmeli veya bu inekler ilk model
   datasindan filtrelenmeli.
5. CBT aykiri degerleri temizlenmeli veya winsorize edilmeli.
6. C11-C16 icin CBT eksikligi model input'unda null/proxy stratejisiyle
   cozulmeli.
7. Proje B icin NEL/ME enerji degeri kaynagi eklenmeli veya NASEM/NS Dairy
   gereksinim tablolarindan turetilmeli.
8. `opt_ration_constraint`, `opt_ration_scenario` ve `sim_reward_parameter`
   seed SQL'leri eklenmeli.
9. Fiyati olmayan 1126 yem icin fiyat proxy, kategori ortalamasi veya secilecek
   yem sepeti stratejisi belirlenmeli.
10. Sadece fiyatli ve besinli yemlerden ilk minimal optimizer sepeti kurulacaksa
    bu sepet arpa/misir/bugday ile sinirli oldugu acikca belirtilmeli.

