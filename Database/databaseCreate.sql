-- Veritabanı bağlantısını sonlandır ve ardından veritabanını sil
USE master;
GO

IF DB_ID('laktasens') IS NOT NULL
BEGIN
    ALTER DATABASE laktasens SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE laktasens;
END
GO

-- Yeni veritabanı oluştur
CREATE DATABASE laktasens;
GO

USE laktasens;
GO

GO
/****** Object:  Table [dbo].[bolgeler]    Script Date: 26.09.2022 15:57:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bolgeler](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[SehirIlceMahalleAdi] [nvarchar](max) NULL,
	[UstID] [int] NULL,
	[minlongitude] [nvarchar](max) NULL,
	[minlatitude] [nvarchar](max) NULL,
	[maxlongitude] [nvarchar](max) NULL,
	[maxlatitude] [nvarchar](max) NULL,
	[MahalleID] [nvarchar](max) NULL,
 CONSTRAINT [PK_bolgeler] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Tabloları yeniden oluştur
CREATE TABLE firmalar (
    firmaID INT PRIMARY KEY IDENTITY(1,1),
    firmaAdi NVARCHAR(50),
    firmaTur CHAR(1), --c ciftlik,t - tedarikci
    telefonNo NVARCHAR(10),
    firmaMail NVARCHAR(50),
    firmaAdresi NVARCHAR(250),
    sehirID INT NOT NULL,
    ilceID INT NOT NULL, 
    bolge CHAR(1),
    hesapDurumu CHAR(1), 
    FOREIGN KEY (sehirID) REFERENCES bolgeler(ID),
    FOREIGN KEY (ilceID) REFERENCES bolgeler(ID)
);
GO

CREATE TABLE inek (
    inekID INT PRIMARY KEY IDENTITY(1,1),
    inekQR NVARCHAR(50) UNIQUE,
    ad NVARCHAR(20),
    irk NVARCHAR(20),
    kilo float,
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

CREATE TABLE SürüdenÇıkarma (
    id INT IDENTITY(1,1) PRIMARY KEY,  
    inekID INT NOT NULL,              
    cikarilmaTarihi DATE NOT NULL,     
    cikarilmaSebebi NVARCHAR(255) NOT NULL,  
    FOREIGN KEY (inekID) REFERENCES inek(inekID) ON DELETE CASCADE  
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
    tcNo NVARCHAR(50),
    eposta NVARCHAR(50),
    parola NVARCHAR(50),
    kullaniciTuru CHAR(1), -- a admin,c ciftci,t tedarikçi  
    isim NVARCHAR(50),
    soyisim NVARCHAR(50),
    telefonNo NVARCHAR(10),
    hesapFirmaYetkisi CHAR(1), -- a admin, k kulanıcı 
    hesapDurumu CHAR(1), -- a aktif, p pasif,b beklemede 
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
