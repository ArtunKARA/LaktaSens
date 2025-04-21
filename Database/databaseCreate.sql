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
    telefonNo NVARCHAR(15),
    firmaMail NVARCHAR(50),
    firmaAdresi NVARCHAR(250),
    sehirID INT NOT NULL,
    ilceID INT NOT NULL, 
    bolge CHAR(1),
    hesapDurumu CHAR(1), -- a aktif, p pasif, b beklemede
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
    telefonNo NVARCHAR(15),
    hesapFirmaYetkisi CHAR(1), -- a admin, k kulanıcı 
    hesapDurumu CHAR(1), -- a aktif, p pasif,b beklemede
    firmaID INT,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID)
);
GO

CREATE TABLE RedEdilenBaşvurularFirmalar (
    redEdilenBaşvurularID INT PRIMARY KEY IDENTITY(1,1),
    firmaID INT,
    kullaniciID INT,
    redNedeni NVARCHAR(300),
    redTarihi DATE,
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (kullaniciID) REFERENCES kullanicilar(kullaniciID)
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


CREATE TABLE Birimler (
    birimID INT PRIMARY KEY IDENTITY(1,1),
    birimAdi NVARCHAR(50),          -- 'kg', 'Mcal/kg', '%', 'g/kg'
    aciklama NVARCHAR(100)          -- 'Kilogram', 'Yüzde kuru madde', vb.
);

CREATE TABLE BesinTipleri (
    tipID INT PRIMARY KEY IDENTITY(1,1),
    tipAdi NVARCHAR(50),            -- 'Enerji', 'Protein', 'Mineral'
    birimID INT,
    FOREIGN KEY (birimID) REFERENCES Birimler(birimID)
);


CREATE TABLE BesinIhtiyaciStandartlari (
    standartID INT PRIMARY KEY IDENTITY(1,1),
    laktasyonDonemi NVARCHAR(50) -- örn: 'zirve', 'kuru', 'gec'
);

CREATE TABLE BesinIhtiyacDetay (
    detayID INT PRIMARY KEY IDENTITY(1,1),
    standartID INT,
    tipID INT,
    miktar DECIMAL(6,2),
    FOREIGN KEY (standartID) REFERENCES BesinIhtiyaciStandartlari(standartID),
    FOREIGN KEY (tipID) REFERENCES BesinTipleri(tipID)
);

CREATE TABLE YemMaddeleri (
    yemID INT PRIMARY KEY IDENTITY(1,1),
    yemAdi NVARCHAR(100),
    ozelYem BIT,                 
    durum CHAR(1),  -- a aktif, p pasif, b beklemede             
    yemFirmaID INT,
    aciklama NVARCHAR(200),
    FOREIGN KEY (yemFirmaID) REFERENCES firmalar(firmaID)
);

CREATE TABLE YemBesinDegerleri (
    id INT PRIMARY KEY IDENTITY(1,1),
    yemID INT,
    tipID INT,                      -- Besin tipi (örn: Enerji, Protein)
    miktar DECIMAL(6,2),           -- Girilen miktar (örn: 12.5)
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID),
    FOREIGN KEY (tipID) REFERENCES BesinTipleri(tipID)
);

CREATE TABLE YemOnayLog (
    logID INT PRIMARY KEY IDENTITY(1,1),
    yemID INT,
    onaylayanKullaniciID INT,
    onayTarihi DATETIME,
    yeniDurum CHAR(1),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID),
    FOREIGN KEY (onaylayanKullaniciID) REFERENCES kullanicilar(kullaniciID)
);

CREATE TABLE FirmaDepo (
    depoID INT PRIMARY KEY IDENTITY(1,1),
    firmaID INT,
    yemID INT,
    miktarKg DECIMAL(10,2),          -- Güncel stok miktarı (kg)
    sonGuncellemeTarihi DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID)
);

CREATE TABLE FirmaDepoLog (
    logID INT PRIMARY KEY IDENTITY(1,1),
    firmaID INT NOT NULL,
    yemID INT NOT NULL,
    islemTipi CHAR(1) NOT NULL,          -- 'g' = giriş, 'c' = çıkış
    miktarKg DECIMAL(10,2) NOT NULL,     -- işlem miktarı
    islemTarihi DATETIME DEFAULT GETDATE(),
    kullaniciID INT,                     -- işlemi yapan kullanıcı
    aciklama NVARCHAR(255),              -- örneğin: “Rasyon tüketimi”, “Tedarik giriş”

    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID),
    FOREIGN KEY (kullaniciID) REFERENCES kullanicilar(kullaniciID)
);

GO 
CREATE PROCEDURE sp_YemIslemiEkle
    @firmaID INT,
    @yemID INT,
    @islemTipi CHAR(1),        -- 'g' veya 'c'
    @miktarKg DECIMAL(10,2),
    @kullaniciID INT,
    @aciklama NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @mevcutStok DECIMAL(10,2);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Stok kontrolü (sadece çıkış için)
        IF @islemTipi = 'c'
        BEGIN
            SELECT @mevcutStok = miktarKg
            FROM FirmaDepo
            WHERE firmaID = @firmaID AND yemID = @yemID;

            IF @mevcutStok IS NULL
            BEGIN
                RAISERROR('Bu yeme ait stok bulunamadı.', 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END

            IF @mevcutStok < @miktarKg
            BEGIN
                RAISERROR('Stok yetersiz! İşlem yapılamadı.', 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END

        -- 2. Log kaydı
        INSERT INTO FirmaDepoLog (firmaID, yemID, islemTipi, miktarKg, kullaniciID, aciklama)
        VALUES (@firmaID, @yemID, @islemTipi, @miktarKg, @kullaniciID, @aciklama);

        -- 3. Depo güncelleme
        IF EXISTS (
            SELECT 1 FROM FirmaDepo WHERE firmaID = @firmaID AND yemID = @yemID
        )
        BEGIN
            UPDATE FirmaDepo
            SET 
                miktarKg = CASE 
                             WHEN @islemTipi = 'g' THEN miktarKg + @miktarKg
                             ELSE miktarKg - @miktarKg
                           END,
                sonGuncellemeTarihi = GETDATE()
            WHERE firmaID = @firmaID AND yemID = @yemID;
        END
        ELSE
        BEGIN
            -- Yalnızca girişse yeni satır oluştur
            IF @islemTipi = 'g'
            BEGIN
                INSERT INTO FirmaDepo (firmaID, yemID, miktarKg)
                VALUES (@firmaID, @yemID, @miktarKg);
            END
            ELSE
            BEGIN
                RAISERROR('Bu yeme ait stok bulunamadı, çıkış yapılamaz.', 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
