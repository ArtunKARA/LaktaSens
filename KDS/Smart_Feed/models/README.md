# Smart Feed Models

Bu klasor Smart Feed icin notebook kontrollu egitim alanidir. Ham SQL/ETL
kodundan ayridir; model calistirma, metrik, grafik ve opsiyonel model kaydi
burada yonetilir.

## Klasorler

- `proje_a_sut_saglik_besleme_risk_tahmini`: Project A icin sut, saglik riski
  ve besleme ihtiyaci tahmini.
- `proje_b_rasyon_optimizasyon_politika_modeli`: Project B icin rasyon skoru,
  reward ve politika/aksiyon modeli.

## Genel kullanim

1. PostgreSQL loader ve sentetik/proxy scriptleri calismis olmalidir:
   - `sql/00_postgresql_load_all.sql`
   - `sql/04_generate_synthetic_project_a_features.sql`
   - `sql/05_seed_synthetic_project_b_optimizer.sql`
2. Ilgili proje klasorundeki notebook acilir.
3. Notebook icinde DB sifresi oturumda girilir veya
   `SMART_FEED_DATABASE_URL` ortam degiskeni ayarlanir.
4. Hedef, model listesi ve kayit ayarlari notebook parametrelerinden
   degistirilir.

WSL notu: PostgreSQL Windows servisinde sadece Windows `localhost` uzerinden
dinliyorsa WSL Python kernel'i `localhost:5432` ile baglanamayabilir. Notebook'u
Windows Python/Jupyter kernel ile acmak en sorunsuz yoldur. WSL kernel
kullanilacaksa PostgreSQL `listen_addresses` ve Windows firewall ayarlari WSL
host erisimine gore acilmalidir.

Not: Mevcut Smart Feed verisi POC amaclidir ve sentetik/proxy alanlar icerir.
Notebook metrikleri gercek klinik veya ticari performans iddiasi olarak
yorumlanmamalidir.
