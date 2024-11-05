-- Veritabanı oluşturma
USE master;
ALTER DATABASE laktasense SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE laktasense;

CREATE DATABASE laktasense;
GO

USE laktasense;
GO

-- Firmalar tablosu
CREATE TABLE firmalar (
    firmaID INT PRIMARY KEY IDENTITY(1,1),
    ciftlikAdi NVARCHAR(50),
    telefonNo NVARCHAR(10),
    ciftlikAdresi NVARCHAR(250),
    bolge CHAR(1),
    hesapDurumu CHAR(1) CHECK (hesapDurumu IN ('a', 'c', 't')) -- a admin, c çiftçi, t tedarikçi
);
GO

-- İnek tablosu
CREATE TABLE inek (
    inekID INT PRIMARY KEY IDENTITY(1,1),
    inekQR NVARCHAR(50) UNIQUE,
    ad NVARCHAR(20),
    irk NVARCHAR(20),
    dogumTarihi DATE,
    sonDogurmaTarihi DATE,
    firmaID INT,
    anneID INT,
    sonDollenme DATE,
    dollenmeSayisi INT,
    tuttuMu CHAR(1) CHECK (tuttuMu IN ('e', 'h')), -- e evet, h hayır
    sonKuruTarihi DATE, -- Hata burada giderildi
    sonSutOlcumTarihi DATE,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

-- Doğurma tablosu
CREATE TABLE dogurma (
    dogurmaID INT PRIMARY KEY IDENTITY(1,1),
    dogurmaTarihi DATE,
    inekID INT,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

-- Döllenme tablosu
CREATE TABLE dollenme (
    dollenmeID INT PRIMARY KEY IDENTITY(1,1),
    dollenmeTarihi DATE,
    inekID INT,
    dollenmeSayisi INT,
    tuttuMu CHAR(1) CHECK (tuttuMu IN ('e', 'h')), -- e evet, h hayır
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

-- Kuru tablosu
CREATE TABLE kuru (
    kuruID INT PRIMARY KEY IDENTITY(1,1),
    kuruBaslangicTarihi DATE,
    inekID INT,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

-- Süt Ölçüm tablosu
CREATE TABLE sutOlcum (
    olcumID INT PRIMARY KEY IDENTITY(1,1),
    makineID INT,
    sutMiktar FLOAT,
    inekID INT,
    sagimTarihi DATE,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

-- Sağım Makinesi tablosu
CREATE TABLE sagimMakine (
    makineID INT PRIMARY KEY IDENTITY(1,1),
    makineAd NVARCHAR(50),
    hazneHacmi FLOAT,
    QR NVARCHAR(50),
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

-- Kullanıcılar tablosu
CREATE TABLE kullanicilar (
    kullaniciID INT PRIMARY KEY IDENTITY(1,1),
    kullaniciAdi NVARCHAR(50),
    eposta NVARCHAR(50),
    parola NVARCHAR(50),
    kullaniciTuru CHAR(1),
    isim NVARCHAR(50),
    soyisim NVARCHAR(50),
    telefonNo NVARCHAR(10),
    onayDurumu CHAR(1) CHECK (onayDurumu IN ('a', 'r', 'b')), -- a aktif, r reddedilen, b beklemede
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

-- Firmalar tablosuna veri ekleme
INSERT INTO firmalar (ciftlikAdi, telefonNo, ciftlikAdresi, bolge, hesapDurumu) VALUES
('Çiftlik A', '1234567890', 'Adres 1, Şehir', 'A', 'A'),
('Çiftlik B', '0987654321', 'Adres 2, Şehir', 'B', 'A');
GO
-- İnek tablosuna veri ekleme
INSERT INTO inek (inekQR, ad, irk, dogumTarihi, sonDogurmaTarihi, firmaID, anneID, sonDollenme, dollenmeSayisi, tuttuMu, sonKuruTarihi, sonSutOlcumTarihi) VALUES
('QR123', 'Ayla', 'Holstein', '2020-01-15', '2024-10-21', 1, NULL, '2024-01-15', 1, 'E', '2024-08-22', '2024-08-22'),
('QR124', 'Zeytin', 'Jersey', '2019-03-22', '2023-11-27', 1, NULL, '2024-02-20', 1, 'E', '2024-09-27', '2024-09-27'),
('QR125', 'Mavi', 'Ayrshire', '2018-05-30', '2024-04-05', 1, NULL, '2024-06-29', 1, 'E', '2024-02-05', '2024-02-05'),
('QR126', 'Mavi', 'Angus', '2018-05-30', '2024-08-31', 1, NULL, '2023-11-25', 1, 'H', '2024-06-30', '2024-06-30'),
('QR127', 'Mavi', 'Ayrshire', '2018-05-30', '2024-06-31', 1, NULL, '2023-09-25', 1, 'H', '2024-05-01', '2024-05-01');
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
('2024-06-31', 5),
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
('2002-10-22', 2),
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
(2, 5, 1, '2022-10-20');

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
(2, 6, 2, '2022-10-20');

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
(2, 8, 3, '2022-10-20');

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
(1, 9, 4, '2024-10-22'),
(1, 9, 4, '2024-10-21'),
(2, 9, 4, '2022-10-20');

(1, 10, 5, '2024-11-01'),
(1, 9, 5, '2024-10-31'),
(1, 9, 5, '2024-10-30'),
(2, 10, 5, '2024-10-29'),
(1, 9, 5, '2024-10-28'),
(1, 10, 5, '2024-10-27'),
(2, 10, 5, '2024-10-26'),
(1, 9, 5, '2024-10-25'),
(1, 9, 5, '2024-10-24'),
(2, 9, 5, '2024-10-23'),
(1, 9, 5, '2024-10-22'),
(1, 9, 5, '2024-10-21'),
(2, 9, 5, '2022-10-20');
GO
-- Sağım Makinesi tablosuna veri ekleme
INSERT INTO sagimMakine (makineAd, hazneHacmi, QR, firmaID) VALUES
('Makine 1', 15, 'QR_MK1', 1),
('Makine 2', 10, 'QR_MK2', 2);
GO
-- Kullanıcılar tablosuna veri ekleme
INSERT INTO kullanicilar (kullaniciAdi, eposta, parola, kullaniciTuru, isim, soyisim, telefonNo, onayDurumu, firmaID) VALUES
('kullanici1', 'kullanici1@example.com', 'sifre1', 'A', 'Ali', 'Veli', '1112223333', 'A', 1),
('kullanici2', 'kullanici2@example.com', 'sifre2', 'A', 'Ayşe', 'Yılmaz', '4445556666', 'A', 2);
GO

-- Trigger tanımları
CREATE TRIGGER after_update_sonDogurma
ON inek
AFTER UPDATE
AS
BEGIN
    IF UPDATE(sonDogurmaTarihi)
    BEGIN
        INSERT INTO dogurma (dogurmaTarihi, inekID) 
        SELECT sonDogurmaTarihi, inekID
        FROM inserted;
    END
END;
GO

CREATE TRIGGER after_update_sonDollenme
ON inek
AFTER UPDATE
AS
BEGIN
    IF UPDATE(sonDollenme)
    BEGIN
        INSERT INTO dollenme (dollenmeTarihi, inekID, dollenmeSayisi, tuttuMu) 
        SELECT sonDollenme, inekID, dollenmeSayisi, tuttuMu
        FROM inserted;
    END
END;
GO

CREATE TRIGGER after_update_sonKuruTarihi
ON inek
AFTER UPDATE
AS
BEGIN
    IF UPDATE(sonKuruTarihi)
    BEGIN
        INSERT INTO kuru (kuruBaslangicTarihi, inekID) 
        SELECT sonKuruTarihi, inekID
        FROM inserted;
    END
END;
GO
