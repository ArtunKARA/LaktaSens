-- Firmalar tablosuna veri ekleme
INSERT INTO firmalar (firmaAdi,firmaTur, telefonNo, firmaMail, firmaAdresi, sehirID, ilceID, bolge, hesapDurumu) VALUES
(N'LaktaSens','a', '1234567890','info@laktasense.com', N'Adres 1, Şehir',1,1056, 'a', 'a'),
(N'Çiftlik Baba','c','0987654321','info@ciftlik2.com', N'Adres 2, Şehir',1,1056, 'b', 'a'),
(N'MaxTedarik','t','1234567890','info@MaxTedarik.com', N'Adres 3, Şehir',1,1056, 'a', 'a'),
(N'Yılmaz Gıda A.Ş.','c','5852136547','iletisim@yilmazgida.com', N'Organize Sanayi Bölgesi, No:12, Afyonkarahisar',10,2365, 'a', 'b'),
(N'Angarasta Yem A.Ş.','c','5206931245','astar@agarta.com', N'Merkezde bir yer',6,1114, 'a', 'b'),
(N'Memoli Yem Tic. A.Ş','t','5506731835','info@memoliyem.com', N'Serbest Ticaret Bölgesi, No:12',7,1154, 'a', 'b');
GO

-- İnek tablosuna veri ekleme
INSERT INTO inek (inekQR, ad, irk, kilo, dogumTarihi, sonDogurmaTarihi, firmaID, anneID, sonDollenme, dollenmeSayisi, tuttuMu, sonKuruTarihi, sonSutOlcumTarihi) VALUES
('QR123', N'Ayla', N'Holstein', 300, '2020-01-15', '2024-10-21', 2, NULL, '2024-01-15', 1, NULL, '2024-08-22', '2024-08-22'),
('QR124', N'Zeytin', N'Jersey', 250, '2019-03-22', '2023-11-27', 2, NULL, '2024-02-20', 1, 'E', '2024-09-27', '2024-09-27'),
('QR125', N'Mavi', N'Ayrshire', 400, '2018-05-30', '2024-04-05', 2, NULL, '2024-06-29', 1, 'E', '2024-02-05', '2024-02-05'),
('QR126', N'Mavi', N'Angus', 350, '2018-05-30', '2024-07-31', 2, NULL, '2024-11-20', 1, 'H', '2024-06-30', '2024-06-30'),
('QR127', N'Mavi', N'Ayrshire', 375, '2018-05-30', '2024-07-30', 2, NULL, '2023-09-25', 2, NULL, '2024-05-01', '2024-05-01');
GO

-- Doğurma tablosuna veri ekleme
INSERT INTO dogurma (dogurmaTarihi, inekID) VALUES
('2024-10-21', 1),
('2023-10-24', 1),
('2022-10-24', 1),
('2023-11-27', 2),
('2022-11-30', 2),
('2002-12-21', 2),
('2024-04-05', 3),
('2023-04-10', 3),
('2022-04-10', 3),
('2024-08-31', 4),
('2023-09-03', 4),
('2022-09-05', 4),
('2024-06-30', 5),
('2023-07-03', 5),
('2022-07-05', 5);
GO

-- Döllenme tablosuna veri ekleme
INSERT INTO dollenme (dollenmeTarihi, inekID, dollenmeSayisi, tuttuMu) VALUES
('2024-01-15', 1, 1, 'E'),
('2023-01-07', 1, 1, 'E'),
('2024-02-20', 2, 1, 'E'),
('2023-02-23', 2, 1, 'E'),
('2022-02-25', 2, 1, 'E'),
('2024-06-29', 3, 1, 'E'),
('2023-01-07', 3, 1, 'E'),
('2023-11-25', 4, 1, 'E'),
('2022-11-28', 4, 1, 'E'),
('2024-10-26', 5, 1, 'H'),
('2023-11-28', 5, 1, 'E'),
('2022-11-30', 4, 1, 'H');
GO

-- Kuru tablosuna veri ekleme
INSERT INTO kuru (kuruBaslangicTarihi, inekID) VALUES
('2024-08-22', 1),
('2023-08-25', 1),
('2022-08-25', 1),
('2023-09-28', 2),
('2022-10-01', 2),
('2021-10-22', 2),
('2024-02-05', 3),
('2023-02-09', 3),
('2022-02-09', 3),
('2024-07-02', 4),
('2023-07-05', 4),
('2022-07-07', 4),
('2024-05-01', 5),
('2023-05-04', 5),
('2022-05-06', 5);
GO

-- Süt Ölçüm tablosuna veri ekleme
INSERT INTO sutOlcum (makineID, sutMiktar, inekID, sagimTarihi) VALUES
(1, 4, 1, '2024-11-01'),
(1, 5, 1, '2024-10-31'),
(1, 4, 1, '2024-10-30'),
(2, 5, 1, '2024-10-29'),
(1, 4, 1, '2024-10-28'),
(1, 4, 1, '2024-10-27'),
(2, 5, 1, '2024-10-26'),
(1, 4, 1, '2024-10-25'),
(1, 4, 1, '2024-10-24'),
(2, 5, 1, '2024-10-23'),
(1, 4, 1, '2024-10-22'),
(1, 5, 1, '2024-10-21'),
(2, 5, 1, '2022-10-20'),

(1, 6, 2, '2024-11-01'),
(1, 7, 2, '2024-10-31'),
(1, 6, 2, '2024-10-30'),
(2, 7, 2, '2024-10-29'),
(1, 6, 2, '2024-10-28'),
(1, 6, 2, '2024-10-27'),
(2, 6, 2, '2024-10-26'),
(1, 7, 2, '2024-10-25'),
(1, 6, 2, '2024-10-24'),
(2, 7, 2, '2024-10-23'),
(1, 6, 2, '2024-10-22'),
(1, 7, 2, '2024-10-21'),
(2, 6, 2, '2022-10-20'),

(1, 8, 3, '2024-11-01'),
(1, 7, 3, '2024-10-31'),
(1, 8, 3, '2024-10-30'),
(2, 7, 3, '2024-10-29'),
(1, 8, 3, '2024-10-28'),
(1, 7, 3, '2024-10-27'),
(2, 7, 3, '2024-10-26'),
(1, 8, 3, '2024-10-25'),
(1, 7, 3, '2024-10-24'),
(2, 8, 3, '2024-10-23'),
(1, 8, 3, '2024-10-22'),
(1, 8, 3, '2024-10-21'),
(2, 8, 3, '2022-10-20'),

(1, 8, 4, '2024-11-01'),
(1, 9, 4, '2024-10-31'),
(1, 8, 4, '2024-10-30'),
(2, 9, 4, '2024-10-29'),
(1, 9, 4, '2024-10-28'),
(1, 9, 4, '2024-10-27'),
(2, 9, 4, '2024-10-26'),
(1, 9, 4, '2024-10-25'),
(1, 9, 4, '2024-10-24'),
(2, 9, 4, '2024-10-23'),
(1, 8, 4, '2024-10-22'),
(1, 9, 4, '2024-10-21'),
(2, 8, 4, '2022-10-20');
GO

-- Kullanıcılar tablosuna veri ekleme
INSERT INTO kullanicilar (tcNo, eposta, parola, kullaniciTuru, hesapFirmaYetkisi, isim, soyisim, telefonNo, hesapDurumu, firmaID)
VALUES
-- Admin Kullanıcısı
('32469827348', 'admin1@example.com', 'password123', 'a', 'a', 'Ahmet', 'Yılmaz', '5301234567', 'a', 1),

-- Çiftçi Kullanıcıları
('64964677470', 'ciftci1@example.com', 'password123', 'c', 'a', 'Ali', 'Kaya', '5312345678', 'a', 2),
('58828817850', 'ciftci2@example.com', 'password123', 'c', 'k', 'Ayşe', 'Demir', '5323456789', 'p', 2),
('18134486140', 'ciftci3@example.com', 'password123', 'c', 'k', 'Mehmet', 'Çelik', '5334567890', 'b', 2),
('12345678901', 'ali.yilmaz@example.com', 'Gida2024!', 'c', 'a', 'Ali', 'Yılmaz', '05551234567', 'b', 4),
('16684246344', 'artunankara@gmail.com', 'Asd123', 'c', 'a', 'Ablovom', 'Komposto', '5334567890', 'b', 5),

-- Tedarikçi Kullanıcıları
('47264317352', 'tedarikci1@example.com', 'password123', 't', 'a', 'Zeynep', 'Şahin', '5345678901', 'a', 3),
('43323783496', 'tedarikci2@example.com', 'password123', 't', 'k', 'Fatma', 'Eren', '5356789012', 'p', 3),
('18134486140', 'mehmet@memoliyem.com', 'Asd123', 't', 'a', 'Memhmet', 'Öneli', '5506731835', 'b', 6),   
('16684246344', 'tedarikci3@example.com', 'password123', 't','k', 'Hakan', 'Koç', '5367890123', 'b', 3);
GO

INSERT INTO RedEdilenBaşvurularFirmalar (firmaID, kullaniciID, redNedeni, redTarihi)
VALUES 
-- Çiftçi 
(4, 1, 'Başvuru bilgileri eksik.', CAST(GETDATE() AS DATE)),

-- Tedarikçi 
(6, 1, 'Firma kriterlerimizi karşılamamaktadır.', CAST(GETDATE() AS DATE));
GO



INSERT INTO Birimler (birimAdi, aciklama)
VALUES 
('%km', 'Yüzde kuru madde'),
('Mcal/kg', 'Enerji değeri (Mcal)'),
('kg', 'Kilogram'),
('g/kg', 'Gram/kilogram');

INSERT INTO BesinTipleri (tipAdi, birimID) VALUES
('Kuru Madde', 3),   -- kg
('Ham Protein', 1),  -- %
('Net Enerji', 2),   -- Mcal/kg
('Kalsiyum', 1),     -- %
('Fosfor', 1);       -- %

INSERT INTO BesinIhtiyaciStandartlari (laktasyonDonemi) VALUES
('Kuru'),
('Gebelik'),
('Sağmal'),
('Yavru');

-- BUNUN ALTINA BİLGİLER EKLENECEK
INSERT INTO BesinIhtiyacDetay (standartID, tipID, miktar) VALUES
(1, 1, 10.0),  -- Kuru Madde (kg)
(1, 2, 12.0),  -- Ham Protein (%)
(1, 3, 8.0),  -- Net Enerji (Mcal/kg)
(1, 4, 0.55),  -- Kalsiyum (%)
(1, 5, 0.35);  -- Fosfor (%)

INSERT INTO BesinIhtiyacDetay (standartID, tipID, miktar) VALUES
(2, 1, 12.0),  -- Kuru Madde (kg)
(2, 2, 13.0),  -- Ham Protein (%)
(2, 3, 9.0),  -- Net Enerji (Mcal/kg)
(2, 4, 0.60),  -- Kalsiyum (%)
(2, 5, 0.38);  -- Fosfor (%)

INSERT INTO BesinIhtiyacDetay (standartID, tipID, miktar) VALUES
(3, 1, 20.0),  -- Kuru Madde (kg)
(3, 2, 16.0),  -- Ham Protein (%)
(3, 3, 12.0),  -- Net Enerji (Mcal/kg)
(3, 4, 0.80),  -- Kalsiyum (%)
(3, 5, 0.45);  -- Fosfor (%)

INSERT INTO BesinIhtiyacDetay (standartID, tipID, miktar) VALUES
(4, 1, 6.0),   -- Kuru Madde (kg/gün)
(4, 2, 18.0),  -- Ham Protein (%KM)
(4, 3, 8.0),   -- Net Enerji (Mcal/kg KM)
(4, 4, 0.65),  -- Kalsiyum (%)
(4, 5, 0.45);  -- Fosfor (%)

INSERT INTO YemMaddeleri (yemAdi, ozelYem, durum, yemFirmaID, birimFiyat, minSiparisKg, maxSiparisKg, aciklama)
VALUES 
('Mısır Silajı', 0, 'a', NULL, 7.50, 100, 5000, 'Standart veri kaynağından'),
('Çayır Kuru Otu', 0, 'a', NULL, 6.80, 50, 4000, 'Standart veri kaynağından'),
('Melas', 0, 'a', NULL, 5.20, 50, 3500, 'Standart veri kaynağından'),
('Arpa', 0, 'a', NULL, 8.10, 150, 3500, 'Standart veri kaynağından'),
('PTK', 0, 'a', NULL, 10.50, 100, 3000, 'Standart veri kaynağından'),
('Kireç Taşı', 0, 'a', NULL, 4.40, 200, 5000, 'Standart veri kaynağından'),
('DCP', 0, 'a', NULL, 12.80, 100, 2500, 'Standart veri kaynağından'),
('Buğday Silajı', 1, 'a', 3, 9.20, 100, 3000, 'Firma 3 – örnek veri'),
('Yonca Silajı', 1, 'a', 3, 8.75, 100, 2800, 'Firma 3 – örnek veri'),
('Soya Küspesi', 1, 'a', 3, 14.50, 50, 2000, 'Firma 3 – örnek veri');

-- Mısır Silajı
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(1, 1, 25), (1, 2, 8.30), (1, 3, 0.97), (1, 4, 0.31), (1, 5, 0.27);

-- Çayır Kuru Otu
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(2, 1, 91), (2, 2, 8.20), (2, 3, 0.50), (2, 4, 0.50), (2, 5, 0.23);

-- Melas
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(3, 1, 72), (3, 2, 0.00), (3, 3, 1.10), (3, 4, 0.05), (3, 5, 0.02);

-- Arpa
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(4, 1, 88), (4, 2, 12.30), (4, 3, 1.40), (4, 4, 0.05), (4, 5, 0.35);

-- PTK
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(5, 1, 92), (5, 2, 24.40), (5, 3, 1.55), (5, 4, 0.17), (5, 5, 0.17);

-- Kireç Taşı
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(6, 1, 100), (6, 4, 22.00); -- Sadece Ca var

-- DCP
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(7, 1, 100), (7, 4, 22.00), (7, 5, 19.30);

/* Buğday Silajı  (yemID = 8) */
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(8, 1, 30.0),   -- % KM
(8, 2, 8.50),   -- % HP
(8, 3, 1.00),   -- Mcal/kg
(8, 4, 0.30),   -- % Ca
(8, 5, 0.25);   -- % P

/* Yonca Silajı  (yemID = 9) */
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(9, 1, 35.0),
(9, 2, 16.00),
(9, 3, 1.02),
(9, 4, 1.30),
(9, 5, 0.22);

/* Soya Küspesi  (yemID = 10) */
INSERT INTO YemBesinDegerleri (yemID, tipID, miktar) VALUES
(10, 1, 89.0),
(10, 2, 48.00),
(10, 3, 1.70),
(10, 4, 0.29),
(10, 5, 0.71);

INSERT INTO RedEdilenBaşvurularYem (yemID, kullaniciID, redNedeni, redTarihi)
VALUES 
(10, 1, 'Başvuru bilgileri eksik.', CAST(GETDATE() AS DATE)),
(10, 1, 'Yem kriterlerimizi karşılamamaktadır.', CAST(GETDATE() AS DATE));
GO

INSERT INTO IslemNedenleri (islemTipi, nedenAdi) VALUES
('g', 'Satın Alma'),
('g', 'İade Alımı'),
('g', 'Üretimden Giriş'),
('g', 'Bağış / Hibe Alımı'),
('g', 'Stok Fazlası'),
('c', 'Satış'),
('c', 'İade'),
('c', 'Üretime Veriş'),
('c', 'Fire'),
('c', 'Zayi'),
('c', 'Bağış / Hibe'),
('c', 'Stok Açığı');

-- Çiftlik Baba için Yem İşlemleri
-- 1-20: GİRİŞ İşlemleri
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 500.00, @kullaniciID = 2, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 300.00, @kullaniciID = 2, @aciklama = 'Hibe ile alınan yem', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 450.00, @kullaniciID = 2, @aciklama = 'Stok fazlası girişi', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 4, @miktarKg = 600.00, @kullaniciID = 2, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 5, @miktarKg = 200.00, @kullaniciID = 2, @aciklama = 'Hibe ile alınan yem', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 6, @miktarKg = 350.00, @kullaniciID = 2, @aciklama = 'Stok fazlası girişi', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 7, @miktarKg = 400.00, @kullaniciID = 2, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 150.00, @kullaniciID = 2, @aciklama = 'Hibe ile alınan yem', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 500.00, @kullaniciID = 2, @aciklama = 'Stok fazlası girişi', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 320.00, @kullaniciID = 2, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 600.00, @kullaniciID = 2, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 275.00, @kullaniciID = 2, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 310.00, @kullaniciID = 2, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 4, @miktarKg = 400.00, @kullaniciID = 2, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 5, @miktarKg = 150.00, @kullaniciID = 2, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 6, @miktarKg = 550.00, @kullaniciID = 2, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 7, @miktarKg = 700.00, @kullaniciID = 2, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 270.00, @kullaniciID = 2, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 330.00, @kullaniciID = 2, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 450.00, @kullaniciID = 2, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 550.00, @kullaniciID = 2, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 300.00, @kullaniciID = 2, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 400.00, @kullaniciID = 2, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 4, @miktarKg = 500.00, @kullaniciID = 2, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 5, @miktarKg = 250.00, @kullaniciID = 2, @aciklama = 'Bağış alımı', @islemNedeniID = 4;


-- 21-40: ÇIKIŞ İşlemleri
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 60.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 40.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 35.00, @kullaniciID = 2, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 4, @miktarKg = 80.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 5, @miktarKg = 25.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 6, @miktarKg = 90.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 7, @miktarKg = 55.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 45.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 38.00, @kullaniciID = 2, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 75.00, @kullaniciID = 2, @aciklama = 'Zayi kaydı', @islemNedeniID = 10;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 1, @miktarKg = 65.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 2, @miktarKg = 50.00, @kullaniciID = 2, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 3, @miktarKg = 30.00, @kullaniciID = 2, @aciklama = 'Zayi kaydı', @islemNedeniID = 10;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 4, @miktarKg = 85.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 5, @miktarKg = 20.00, @kullaniciID = 2, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 6, @miktarKg = 95.00, @kullaniciID = 2, @aciklama = 'Zayi kaydı', @islemNedeniID = 10;
EXEC sp_YemIslemiEkle @firmaID = 2, @yemID = 7, @miktarKg = 60.00, @kullaniciID = 2, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;


--Tedarikçi için Yem İşlemleri
-- 1-20: GİRİŞ İşlemleri
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 500.00, @kullaniciID = 7, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 300.00, @kullaniciID = 7, @aciklama = 'Hibe ile alınan yem', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 3, @miktarKg = 450.00, @kullaniciID = 7, @aciklama = 'Stok fazlası girişi', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 4, @miktarKg = 600.00, @kullaniciID = 7, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 5, @miktarKg = 200.00, @kullaniciID = 7, @aciklama = 'Hibe ile alınan yem', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 6, @miktarKg = 350.00, @kullaniciID = 7, @aciklama = 'Stok fazlası girişi', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 7, @miktarKg = 400.00, @kullaniciID = 7, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 150.00, @kullaniciID = 7, @aciklama = 'Hibe ile alınan yem', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 500.00, @kullaniciID = 7, @aciklama = 'Stok fazlası girişi', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 3, @miktarKg = 320.00, @kullaniciID = 7, @aciklama = 'Satın alınan yem', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 600.00, @kullaniciID = 7, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 275.00, @kullaniciID = 7, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 3, @miktarKg = 310.00, @kullaniciID = 7, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 4, @miktarKg = 400.00, @kullaniciID = 7, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 5, @miktarKg = 150.00, @kullaniciID = 7, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 6, @miktarKg = 550.00, @kullaniciID = 7, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 7, @miktarKg = 700.00, @kullaniciID = 7, @aciklama = 'Satın alma', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 270.00, @kullaniciID = 7, @aciklama = 'Bağış alımı', @islemNedeniID = 4;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 330.00, @kullaniciID = 7, @aciklama = 'Stok fazlası', @islemNedeniID = 5;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 3, @miktarKg = 450.00, @kullaniciID = 7, @aciklama = 'Satın alma', @islemNedeniID = 1;

-- 21-40: ÇIKIŞ İşlemleri
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 60.00, @kullaniciID = 7, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 40.00, @kullaniciID = 7, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 3, @miktarKg = 35.00, @kullaniciID = 7, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 4, @miktarKg = 80.00, @kullaniciID = 7, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 5, @miktarKg = 25.00, @kullaniciID = 7, @aciklama = 'Zayi kaydı', @islemNedeniID = 10;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 6, @miktarKg = 90.00, @kullaniciID = 7, @aciklama = 'Zayi kaydı', @islemNedeniID = 10;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 7, @miktarKg = 55.00, @kullaniciID = 7, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 45.00, @kullaniciID = 7, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 38.00, @kullaniciID = 7, @aciklama = 'Fire kaybı', @islemNedeniID = 9;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 3, @miktarKg = 75.00, @kullaniciID = 7, @aciklama = 'Zayi kaydı', @islemNedeniID = 10;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 1, @miktarKg = 65.00, @kullaniciID = 7, @aciklama = 'Üretimde kullanıldı', @islemNedeniID = 8;
EXEC sp_YemIslemiEkle @firmaID = 3, @yemID = 2, @miktarKg = 50.00, @kullaniciID = 7, @aciklama = 'Fire kaybı', @islemNedeniID = 9;

-- Tedarikçi (firmaID=6) stok girişleri
EXEC sp_YemIslemiEkle @firmaID = 6, @yemID = 1, @miktarKg = 800.00, @kullaniciID = 7, @aciklama = 'Stok girişi', @islemNedeniID = 1;
EXEC sp_YemIslemiEkle @firmaID = 6, @yemID = 4, @miktarKg = 650.00, @kullaniciID = 7, @aciklama = 'Stok girişi', @islemNedeniID = 1;

INSERT INTO dbo.DurumKodlari (Tip, Kod, Aciklama) VALUES
-- Ihale
('Ihale','a','Açık'),
('Ihale','k','Kapalı'),
('Ihale','t','Tamamlandı'),
('Ihale','i','İptal'),
-- Teklif
('Teklif','b','Beklemede'),
('Teklif','s','Seçildi'),
('Teklif','r','Reddedildi'),
('Teklif','c','Çekildi'),
-- Siparis
('Siparis','b','Beklemede'),
('Siparis','o','Onaylandı'),
('Siparis','i','İptal'),
('Siparis','r','Reddedildi'),
('Siparis','t','Tamamlandı'),
-- Sevkiyat
('Sevkiyat','h','Hazırlıkta'),
('Sevkiyat','y','Yolda'),
('Sevkiyat','t','Teslim Edildi'),
-- Kabul
('Kabul','k','Kabul'),
('Kabul','p','Kısmi Kabul'),
('Kabul','i','İade'),
-- IadeOnay
('IadeOnay','o','Onay'),
('IadeOnay','r','Red'),
-- Depo işlem
('DepoIslem','G','Giriş'),
('DepoIslem','C','Çıkış'),
-- Depo giriş plan
('DepoGirisPlan','p','Planlandı'),
('DepoGirisPlan','k','Kısmi'),
('DepoGirisPlan','t','Tamamlandı'),
('DepoGirisPlan','i','İptal');

GO

-- Tedarik süreci örnek verileri
DECLARE @ihale1 INT, @ihale2 INT;
DECLARE @teklif1 INT, @teklif2 INT, @teklif3 INT;
DECLARE @siparis1 INT, @siparis2 INT;
DECLARE @sevkiyat1 INT, @sevkiyat2 INT;
DECLARE @kabul1 INT, @kabul2 INT;
DECLARE @kabulKalem1 INT;

-- Ihale 1 (açık, kısmi kalan)
INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
VALUES (N'Mısır Silajı Alımı', DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, 5, GETDATE()), 'a', N'Acil ihtiyaç', 2);
SET @ihale1 = SCOPE_IDENTITY();

INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
VALUES (@ihale1, 1, 1000, 300);

-- Ihale 2 (tamamlandı)
INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
VALUES (N'Çayır Kuru Otu Alımı', DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -2, GETDATE()), 't', N'Tamamlandı', 4);
SET @ihale2 = SCOPE_IDENTITY();

INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
VALUES (@ihale2, 2, 500, 0);

-- Teklifler
INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale1, 3, 700, 7.50, 5250.00, DATEADD(HOUR, -3, GETDATE()), 's');
SET @teklif1 = SCOPE_IDENTITY();

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale1, 6, 300, 7.20, 2160.00, GETDATE(), 'b');
SET @teklif2 = SCOPE_IDENTITY();

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale2, 3, 500, 6.00, 3000.00, DATEADD(DAY, -8, GETDATE()), 's');
SET @teklif3 = SCOPE_IDENTITY();

-- Siparişler
INSERT INTO Siparisler (teklifID, olusturanFirmaID, siparisTarihi, toplamTutar, durum)
VALUES (@teklif1, 2, DATEADD(DAY, -1, GETDATE()), 5250.00, 'o');
SET @siparis1 = SCOPE_IDENTITY();

INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
VALUES (@siparis1, 1, 700, 7.50);

INSERT INTO Siparisler (teklifID, olusturanFirmaID, siparisTarihi, toplamTutar, durum)
VALUES (@teklif3, 4, DATEADD(DAY, -7, GETDATE()), 3000.00, 't');
SET @siparis2 = SCOPE_IDENTITY();

INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
VALUES (@siparis2, 2, 500, 6.00);

-- Sevkiyatlar
INSERT INTO Sevkiyatlar (SiparisID, SevkTarihi, BeklenenTeslim, Durum)
VALUES (@siparis1, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 1, GETDATE()), 't');
SET @sevkiyat1 = SCOPE_IDENTITY();

INSERT INTO SevkiyatKalemleri (SevkiyatID, YemID, MiktarKg)
VALUES (@sevkiyat1, 1, 400);

INSERT INTO Sevkiyatlar (SiparisID, SevkTarihi, BeklenenTeslim, Durum)
VALUES (@siparis2, DATEADD(DAY, -6, GETDATE()), DATEADD(DAY, -5, GETDATE()), 't');
SET @sevkiyat2 = SCOPE_IDENTITY();

INSERT INTO SevkiyatKalemleri (SevkiyatID, YemID, MiktarKg)
VALUES (@sevkiyat2, 2, 500);

-- Kabul + Iade
INSERT INTO Kabul (SevkiyatID, KabulTarihi, Durum)
VALUES (@sevkiyat1, GETDATE(), 'p');
SET @kabul1 = SCOPE_IDENTITY();

INSERT INTO KabulKalemleri (KabulID, YemID, KabulMiktarKg, IadeMiktarKg)
VALUES (@kabul1, 1, 350, 50);
SET @kabulKalem1 = SCOPE_IDENTITY();

INSERT INTO Iade (KabulKalemID, IadeTarihi, IadeMiktarKg, IadeNedeni, IadeDurumu)
VALUES (@kabulKalem1, GETDATE(), 50, N'Kalite sorunu', 'b');

INSERT INTO Kabul (SevkiyatID, KabulTarihi, Durum)
VALUES (@sevkiyat2, DATEADD(DAY, -5, GETDATE()), 'k');
SET @kabul2 = SCOPE_IDENTITY();

INSERT INTO KabulKalemleri (KabulID, YemID, KabulMiktarKg, IadeMiktarKg)
VALUES (@kabul2, 2, 500, 0);



GO

-- Tedarik süreci örnek verileri (zenginleştirme)
DECLARE @ihale3 INT, @ihale4 INT, @ihale5 INT, @ihale6 INT;
DECLARE @teklif4 INT, @teklif5 INT, @teklif6 INT, @teklif7 INT, @teklif8 INT, @teklif9 INT, @teklif10 INT;
DECLARE @siparis3 INT, @siparis4 INT, @siparis5 INT;
DECLARE @sevkiyat3 INT, @sevkiyat4 INT;
DECLARE @kabul3 INT, @kabul4 INT;
DECLARE @kabulKalem2 INT, @kabulKalem3 INT;

-- Ihale 3 (açık, kısmi kalan)
INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
VALUES (N'Melas Alımı', DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 6, GETDATE()), 'a', N'Planlı alım', 2);
SET @ihale3 = SCOPE_IDENTITY();

INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
VALUES (@ihale3, 3, 800, 500);

-- Ihale 4 (kapalı, kalan var)
INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
VALUES (N'Arpa Alımı', DATEADD(DAY, -12, GETDATE()), DATEADD(DAY, -4, GETDATE()), 'k', N'Süre doldu, kalan var', 2);
SET @ihale4 = SCOPE_IDENTITY();

INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
VALUES (@ihale4, 4, 600, 200);

-- Ihale 5 (iptal)
INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
VALUES (N'Yonca Silajı Alımı', DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, 2, GETDATE()), 'i', N'Bütçe revizyonu', 4);
SET @ihale5 = SCOPE_IDENTITY();

INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
VALUES (@ihale5, 9, 900, 900);

-- Ihale 6 (tamamlandı)
INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
VALUES (N'Buğday Silajı Alımı', DATEADD(DAY, -16, GETDATE()), DATEADD(DAY, -9, GETDATE()), 't', N'Tamamlandı', 4);
SET @ihale6 = SCOPE_IDENTITY();

INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
VALUES (@ihale6, 8, 500, 0);

-- Teklifler (İhale 3)
INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale3, 3, 300, 7.10, 2130.00, DATEADD(HOUR, -6, GETDATE()), 's');
SET @teklif4 = SCOPE_IDENTITY();

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale3, 6, 200, 6.95, 1390.00, DATEADD(HOUR, -4, GETDATE()), 'b');
SET @teklif5 = SCOPE_IDENTITY();

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale3, 3, 150, 7.30, 1095.00, DATEADD(HOUR, -2, GETDATE()), 'r');
SET @teklif6 = SCOPE_IDENTITY();

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale3, 6, 100, 7.50, 750.00, DATEADD(HOUR, -1, GETDATE()), 'c');
SET @teklif7 = SCOPE_IDENTITY();

-- Teklifler (İhale 4)
INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale4, 6, 400, 6.40, 2560.00, DATEADD(DAY, -5, GETDATE()), 's');
SET @teklif8 = SCOPE_IDENTITY();

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale4, 3, 200, 6.60, 1320.00, DATEADD(DAY, -5, GETDATE()), 'r');
SET @teklif9 = SCOPE_IDENTITY();

-- Teklifler (İhale 5/6)
INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale5, 3, 400, 7.80, 3120.00, DATEADD(DAY, -3, GETDATE()), 'c');

INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
VALUES (@ihale6, 6, 500, 6.10, 3050.00, DATEADD(DAY, -14, GETDATE()), 's');
SET @teklif10 = SCOPE_IDENTITY();

-- Siparişler (İhale 3 - tamamlandı)
INSERT INTO Siparisler (teklifID, olusturanFirmaID, siparisTarihi, toplamTutar, durum)
VALUES (@teklif4, 2, DATEADD(HOUR, -5, GETDATE()), 2130.00, 't');
SET @siparis3 = SCOPE_IDENTITY();

INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
VALUES (@siparis3, 3, 300, 7.10);

-- Siparişler (İhale 4 - reddedildi)
INSERT INTO Siparisler (teklifID, olusturanFirmaID, siparisTarihi, toplamTutar, durum)
VALUES (@teklif8, 2, DATEADD(DAY, -4, GETDATE()), 2560.00, 'r');
SET @siparis4 = SCOPE_IDENTITY();

INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
VALUES (@siparis4, 4, 400, 6.40);

-- Siparişler (İhale 6 - tamamlandı)
INSERT INTO Siparisler (teklifID, olusturanFirmaID, siparisTarihi, toplamTutar, durum)
VALUES (@teklif10, 4, DATEADD(DAY, -14, GETDATE()), 3050.00, 't');
SET @siparis5 = SCOPE_IDENTITY();

INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
VALUES (@siparis5, 8, 500, 6.10);

-- Sevkiyatlar (Sipariş 3)
INSERT INTO Sevkiyatlar (SiparisID, SevkTarihi, BeklenenTeslim, Durum)
VALUES (@siparis3, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -1, GETDATE()), 't');
SET @sevkiyat3 = SCOPE_IDENTITY();

INSERT INTO SevkiyatKalemleri (SevkiyatID, YemID, MiktarKg)
VALUES (@sevkiyat3, 3, 300);

INSERT INTO Kabul (SevkiyatID, KabulTarihi, Durum)
VALUES (@sevkiyat3, DATEADD(DAY, -1, GETDATE()), 'k');
SET @kabul3 = SCOPE_IDENTITY();

INSERT INTO KabulKalemleri (KabulID, YemID, KabulMiktarKg, IadeMiktarKg)
VALUES (@kabul3, 3, 300, 0);

-- Sevkiyatlar (Sipariş 5 - iade örneği)
INSERT INTO Sevkiyatlar (SiparisID, SevkTarihi, BeklenenTeslim, Durum)
VALUES (@siparis5, DATEADD(DAY, -13, GETDATE()), DATEADD(DAY, -12, GETDATE()), 't');
SET @sevkiyat4 = SCOPE_IDENTITY();

INSERT INTO SevkiyatKalemleri (SevkiyatID, YemID, MiktarKg)
VALUES (@sevkiyat4, 8, 500);

INSERT INTO Kabul (SevkiyatID, KabulTarihi, Durum)
VALUES (@sevkiyat4, DATEADD(DAY, -12, GETDATE()), 'p');
SET @kabul4 = SCOPE_IDENTITY();

INSERT INTO KabulKalemleri (KabulID, YemID, KabulMiktarKg, IadeMiktarKg)
VALUES (@kabul4, 8, 450, 50);
SET @kabulKalem2 = SCOPE_IDENTITY();

INSERT INTO Iade (KabulKalemID, IadeTarihi, IadeMiktarKg, IadeNedeni, IadeDurumu)
VALUES (@kabulKalem2, DATEADD(DAY, -11, GETDATE()), 50, N'Hasarlı ürün', 'a');

-- Ihale durum logları
INSERT INTO IhaleDurumLog (ihaleID, eskiDurum, yeniDurum, yapanKullaniciID, aciklama)
VALUES
(@ihale3, NULL, 'a', 2, N'İhale oluşturuldu'),
(@ihale4, NULL, 'k', 2, N'İhale kapalı başlatıldı'),
(@ihale5, NULL, 'i', 5, N'İhale iptal edildi'),
(@ihale6, NULL, 't', 5, N'İhale tamamlandı');

-- Teklif aksiyon logları
INSERT INTO TeklifAksiyonLog (
  teklifID, ihaleID, tedarikciID, aksiyonTipi, eskiDurum, yeniDurum,
  teklifMiktarKg, birimFiyat, toplamTutar, yapanKullaniciID, aciklama
)
VALUES
(@teklif4, @ihale3, 3, N'sec', 'b', 's', 300, 7.10, 2130.00, 2, N'Çiftçi seçti'),
(@teklif5, @ihale3, 6, N'olustur', NULL, 'b', 200, 6.95, 1390.00, 7, N'Teklif oluşturuldu'),
(@teklif6, @ihale3, 3, N'reddet', 'b', 'r', 150, 7.30, 1095.00, 2, N'Çiftçi reddetti'),
(@teklif7, @ihale3, 6, N'cek', 'b', 'c', 100, 7.50, 750.00, 7, N'Teklif geri çekildi'),
(@teklif8, @ihale4, 6, N'sec', 'b', 's', 400, 6.40, 2560.00, 2, N'Çiftçi seçti'),
(@teklif9, @ihale4, 3, N'reddet', 'b', 'r', 200, 6.60, 1320.00, 2, N'Çiftçi reddetti'),
(@teklif10, @ihale6, 6, N'sec', 'b', 's', 500, 6.10, 3050.00, 5, N'Çiftçi seçti');

-- Depo giriş planları
INSERT INTO DepoGirisPlanlari (
  siparisID, teklifID, ciftciFirmaID, tedarikciID, yemID,
  planlananMiktarKg, planlananGirisTarihi, gerceklesenMiktarKg, kalanMiktarKg, durum, aciklama
)
VALUES
(@siparis3, @teklif4, 2, 3, 3, 300, DATEADD(DAY, -1, GETDATE()), 300, 0, 't', N'Plan tamamlandı'),
(@siparis4, @teklif8, 2, 6, 4, 400, DATEADD(DAY, -3, GETDATE()), 0, 400, 'i', N'Sipariş reddedildi'),
(@siparis5, @teklif10, 4, 6, 8, 500, DATEADD(DAY, -12, GETDATE()), 450, 50, 'k', N'Kısmi kabul');
