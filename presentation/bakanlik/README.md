# LaktaSens — Tarım ve Orman Bakanlığı Sunumu

Bu klasör, siyasilere/bürokratlara yönelik bakanlık sunumunu içerir.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `LaktaSens_Bakanlik_Sunumu.pptx` | **Ana teslim.** PowerPoint'te açıp düzenleyebilirsin (11 slayt, 16:9 geniş, Türkçe). |
| `LaktaSens_Bakanlik_Sunumu.pdf` | Hızlı önizleme / e-posta için PDF kopya. |
| `screenshots/` | Uygulamadan alınmış gerçek ekran görüntüleri (1440×900 PNG). |
| `_build_deck.cjs` | Sunumu üreten script. İçeriği değiştirip yeniden üretebilirsin. |
| `_capture.cjs` | Uygulamadan ekran görüntülerini diske kaydeden script (headless Chrome). |

## Slayt akışı

1. **Kapak** — LaktaSens wordmark + slogan + bakanlık ibaresi.
2. **Neleri Çözüyoruz?** — 4 sektör/devlet sorunu → çözüm + sağda "Yeni Nesli Tarıma Kazandırmak" paneli.
3. **Bu Sunumda Ne Göstereceğiz?** — 4 adımlık dikkat çekici yol haritası.
4. **Tek Platform, Tüm Operasyon** — 6 modül + çiftçi paneli ekranı + 3 rol.
5. **Sensör İzleme** — canlı nem/sıcaklık grafiği ekranı.
6. **Tedarik & Şeffaf Alım** — ihale başlatma ekranı + market/sipariş akışı.
7. **Depo & Akıllı Analitik** — yem ihtiyaç analizi ekranı.
8. **Yapay Zekâ Vizyonu** — Veri → Proje A → Proje B → Karar + RL (sürüden tut/çıkar).
9. **AI Karar Ekranları (Demo)** — risk, anomali, öneri ekranları (dürüst "demo" notu).
10. **AI: Şu Ana Kadar Ne Yaptık?** — Proje A altyapı kartları + RL baseline grafiği + **sentetik veri uyarısı**.
11. **Vizyon & Misyon** — politik tonlu kapanış + "Devlet–Üretici–Teknoloji" çağrısı.

> Konuşmacı notları her slaytta gömülüdür (PowerPoint > Görünüm > Notlar).

## Yeniden üretme

İçeriği `_build_deck.cjs` içinde düzenledikten sonra:

```powershell
node presentation/bakanlik/_build_deck.cjs
```

## Ekran görüntülerini yeniden çekme (daha dolu ekranlar için)

Bazı operasyonel ekranlar (market, sürü takip, sipariş) backend çalışmadığı için
boş/"kayıt yok" görünür. **Backend'i (localhost:3030) çalıştırıp** aşağıdakini
koşarsan bu ekranlar gerçek verilerle dolu yakalanır:

```powershell
# 1) UI dev server
cd UI/LaktaSense; npm run dev
# 2) ayrı terminalde backend'i başlat (localhost:3030)
# 3) ekranları yeniden çek
node presentation/bakanlik/_capture.cjs
```

`_capture.cjs` içindeki `GROUPS` listesine yeni rota/dosya ekleyerek başka
ekranlar da çekebilirsin. Çekim auth'u localStorage'a `userInfo` yazarak aşar.

## İsteğe bağlı görseller (raster üretemiyorum — prompt'ları aşağıda)

Sunum şu an vektörel/temiz tasarım + gerçek ekran görüntüleriyle çalışıyor; foto
gerekmiyor. Daha sıcak/duygusal bir his istersen şu fotoğrafları üretip
(Midjourney/DALL·E/Adobe Firefly) belirtilen slayta koyabilirsin:

1. **Kapak arka planı (opsiyonel):**
   "Wide cinematic photo of a modern Turkish dairy farm at golden hour, healthy
   Holstein cows, clean barn, soft green and gold tones, shallow depth of field,
   space on the left for text, professional, photorealistic — 16:9"

2. **Slayt 2 / Yeni nesil paneli:**
   "A young Turkish farmer in their 20s smiling, holding a smartphone showing a
   dashboard, standing in a sunlit cattle barn, optimistic, modern agriculture,
   photorealistic, natural light — portrait/square"

3. **Slayt 8 / AI vizyonu (dark slayt aksanı):**
   "Abstract data-driven agriculture concept, glowing network nodes over a green
   pasture, dark teal-green background, premium tech feel, minimal — 16:9"

4. **Kapanış (slayt 11):**
   "Handshake between a farmer and an official over farmland, warm tone,
   partnership and trust, photorealistic — 16:9 with copy space"

Foto eklersen okunabilirlik için üstüne koyu yarı saydam katman koymayı unutma.
