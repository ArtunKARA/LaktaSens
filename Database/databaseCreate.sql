-- Veritabanı oluşturma
IF EXISTS(SELECT * FROM sys.databases WHERE name = 'laktasense')
BEGIN
    DROP DATABASE laktasense;
END;
GO

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
    hesapDurumu CHAR(1)
);

-- İnek tablosu
CREATE TABLE inek (
    inekID INT PRIMARY KEY IDENTITY(1,1),
    inekQR NVARCHAR(50) UNIQUE,
    ad NVARCHAR(20),
    irk NVARCHAR(20),
    dogumTarihi DATE,
    sonDogurmaTarihi DATE,
    firmaID INT,
    anneID INT NULL,
    sonDollenme DATE,
    dollenmeSayisi INT,
    tuttuMu CHAR(1),
    sonKuruTarihi DATE,
    sonSutOlcumTarihi DATE,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);

-- Doğurma tablosu
CREATE TABLE dogurma (
    dogurmaID INT PRIMARY KEY IDENTITY(1,1),
    dogurmaTarihi DATE,
    inekID INT,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);

-- Döllenme tablosu
CREATE TABLE dollenme (
    dollenmeID INT PRIMARY KEY IDENTITY(1,1),
    dollenmeTarihi DATE,
    inekID INT,
    dollenmeSayisi INT,
    tuttuMu CHAR(1),
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);

-- Kuru tablosu
CREATE TABLE kuru (
    kuruID INT PRIMARY KEY IDENTITY(1,1),
    kuruBaslangicTarihi DATE,
    inekID INT,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);

-- Süt Ölçüm tablosu
CREATE TABLE sutOlcum (
    olcumID INT PRIMARY KEY IDENTITY(1,1),
    makineID INT,
    sutMiktar FLOAT,
    inekID INT,
    sagimTarihi DATE,
    FOREIGN KEY (inekID) REFERENCES inek(inekID)
);

-- Sağım Makinesi tablosu
CREATE TABLE sagimMakine (
    makineID INT PRIMARY KEY IDENTITY(1,1),
    makineAd NVARCHAR(50),
    hazneHacmi FLOAT,
    QR NVARCHAR(50),
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);

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
    hesapDurumu CHAR(1),
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);

-- MSSQL için tetikleyiciler
-- sonDogurmaTarihi değişiminde tetikleyici
CREATE TRIGGER trgAfterUpdateSonDogurma
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

-- sonDollenme değişiminde tetikleyici
CREATE TRIGGER trgAfterUpdateSonDollenme
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

-- sonKuruTarihi değişiminde tetikleyici
CREATE TRIGGER trgAfterUpdateSonKuruTarihi
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