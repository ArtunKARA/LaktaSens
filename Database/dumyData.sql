-- Firmalar tablosuna veri ekleme
INSERT INTO firmalar (firmaAdi, telefonNo, firmaAdresi, bolge, hesapDurumu) VALUES
(N'Çiftlik A', '1234567890', N'Adres 1, Şehir', 'A', 'A'),
(N'Çiftlik B', '0987654321', N'Adres 2, Şehir', 'B', 'A'),
(N'MaxTedarik', '1234567890', N'Adres 3, Şehir', 'A', 'A');
GO

-- İnek tablosuna veri ekleme
INSERT INTO inek (inekQR, ad, irk, kilo, dogumTarihi, sonDogurmaTarihi, firmaID, anneID, sonDollenme, dollenmeSayisi, tuttuMu, sonKuruTarihi, sonSutOlcumTarihi) VALUES
('QR123', N'Ayla', N'Holstein', 300, '2020-01-15', '2024-10-21', 2, NULL, '2024-01-15', 1, NULL, '2024-08-22', '2024-08-22'),
('QR124', N'Zeytin', N'Jersey', 250, '2019-03-22', '2023-11-27', 2, NULL, '2024-02-20', 1, 'E', '2024-09-27', '2024-09-27'),
('QR125', N'Mavi', N'Ayrshire', 400, '2018-05-30', '2024-04-05', 2, NULL, '2024-06-29', 1, 'E', '2024-02-05', '2024-02-05'),
('QR126', N'Mavi', N'Angus', 350, '2018-05-30', '2024-08-31', 2, NULL, '2023-11-25', 1, 'H', '2024-06-30', '2024-06-30'),
('QR127', N'Mavi', N'Ayrshire', 375, '2018-05-30', '2024-06-30', 2, NULL, '2023-09-25', 2, 'H', '2024-05-01', '2024-05-01');
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
INSERT INTO kullanicilar (kullaniciAdi, eposta, parola, kullaniciTuru, isim, soyisim, telefonNo, hesapDurumu, firmaID)
VALUES
-- Admin Kullanıcısı
('admin1', 'admin1@example.com', 'password123', 'a', 'Ahmet', 'Yılmaz', '5301234567', 'a', 1),

-- Çiftçi Kullanıcıları
('ciftci1', 'ciftci1@example.com', 'password123', 'c', 'Ali', 'Kaya', '5312345678', 'a', 2),
('ciftci2', 'ciftci2@example.com', 'password123', 'c', 'Ayşe', 'Demir', '5323456789', 'p', 2),
('ciftci3', 'ciftci3@example.com', 'password123', 'c', 'Mehmet', 'Çelik', '5334567890', 'b', 2),

-- Tedarikçi Kullanıcıları
('tedarikci1', 'tedarikci1@example.com', 'password123', 't', 'Zeynep', 'Şahin', '5345678901', 'a', 3),
('tedarikci2', 'tedarikci2@example.com', 'password123', 't', 'Fatma', 'Eren', '5356789012', 'p', 3),
('tedarikci3', 'tedarikci3@example.com', 'password123', 't', 'Hakan', 'Koç', '5367890123', 'b', 3);
GO