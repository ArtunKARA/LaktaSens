# Video Çekim Rehberi — `255172008_video.mp4` (tek parça)

Süre hedefi: ~5–8 dk. Ekran kaydı + sesli anlatım. Amaç: teslimin **senin** olduğunu ve
çalıştığını göstermek (finalde bu dosyalardan soru gelecek).

> **İlke:** Videoda YALNIZ `255172008_ArtunKARA.zip` içindeki dosyaları göster
> (rapor PDF, `kod/`, `sunum/`, `sonuclar/`). Notebook teslim edilmediği için
> notebook'u, `Model/rl` veya `scripts/` repo yapısını **gösterme**; çalıştırmayı
> paketin içindeki `kod/run_all.sh` üzerinden yap.

## Akış (önerilen)
1. **Tanıtım (30 sn).** Ad/öğrenci no; problem tek cümle: "inek bazında keep/cull kararı, amaç uzun vadeli iktisadi getiri".
2. **Neden RL? (1 dk).** Raporun **§II-B (Neden RL?)** maddeleri: ardışıklık, gecikmeli ödül, stokastiklik, "A*/DP neden değil". Ekranda `255172008_rapor.pdf`. (Genel akış için §I'deki **Şekil 1 pipeline diyagramı**nı da gösterebilirsin.)
3. **Ortam + ödül (1.5 dk).**
   - Stokastiklik kanıtı: `kod/env/rl_experiment_utils.py:161` (`rng.choice(..., p=probabilities)`) + "162 durumun %74'ünde >1 olası s'".
   - Ödül formülü: raporun LaTeX'i ile `kod/env/rl_mdp_utils.py:120` (keep) / `:76` (cull) yan yana — **birebir aynı** olduğunu göster.
4. **Çalıştır (1.5 dk).** Terminalde paket içinden:
   ```bash
   cd 255172008_ArtunKARA/kod
   bash run_all.sh smoke        # canlı: train → sweep → evaluate → plot
   ```
   `sonuclar/loglar/` ve `sunum/grafikler/` üretildiğini göster. (Tam koşu uzun; videoda smoke yeterli, asıl loglar pakette `full`.)
5. **Sonuçlar (1.5 dk).** Sunum (`sunum/255172008_sunum.pptx`, PDF de pakette) üzerinden 5 grafiği gez:
   - Grafik 1 öğrenme (y = **episode getirisi**, anlık ödül DEĞİL — bunu vurgula), Grafik 2 eval (MDP referans çizgisi), Grafik 5 baseline (ajanlar baseline'ları geçiyor).
   - Not: Raporda pipeline Şekil 1 olduğu için aynı grafikler **Şekil 2–6**'dır; sunumda "Grafik 1–5" adlandırması kullanılır (aynı PNG'ler).
6. **Savunma özeti (1 dk).** Sunumun **"Teslim-3 Savunma" slaytı**: deterministik/stokastik, on/off-policy, Markov, POMDP — her birini kendi kod satırınla bağla.
7. **Kapanış (15 sn).** "Tüm sonuçlar `run_all.sh` ile tekrar üretilebilir; ham loglar `sonuclar/loglar/` altında."

## Slayt Slayt Okuma Metni (kayıt sırasında doğrudan oku)

> Aşağıdaki metinleri her slayt ekrandayken okuyabilirsin. Doğal konuş; sayıları
> söylerken yavaşla. (Düzeltilmiş ifadeler önemli: VI'yı "geçtim" DEME, "gürültü
> içinde eşitlendim" de; y-ekseni "episode getirisi", "anlık ödül değil".)

**Slayt 1 — Başlık.**
"Merhaba, ben Artun Kara, numaram 255172008. Bu projede süt sığırcılığında her inek için aylık olarak verilen 'elde tut' ya da 'sürüden çıkar' kararını pekiştirmeli öğrenmeyle çözüyorum. Ortam empirik ve stokastik bir Markov karar süreci; ana ajanlarım tablo tabanlı Q-Learning ve derin DQN."

**Slayt 2 — Problem ve Neden RL.**
"Karar miyop değil: bugün tutulan inek gelecekte süt üretir ama hastalık ve düşük verim riski biriktirir; çıkarılan inek anlık gelir getirir ama yerine pahalı bir düve gerekir. Bu problem reinforcement learning gerektiriyor çünkü dört özelliği var: aksiyon geleceği etkiliyor yani ardışık, ödül gecikmeli, geçiş dinamiği belirsiz ve ortam stokastik. Stokastik olduğu için A-star gibi en kısa yol yöntemleri uygulanamaz; basit risk eşiği kuralını da denedim, ajanlarımın gerisinde kaldı."

**Slayt 3 — MDP Formülasyonu.**
"Durumum yedi bileşenli ayrık bir kova; toplam 162 durum var. Aksiyonum iki tane: keep ve cull. Ödülüm bir aylık net ekonomik kâr: keep için süt geliri eksi bakım, sağlık, üreme ve beklenen culling maliyetleri; cull için karkas değeri eksi düve maliyeti. En kritik nokta şu: rapordaki bu formül ile koddaki satır birebir aynı — keep yüz yirminci satırda, cull yetmiş altıncı satırda."

**Slayt 4 — Ortam Stokastik (kanıt).**
"Ortamın stokastik olduğunu kodla ispatlıyorum: keep'ten sonraki durum gerçek kayıtlardan kurulan empirik bir dağılımdan örnekleniyor — şu satır, rng nokta choice. Yüz altmış iki durumun yüzde yetmiş dördünde keep altında birden fazla olası sonraki durum var; örneğin bir durum üç ayrı duruma her biri üçte bir olasılıkla geçiyor. Cull ise deterministik terminal."

**Slayt 5 — Yöntem ve Kurulum.**
"Öğrenen ajanlarım model-free: Q-Learning ve DQN, ikisi de off-policy. Value Iteration optimum referans, dört heuristik de baseline. Her şeyi beş tohum üzerinde tekrarladım. Tüm rastgelelik default_rng ile yönetiliyor, yasaklı kalıp yok. Değerlendirme deterministik greedy, tohum başına beş yüz episode."

**Terminal demo (Çalıştır).**
"Şimdi paketin içinden tek komutla çalıştırıyorum: run_all.sh. Bu, eğitimi, hiperparametre taramasını, değerlendirmeyi ve grafikleri sırayla üretiyor; gördüğünüz gibi sonuclar ve grafikler klasörleri dolduruluyor. Videoda hızlı olması için smoke profili; pakettedeki asıl loglar full profilden."

**Slayt 6 — Sonuçlar.**
"Sonuçlar beş tohum ortalaması: Q-Learning eksi iki yüz dört, DQN eksi iki yüz yetmiş; ikisi de tüm baseline'ları açık ara geçti. Q-Learning, model tabanlı VI optimumuyla — eksi iki yüz yirmi beş — istatistiksel olarak eşitlendi; fark anlamlı değil, eşli t-testi p yaklaşık sıfır virgül otuz yedi. Yani VI'yı geçmedim, gürültü içinde ona ulaştım. Bir de dağılım sağa çarpık: ortalama eksi iki yüz dört ama medyan eksi beş yüz elli altı; çünkü ajan, keep_all'ın sol kuyruk felaket episode'larını cull ederek RL'in optimize ettiği ortalama getiriyi iyileştiriyor."

> **Grafik slaytlarında (7–11) zorunlu 4 parça:** her grafiği **Gözlem → Karşılaştırma →
> Açıklama → Sonuç** sırasıyla anlat. Aşağıdaki metinler bu sırayı açıkça takip eder.

**Slayt 7 — Grafik 1, Öğrenme Eğrisi.**
"**Gözlemim:** her iki ajanın eğitim episode getirisi tohum ortalamasında yükseliyor — Q-Learning yaklaşık eksi binden eksi dört yüz ellilere, DQN eksi bin iki yüzlerden eksi dört yüzlere. **Karşılaştırınca:** tablo ajan daha hızlı ve oturmuş bir eğri verirken DQN ilk binlerce adımda daha gürültülü. **Bunun teorik nedeni:** tablo Q-learning küçük durum uzayında doğrudan güncellemeyle hızlı yakınsar, DQN ise fonksiyon yaklaşımı ve replay buffer yüzünden başta dalgalanır. **Pratik sonuç:** y ekseni anlık ödül değil episode getirisi olduğu için öğrenme açıkça görünüyor; gölgeli std bandı da bunun tek şanslı koşu değil, beş tohumda sistematik bir kazanım olduğunu doğruluyor."

**Slayt 8 — Grafik 2, Eval Eğrisi.**
"**Gözlemim:** deterministik greedy değerlendirme getirisi eğitimle birlikte iyileşiyor ve yeşil kesik çizgiyle gösterilen VI optimum referansıyla örtüşüyor. **Karşılaştırınca:** eval eğrisi eğitim eğrisinden belirgin biçimde daha az gürültülü, çünkü değerlendirmede keşif kapalı. **Bunun teorik nedeni:** greedy koşu öğrenilen değer fonksiyonunun gerçek politika kalitesini ölçer; ortam stokastik olduğu için değerlendirme de bir dağılım, dolayısıyla eğitim eğrisi tek başına kanıt sayılmaz. **Pratik sonuç:** öğrenilen politika görülmemiş episode başlangıçlarında da tutarlı getiri üretiyor."

**Slayt 9 — Grafik 3, Loss ve Politika Isı Haritası.**
"**Gözlemim:** solda DQN'in TD kaybı logaritmik eksende hızla düşüp yakınsıyor; sağda öğrenilen politikada cull oranı risk bandı ve DIM arttıkça yükseliyor. **Karşılaştırınca:** tablo yönteminde kayıp olmadığı için orada öğrenmeyi politika ısı haritasıyla, derin yöntemde ise gerçek kayıp eğrisiyle gösteriyorum. **Bunun teorik nedeni:** kayıp düşüşü Q-hedefine kararlı yakınsama; ısı haritası deseni ise 'yüksek riskli, düşük verimli ineği ele' biçimindeki iktisaden beklenen davranış. **Pratik sonuç:** hem optimizasyon hem karar yapısı sağlıklı ve yorumlanabilir."

**Slayt 10 — Grafik 4, Hiperparametre Duyarlılığı.**
"**Gözlemim:** epsilon-alpha üçe üç ızgarasında en yüksek getiri orta keşif ve orta öğrenme oranında — epsilon sıfır virgül otuz beş, alpha sıfır virgül on sekiz. **Karşılaştırınca:** çok düşük epsilon, çok yüksek epsilon ve aşırı alpha hücrelerinin hepsi merkez hücrenin gerisinde. **Bunun teorik nedeni:** klasik keşif-sömürü dengesi — az keşif erken sömürüye sıkıştırır, çok keşif bütçeyi rastgele harcar, aşırı alpha güncellemeleri gürültüye duyarlı kılar. **Pratik sonuç:** seçtiğim varsayılanlar tam da en iyi hücreye denk geliyor, yani konfigürasyon keyfî değil veriyle gerekçeli."

**Slayt 11 — Grafik 5, Baseline Karşılaştırması.**
"**Gözlemim:** final greedy getiride eğitilmiş ajanlar — mavi — tüm baseline'ların — turuncu — üzerinde; yeşil VI optimum tavan. **Karşılaştırınca:** baseline'lar içinde cull_all en kötü, eksi bin üç yüz; random ve keep_all da düşük; ajanlarla en güçlü baseline olan risk eşiği arasında dahi açık fark var. **Bunun teorik nedeni:** ajanlar gecikmeli ödülü ve stokastik geçişleri hesaba katıyor, yalnız anlık duruma bakan miyop baseline'lardan üstün. **Pratik sonuç:** RL basit kurallara göre ölçülebilir iktisadi kazanç sağlıyor; hata çubukları bu üstünlüğün tohumlar arası tutarlı olduğunu doğruluyor."

**Slayt 12 — Teslim-3 Savunma Özeti.**
"Dört kavramsal soruyu kendi kodumla bağlıyorum. Bir: ortam stokastik, kanıt rl_experiment_utils satır yüz altmış bir. İki: Q-Learning off-policy — davranış epsilon-greedy satır üç yüz dokuz, ama hedef greedy max satır üç yüz yirmi bir; DQN de replay buffer'la off-policy. Üç: durum yaklaşık Markov; trend ve risk geçmişi özetliyor ama bucketing kaybı var. Dört: cull_risk gerçek bir etiket değil bir tahmin, o yüzden kısmi gözlemlenebilirlik var; öznitelik mühendisliğiyle hafiflettim."

**Slayt 13 — Sonuç.**
"Özetle: ardışık, gecikmeli ödüllü, stokastik bir keep/cull ortamı kurdum; model-free Q-Learning ve DQN tüm baseline'ları geçti ve model tabanlı optimuma ulaştı. Her şey beş tohumla tekrarlanabilir, ham loglardan doğrulanabilir ve tek komutla, run_all.sh ile, yeniden üretilebilir. Teşekkürler."

## Kayıt ipuçları
- Tek parça MP4 (kesme yok). OBS Studio / Xbox Game Bar (Win+G) yeterli.
- Kodu/raporu okurken fareyle satırı işaret et (özellikle ödül formülü satır no'ları).
- Yüklemeden önce: `255172008_ArtunKARA.zip` + `255172008_video.mp4` iki ayrı dosya (bulut linki teslim sayılmaz).

## Olası savunma soruları (hazırlık)
- "Ortamın stokastik olduğunu tek satır kodla göster." → `rl_experiment_utils.py:161`.
- "Q-learning neden off-policy?" → davranış ε-greedy (`rl_core.py:309`) vs hedef max_a Q (`:321`).
- "Öğrenme eğrisinin y-ekseni ne; neden episode getirisi?" → anlık ödül düz çizgi verir, 21 katlık öğrenmeyi gizler.
- "Durum vektörün Markov mı?" → yaklaşık; trend/risk geçmişi özetler, bucketing kaybı var.
