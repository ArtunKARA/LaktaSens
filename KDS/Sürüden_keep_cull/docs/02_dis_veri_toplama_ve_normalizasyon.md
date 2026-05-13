# 02 - Dış Veri Toplama ve Normalizasyon

## Faz Amacı

Bu fazın amacı model eğitmek değildir. Amaç, süt sığırcılığı işletmelerinde inek bazlı `elde tut / sürüden çıkar` karar prototipi için dış veri kaynaklarını kataloglamak, indirilebilir dosyaları güvenli biçimde yerleştirmek, gerçek dosya şemalarını incelemek ve `suru_karar` şemasındaki raw/event/feature tablolarına gidecek eşleme iskeletini hazırlamaktır.

Tek bir mükemmel veri seti beklenmeyecek. Bunun yerine üç katmanlı hibrit veri havuzu kurulacak:

1. **Ana omurga veri:** İnek/laktasyon zaman çizelgesi, süt, üreme, sağlık ve culling olaylarını aynı hayvan ekseninde bağlamaya en yakın kaynaklar.
2. **Yardımcı sağlık/üreme/süt veri setleri:** Ana omurgadaki eksikleri tamamlayan, belirli risklerin veya geçişlerin modellenmesini destekleyen veri setleri.
3. **Ekonomik reward parametre kaynakları:** Süt geliri, cull/salvage değeri, üretim maliyeti ve replacement maliyeti için resmi veya güvenilir referans kaynakları.

## ETL Tanımı

Bu fazdaki ETL, klasik tek adımlı yükleme değildir. Ham dış verinin yapısı veri setine göre değiştiği için süreç beş kontrollü adıma ayrılır:

1. **Catalog:** Kaynak metadata'sı `config/data_sources.yaml` ve `suru_karar.meta_veri_kaynagi` içinde tutulur.
2. **Landing:** Doğrudan indirilebilen dosyalar `data/external/<source_code>/` altına alınır. Tarayıcı, kurum hesabı, API key veya manuel seçim gerektiren dosyalar `data/manual_downloads/README.md` içine yazılır.
3. **Inspection:** CSV/XLSX/ZIP dosyalarının gerçek kolonları `reports/file_inspection_report.md` içinde raporlanır.
4. **Mapping:** Gerçek kolonlardan `reports/column_mapping_template.csv` üretilir. Otomatik öneriler sadece başlangıç kabul edilir.
5. **Normalize:** Sonraki fazda onaylanmış mapping ile raw tablolar doldurulur, ardından raw kayıtlar event tablolarına dönüştürülür.

## Veri Katmanları

### Ana Omurga Adayları

- `embryo_losses_mendeley`: Calving, dry-off/culling, süt, üreme ve sağlık kayıtlarını aynı laktasyon ekseninde bağlayabildiği için birincil omurga adayıdır.
- `primiparous_social_env`: `CowID`, `CalfID`, günlük süt/iletkenlik/aktivite ve `Events` yapısı sayesinde ETL tasarımını doğrulamak için güçlü bir adaydır.

### Yardımcı Veri Kaynakları

- `marcenat_inrae`: Culling tarihi/sebebi, sağlık, fertilite ve besleme kayıtları ile culling nedeni ve state zenginleştirme sağlar.
- `scc_grazing_cows`: Süt, SCC, servis, gebelik teşhisi ve doğurma ilişkileriyle süt/üreme geçişleri için hacimli destek sağlar.
- `chiozza_lameness`: Lameness olaylarının süt ve üreme performansına etkisini destekler.
- `organic_scm`: Subclinical mastitis, SCC, süt verimi, fertilite ve culling/survivability ilişkisini destekler.
- `calving_afc_culling`: Calving difficulty, age at first calving, süt özellikleri ve culling reason ilişkisini destekler.

### Ekonomik Reward Parametreleri

- `usda_nass_milk_price`: Süt fiyatı parametresi için aday.
- `usda_ams_cull_cow`: Cull/salvage satış değeri için aday.
- `usda_ers_milk_cost`: Bakım/üretim maliyeti için aday.
- `iowa_state_heifer_cost`: Replacement/heifer raising maliyeti için aday.

Bu kaynaklardan kesin değer yazılmayacak. Birim, tarih, bölge ve kur uyarlaması manuel olarak onaylanmadan `feat_reward_parametre` içinde değerler `NULL` kalır.

## Kaynak - Raw Tablo İlişkisi

| Kaynak | Hedef raw tablolar |
|---|---|
| `embryo_losses_mendeley` | `raw_milk`, `raw_repro_loss`, `raw_health`, `raw_culling` |
| `primiparous_social_env` | `raw_milk`, `raw_repro_loss`, `raw_culling`, `raw_health` |
| `marcenat_inrae` | `raw_milk`, `raw_repro_loss`, `raw_health`, `raw_culling` |
| `scc_grazing_cows` | `raw_milk`, `raw_repro_loss`, `raw_health` |
| `chiozza_lameness` | `raw_health`, `raw_milk`, `raw_repro_loss` |
| `organic_scm` | `raw_health`, `raw_milk`, `raw_culling`, `raw_repro_loss` |
| `calving_afc_culling` | `raw_repro_loss`, `raw_milk`, `raw_culling`, `raw_health` |
| Ekonomik kaynaklar | `feat_reward_parametre` |

## Raw - Event Tablo İlişkisi

| Raw tablo | Beslediği event tabloları | Not |
|---|---|---|
| `raw_milk` | `event_sut_olcum`, `event_normalized` | Süt miktarı, SCC, iletkenlik, yağ/protein gibi ölçümler normalize edilir. |
| `raw_repro_loss` | `event_dogurma`, `event_dollenme`, `event_normalized` | Doğurma, servis/tohumlama, gebelik kaybı ve gebelik durumu türetilir. |
| `raw_health` | `event_health`, `event_normalized` | Mastitis, lameness, ketosis, metritis gibi olaylar standart sözlüğe alınır. |
| `raw_culling` | `event_suruden_cikarma`, `event_normalized` | Çıkış/culling tarihi, sebep, planlılık ve satış değeri normalize edilir. |
| `feat_reward_parametre` | `feat_transition_dataset` | Reward hesabı için state/action geçişlerine parametre sağlar. |

## Neden Önce Supervised Risk + Model-Based MDP?

Bu veri kaynakları karar logu açısından güçlü bir offline RL veri seti gibi davranmaz. Çoğu kaynak gözlemseldir, bazıları tek sürü veya belirli epidemiyolojik soru için hazırlanmıştır, aksiyonların rastgeleleştirilmiş karşı-olgusal etkisi yoktur ve `cull` aksiyonu genellikle çiftlik yönetiminin seçimi olarak kaydedilir. Bu nedenle doğrudan offline RL ile politika öğrenmek, dağılım dışı aksiyonlar ve selection bias nedeniyle kırılgan olur.

Daha savunulabilir başlangıç yaklaşımı:

1. Culling, gebelik kaybı, mastitis, lameness ve süt düşüşü için supervised risk modelleri kurmak.
2. Bu modelleri aylık inek-state geçişleri üreten model-based bir MDP/simülatöre çevirmek.
3. Reward parametrelerini resmi ekonomik kaynaklardan senaryo bazlı bağlamak.
4. Politika/value iteration veya kısıtlı offline RL denemelerini ancak bu kontrollü geçiş veri seti oluşunca başlatmak.

Bu yaklaşım RL mantığını korur, ancak veri gerçekliğine daha uygundur: önce risk ve geçiş olasılıkları öğrenilir, sonra `keep/cull` aksiyonları model-based MDP üzerinde değerlendirilir.

## Bu Fazın Çıktıları

- `config/data_sources.yaml`: Kaynak kataloğu.
- `sql/01_seed_meta_veri_kaynagi.sql`: Kaynak metadata seed'i.
- `sql/02_seed_reward_parametre_baseline.sql`: Değerleri bilinçli olarak `NULL` bırakılmış baseline reward senaryosu.
- `reports/dataset_mapping_table.md`: Kaynak-raw-event uygunluk tablosu.
- `scripts/00_check_environment.py` - `scripts/05_generate_column_mapping_template.py`: İndirme, inceleme ve mapping iskeleti.

Sonraki faz, gerçek indirilen dosya şemaları onaylandıktan sonra raw tablo yükleyicilerini yazmak ve event normalizasyon kurallarını kodlamaktır.
