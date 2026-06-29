# Grafik Yorumları (4 cümlelik zorunlu model)

## Grafik 1 — Öğrenme Eğrisi
- **Gözlem:** Her iki ajanın eğitim episode getirisi seed ortalamasında yükseliyor (Q-learning son MA ≈ -254, DQN ≈ -273 USD).
- **Karşılaştırma:** Tablo ajan daha hızlı/oturmuş bir eğri verirken, DQN erken adımlarda daha gürültülü; std bandı seed varyansını gösteriyor.
- **Açıklama:** Q-learning küçük durum uzayında doğrudan tablo güncellemesiyle hızlı yakınsar; DQN fonksiyon yaklaşımı + replay nedeniyle ilk binlerce adımda dalgalanır.
- **Sonuç:** Çok-seed bandı, getirinin tek bir şanslı koşunun ürünü olmadığını; öğrenmenin sistematik olduğunu gösterir.

## Grafik 2 — Test/Eval Eğrisi
- **Gözlem:** Deterministic/greedy eval getirisi eğitimle birlikte iyileşiyor (Q-learning final ≈ -260, DQN ≈ -236 USD).
- **Karşılaştırma:** Eval eğrisi eğitim eğrisinden daha az gürültülü çünkü keşif (epsilon) kapalı; eğitim eğrisi tek başına kanıt sayılmaz.
- **Açıklama:** Greedy koşu, öğrenilen değer fonksiyonunun fiilî politika kalitesini ölçer; ortam stokastik olduğundan eval de bir dağılımdır.
- **Sonuç:** Politika, görülmemiş episode başlangıçlarında da tutarlı getiri üretiyor.

## Grafik 3 — Loss + Policy Heatmap
- **Gözlem:** DQN TD-loss başlangıçtaki ≈ 666 değerinden ≈ 112 düzeyine düşüyor; heatmap yüksek risk × ileri DIM hücrelerinde cull oranının arttığını gösteriyor.
- **Karşılaştırma:** Tablo yöntemde loss yoktur; bu yüzden öğrenilen politikayı değer/risk eksenlerinde heatmap ile veriyoruz.
- **Açıklama:** Loss düşüşü Q-hedefine yakınsamayı; heatmap deseni ise iktisadi olarak beklenen 'yüksek riskli, düşük verimli inekleri ele' davranışını yansıtır.
- **Sonuç:** Hem optimizasyon (loss) hem de karar yapısı (heatmap) sağlıklı ve yorumlanabilir.

## Grafik 4 — Hiperparametre Duyarlılığı
- **Gözlem:** En iyi hücre epsilon_start=0.35 × alpha=0.18 (≈ -172 USD); en kötü epsilon_start=0.60 × alpha=0.40 (≈ -273 USD).
- **Karşılaştırma:** En iyi getiri orta düzey keşifte (epsilon_start=0.35) ve orta düzey öğrenme oranında (alpha=0.18) toplanıyor; uç köşeler (çok düşük/çok yüksek) daha kötü.
- **Açıklama:** Klasik keşif–sömürü dengesi: çok az keşif ajanı yeterince farklı durumu görmeden erken sömürüye sıkıştırır, çok fazla keşif eğitim bütçesini rastgele aksiyonlarda harcar; benzer şekilde çok yüksek alpha TD-güncellemelerini gürültüye aşırı tepki verir hâle getirip yakınsamayı bozar.
- **Sonuç:** Seçilen varsayılanlar (epsilon_start=0.35, alpha=0.18) duyarlılık haritasının en iyi hücresine denk geliyor; bu, konfigürasyonun keyfî değil veriyle gerekçeli olduğunu gösterir.

## Grafik 5 — Baseline Karşılaştırma
- **Gözlem:** Sıralama (getiri): cull_all=-1300, random_policy=-964, keep_all=-428, risk_threshold=-385, dqn=-270, mdp_value_iteration=-225, qlearning=-204.
- **Karşılaştırma:** Eğitilmiş ajanlar random/cull_all/keep_all baselinelarını açık ara geçiyor; qlearning ile MDP value-iteration hata çubukları örtüşüyor (istatistiksel olarak eşit, tavan referans).
- **Açıklama:** Ajanlar gecikmeli ödülü ve stokastik geçişleri hesaba kattığından miyop baselinelardan üstün; qlearning ile MDP optimumu arasındaki fark seed/episode gürültüsü içindedir (eşli t-test p≈0.37), dolayısıyla qlearning optimumu geçmez, ona eşitlenir (VI simülatörle aynı çekirdeğin optimumu = gerçek tavan).
- **Sonuç:** RL yaklaşımı naif kurallara göre ölçülebilir iktisadi kazanç sağlıyor; bu da çevre seçimini gerekçelendirir.
