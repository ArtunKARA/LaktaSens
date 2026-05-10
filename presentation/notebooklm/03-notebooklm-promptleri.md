# NotebookLM Ayarları ve Prompt Paketi

Bu dosya, LaktaSens için NotebookLM üzerinde yatırımcı sunumu üretirken kullanılacak ayarları ve hazır promptları içerir.

## NotebookLM'ye Yüklenecek Kaynak Paketi

1. `01-urun-ozeti.md`  
Ana anlatı metni. Yatırımcıya verilecek iş değeri, ürün konumu ve yol haritası burada yer alır.

2. Ekran görüntülerinden oluşan tek bir PDF veya Google Slides dosyası  
Her ekranın altında bir cümlelik açıklama olmalıdır. Görselleri tek tek dağınık yüklemek yerine tek dosyada toplamak daha iyi sonuç verir.

3. İsterseniz kısa ekran kayıtlarının YouTube bağlantıları veya açıklamalı transcript dosyaları  
Sessiz video yerine kısa açıklamalı veya altyazılı video yüklemek daha faydalıdır.

4. İsterseniz teknik yol haritası için ek bir kısa doküman  
Sensör katmanı, API, veritabanı ve AI vizyonunu ayrı bir sayfada özetleyebilirsiniz.

## Önerilen NotebookLM Ayarları

- Çıktı dili: Türkçe
- Slide Deck formatı: Presenter Slides
- Slide Deck uzunluğu: Default
- Video Overview formatı: Explainer
- Infographic detay seviyesi: Standard
- Infographic yönü: Landscape
- Infographic stil tercihi: Professional

İlk sunum için önce Slide Deck üretin. Sonra aynı kaynaklarla kısa tanıtım videosu için Video Overview üretin. Son aşamada tek sayfalık paylaşım görseli için Infographic üretin.

## Slide Deck Promptu

```text
Bu notebook içindeki kaynaklara dayanarak LaktaSens için yatırımcı odaklı bir sunum oluştur. Dil Türkçe olsun. Ton profesyonel, net ve güvenilir olsun. Kaynaklarda olmayan rakam, müşteri, pilot, gelir, pazar büyüklüğü, doğruluk oranı, performans metriği veya ticari başarı verisi uydurma.

Ürünü şu şekilde konumlandır:
LaktaSens, çiftçi, tedarikçi, depo, sensör ve veri katmanını birleştiren entegre bir dijital operasyon platformudur.

Sunumda canlı çalışan modüller ile yol haritasını net biçimde ayır:
- Ürünleşmiş veya operasyonel olarak anlatılabilecek alanlar: çiftçi dashboard'u, sürü takip ekranları, yem marketi, ihale akışı, sipariş-sevkiyat-kabul-depo planı, stok ve tüketim takibi, sensör izleme ekranları, admin başvuru ve parametre yönetimi.
- Yol haritası veya vizyon olarak anlatılacak alanlar: AI demo ekranları ve RL/MDP tabanlı elde tut / sürüden çıkar karar destek yaklaşımı.

Sunum yapısı şu sırada olsun:
1. Problem
2. Çözüm ve platform yaklaşımı
3. Çiftçi tarafı modüller
4. Tedarik ve depo akışı
5. Sensör ve veri toplama
6. Karar destek ve AI yol haritası
7. Neden farklıyız
8. Ölçeklenebilirlik ve veri avantajı
9. Kapanış ve yatırım tezi

Her slaytta kısa bir başlık, 3-4 kısa madde ve konuşmacı notu ver. Uygun olan slaytlarda hangi ekran görüntüsünün kullanılması gerektiğini belirt. Operasyonel izlenebilirlik, iki taraflı platform yapısı ve veri birikiminin gelecekteki karar zekası değerini özellikle vurgula.
```

## Video Overview Promptu

```text
Bu projeyi yatırımcıya anlatan 2-3 dakikalık Türkçe bir anlatım üret. LaktaSens'i entegre çiftlik operasyon platformu olarak konumlandır. Çiftçi modülleri, tedarik ve depo akışı, sensör verisi ve gelecekteki karar destek vizyonunu anlat. Canlı modüller ile AI yol haritasını karıştırma. Teknik jargonu azalt, iş değerini artır.
```

## Infographic Promptu

```text
LaktaSens'i tek sayfada özetleyen profesyonel bir infographic üret. Odak noktaları: çiftçi operasyonları, tedarik akışı, depo izlenebilirliği, sensör verisi ve AI yol haritası. Mavi ve yeşil tonları kullan. İçeriği 5 ana blok halinde kur. En altta 3 temel faydayı öne çıkar: operasyonel görünürlük, tedarik zinciri entegrasyonu ve gelecekte veri tabanlı karar desteği.
```

## Audio Overview Promptu

```text
Bu kaynaklara dayanarak LaktaSens'i yatırımcıya anlatan kısa bir Türkçe audio overview oluştur. Ürünün bugün çalışan operasyon modüllerini anlat, ardından sensör ve veri birikimi sayesinde açılan AI potansiyelini yol haritası olarak özetle. Abartılı vaatlerden kaçın, güvenilir ve iş odaklı bir ton kullan.
```

## Kullanım Notları

- İlk denemede ortaya çıkan deck fazla teknik kalırsa, aynı prompta "iş değeri odaklı yaz" cümlesini ekleyin.
- İlk denemede AI kısmı fazla öne çıkarsa, "AI bölümünü kısa tut ve roadmap olarak konumlandır" cümlesini ekleyin.
- İlk denemede ekran referansları zayıfsa, görsel dosyasındaki başlıkları daha net isimlerle yeniden yükleyin.
- Yatırımcıya göndermeden önce tüm çıktılarda uydurulmuş rakam veya kesin ticari iddia olup olmadığını kontrol edin.
