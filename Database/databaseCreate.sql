-- Veritabanı bağlantısını sonlandır ve ardından veritabanını sil
USE master;
GO

IF DB_ID('laktasense') IS NOT NULL
BEGIN
    ALTER DATABASE laktasense SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE laktasense;
END
GO

-- Yeni veritabanı oluştur
CREATE DATABASE laktasense;
GO

USE laktasense;
GO

-- Tabloları yeniden oluştur
CREATE TABLE firmalar (
    firmaID INT PRIMARY KEY IDENTITY(1,1),
    firmaAdi NVARCHAR(50),
    telefonNo NVARCHAR(10),
    firmaAdresi NVARCHAR(250),
    bolge CHAR(1),
    hesapDurumu CHAR(1)
);
GO

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
    tuttuMu CHAR(1),
    sonKuruTarihi DATE,
    sonSutOlcumTarihi DATE,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

CREATE TABLE dogurma (
    dogurmaID INT PRIMARY KEY IDENTITY(1,1),
    dogurmaTarihi DATE,
    inekID INT,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

CREATE TABLE dollenme (
    dollenmeID INT PRIMARY KEY IDENTITY(1,1),
    dollenmeTarihi DATE,
    inekID INT,
    dollenmeSayisi INT,
    tuttuMu CHAR(1),
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

CREATE TABLE kuru (
    kuruID INT PRIMARY KEY IDENTITY(1,1),
    kuruBaslangicTarihi DATE,
    inekID INT,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

CREATE TABLE sutOlcum (
    olcumID INT PRIMARY KEY IDENTITY(1,1),
    makineID INT,
    sutMiktar FLOAT,
    inekID INT,
    sagimTarihi DATE,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);
GO

CREATE TABLE sagimMakine (
    makineID INT PRIMARY KEY IDENTITY(1,1),
    makineAd NVARCHAR(50),
    hazneHacmi FLOAT,
    QR NVARCHAR(50),
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

CREATE TABLE kullanicilar (
    kullaniciID INT PRIMARY KEY IDENTITY(1,1),
    kullaniciAdi NVARCHAR(50),
    eposta NVARCHAR(50),
    parola NVARCHAR(50),
    kullaniciTuru CHAR(1),
    isim NVARCHAR(50),
    soyisim NVARCHAR(50),
    telefonNo NVARCHAR(10),
    hesapDurumu CHAR(1),
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

-- Trigger'ları yeniden oluştur

-- After update trigger for sonDogurmaTarihi
CREATE TRIGGER after_update_sonDogurma
ON inek
AFTER UPDATE
AS
BEGIN
    IF (UPDATE(sonDogurmaTarihi))
    BEGIN
        INSERT INTO dogurma (dogurmaTarihi, inekID)
        SELECT sonDogurmaTarihi, inekID
        FROM inserted
        WHERE sonDogurmaTarihi IS NOT NULL;
    END
END;
GO

-- After update trigger for sonDollenme
CREATE TRIGGER after_update_sonDollenme
ON inek
AFTER UPDATE
AS
BEGIN
    IF (UPDATE(sonDollenme))
    BEGIN
        INSERT INTO dollenme (dollenmeTarihi, inekID, dollenmeSayisi, tuttuMu)
        SELECT sonDollenme, inekID, dollenmeSayisi, tuttuMu
        FROM inserted
        WHERE sonDollenme IS NOT NULL;
    END
END;
GO

-- After update trigger for sonKuruTarihi
CREATE TRIGGER after_update_sonKuruTarihi
ON inek
AFTER UPDATE
AS
BEGIN
    IF (UPDATE(sonKuruTarihi))
    BEGIN
        INSERT INTO kuru (kuruBaslangicTarihi, inekID)
        SELECT sonKuruTarihi, inekID
        FROM inserted
        WHERE sonKuruTarihi IS NOT NULL;
    END
END;
GO
