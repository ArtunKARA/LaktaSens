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

INSERT INTO YemMaddeleri (yemAdi, ozelYem, durum, yemFirmaID, aciklama)
VALUES 
('Mısır Silajı', 0, 'a', NULL, 'Standart veri kaynağından'),
('Çayır Kuru Otu', 0, 'a', NULL, 'Standart veri kaynağından'),
('Melas', 0, 'a', NULL, 'Standart veri kaynağından'),
('Arpa', 0, 'a', NULL, 'Standart veri kaynağından'),
('PTK', 0, 'a', NULL, 'Standart veri kaynağından'),
('Kireç Taşı', 0, 'a', NULL, 'Standart veri kaynağından'),
('DCP', 0, 'a', NULL, 'Standart veri kaynağından');

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
