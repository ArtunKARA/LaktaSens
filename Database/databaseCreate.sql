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
    birimFiyat DECIMAL(10,2) NULL,
    minSiparisKg DECIMAL(12,2) NULL,
    maxSiparisKg DECIMAL(12,2) NULL,
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


CREATE TABLE RedEdilenBaşvurularYem (
    redEdilenBaşvurularID INT PRIMARY KEY IDENTITY(1,1),
    yemID INT,
    kullaniciID INT,
    redNedeni NVARCHAR(300),
    redTarihi DATE,
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID),
    FOREIGN KEY (kullaniciID) REFERENCES kullanicilar(kullaniciID)
);
GO

CREATE TABLE IslemNedenleri (
    islemNedeniID INT PRIMARY KEY IDENTITY(1,1),
    islemTipi CHAR(1) NOT NULL,           -- 'g' (giriş) veya 'c' (çıkış)
    nedenAdi NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE FirmaDepo (
    depoID INT PRIMARY KEY IDENTITY(1,1),
    firmaID INT,
    yemID INT,
    miktarKg DECIMAL(10,2),          -- Güncel stok miktarı (kg)
    sonGuncellemeTarihi DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID)
);
GO

CREATE TABLE FirmaDepoLog (
    logID INT PRIMARY KEY IDENTITY(1,1),
    firmaID INT NOT NULL,
    yemID INT NOT NULL,
    islemTipi CHAR(1) NOT NULL,          -- 'g' = giriş, 'c' = çıkış
    miktarKg DECIMAL(10,2) NOT NULL,     -- işlem miktarı
    islemTarihi DATETIME DEFAULT GETDATE(),
    kullaniciID INT,                     -- işlemi yapan kullanıcı
    aciklama NVARCHAR(255),              -- açıklama
    islemNedeniID INT NOT NULL,           -- giriş/çıkış nedeni
    kaynakTipi NVARCHAR(20) NULL,         -- Siparis / Sevkiyat / Kabul / Iade vb.
    kaynakID INT NULL,                    -- kaynak kaydın ID'si

    FOREIGN KEY (firmaID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID),
    FOREIGN KEY (kullaniciID) REFERENCES kullanicilar(kullaniciID),
    FOREIGN KEY (islemNedeniID) REFERENCES IslemNedenleri(islemNedeniID)
);
GO

CREATE PROCEDURE sp_YemIslemiEkle
    @firmaID INT,
    @yemID INT,
    @miktarKg DECIMAL(10,2),
    @kullaniciID INT,
    @aciklama NVARCHAR(255),
    @islemNedeniID INT,  -- Sadece neden ID veriyoruz
    @kaynakTipi NVARCHAR(20) = NULL,
    @kaynakID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @mevcutStok DECIMAL(10,2);
    DECLARE @islemTipi CHAR(1);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Neden tablosundan işlem tipi (giriş/çıkış) çekiliyor
        SELECT @islemTipi = islemTipi
        FROM IslemNedenleri
        WHERE islemNedeniID = @islemNedeniID;

        IF @islemTipi IS NULL
        BEGIN
            RAISERROR('Geçersiz işlem nedeni ID!', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Çıkış işlemi ise stok kontrolü yapılır
        IF @islemTipi = 'c'
        BEGIN
            SELECT @mevcutStok = miktarKg
            FROM FirmaDepo
            WHERE firmaID = @firmaID AND yemID = @yemID;

            IF @mevcutStok IS NULL
            BEGIN
                RAISERROR('Bu ürüne ait stok bulunamadı.', 16, 1);
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

        -- Log kaydı yapılır
        INSERT INTO FirmaDepoLog (
            firmaID,
            yemID,
            islemTipi,
            miktarKg,
            kullaniciID,
            aciklama,
            islemNedeniID,
            kaynakTipi,
            kaynakID
        )
        VALUES (
            @firmaID,
            @yemID,
            @islemTipi,
            @miktarKg,
            @kullaniciID,
            @aciklama,
            @islemNedeniID,
            @kaynakTipi,
            @kaynakID
        );

        -- Depo güncellemesi
        IF EXISTS (SELECT 1 FROM FirmaDepo WHERE firmaID = @firmaID AND yemID = @yemID)
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
            IF @islemTipi = 'g'
            BEGIN
                INSERT INTO FirmaDepo (firmaID, yemID, miktarKg, sonGuncellemeTarihi)
                VALUES (@firmaID, @yemID, @miktarKg, GETDATE());
            END
            ELSE
            BEGIN
                RAISERROR('Stok bulunamadı. Çıkış işlemi yapılamaz.', 16, 1);
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


-- Ihale ve Sipariş tabloları
CREATE TABLE Ihaleler (
    ihaleID INT PRIMARY KEY IDENTITY(1,1),
    ihaleAdi NVARCHAR(100),
    ihaleBaslangicTarihi DATETIME,
    ihaleBitisTarihi DATETIME,
    durum CHAR(1), -- -a	Açık (tekliflere açık)
                   -- -k	Kapalı (süre doldu, kazanan henüz seçilmedi)
                   -- -t	Tamamlandı (kazanan seçildi → siparişe dönüştü)
                   -- -i	İptal edildi (ihale iptal edildi)
    CONSTRAINT CK_Ihaleler_Durum CHECK (durum IN ('a', 'k', 't', 'i')),
    aciklama NVARCHAR(500),
    acanFirmaID INT,
    FOREIGN KEY (acanFirmaID) REFERENCES firmalar(firmaID)
);

CREATE TABLE IhaleKalemleri (
    ihaleKalemID INT PRIMARY KEY IDENTITY(1,1),
    ihaleID INT NOT NULL,
    yemID INT NOT NULL,
    talepMiktarKg DECIMAL(12,2) NOT NULL,
    kalanMiktarKg DECIMAL(12,2) NOT NULL,
    CONSTRAINT CK_IhaleKalemleri_Miktar CHECK (
        kalanMiktarKg >= 0 AND kalanMiktarKg <= talepMiktarKg
    ),
    CONSTRAINT UQ_IhaleKalemleri_Ihale UNIQUE (ihaleID),
    FOREIGN KEY (ihaleID) REFERENCES Ihaleler(ihaleID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID)
);

CREATE TABLE Teklifler (
    teklifID INT PRIMARY KEY IDENTITY(1,1),
    ihaleID INT NOT NULL,
    tedarikciID INT NOT NULL,
    teklifMiktarKg DECIMAL(12,2) NOT NULL,
    birimFiyat DECIMAL(10,2) NOT NULL,
    toplamTutar DECIMAL(14,2) NOT NULL,
    teklifTarihi DATETIME NOT NULL,
    durum CHAR(1) NOT NULL,     -- 	b	Beklemede (Çiftçi değerlendirecek)
                                -- 	s	Seçildi (Çiftçi bu teklifi seçti)
                                -- 	r	Reddedildi (Çiftçi bu teklifi reddetti)
                                -- 	c	Çekildi (Tedarikçi teklifi geri çekti)
    CONSTRAINT CK_Teklifler_Durum CHECK (durum IN ('b', 's', 'r', 'c')),
    FOREIGN KEY (ihaleID) REFERENCES Ihaleler(ihaleID),
    FOREIGN KEY (tedarikciID) REFERENCES firmalar(firmaID)
);

CREATE TABLE IhaleDurumLog (
    logID INT PRIMARY KEY IDENTITY(1,1),
    ihaleID INT NOT NULL,
    eskiDurum CHAR(1) NULL,
    yeniDurum CHAR(1) NOT NULL,
    degisiklikTarihi DATETIME NOT NULL DEFAULT GETDATE(),
    yapanKullaniciID INT NULL,
    aciklama NVARCHAR(255) NULL,
    FOREIGN KEY (ihaleID) REFERENCES Ihaleler(ihaleID),
    FOREIGN KEY (yapanKullaniciID) REFERENCES kullanicilar(kullaniciID)
);

CREATE TABLE TeklifAksiyonLog (
    logID INT PRIMARY KEY IDENTITY(1,1),
    teklifID INT NOT NULL,
    ihaleID INT NOT NULL,
    tedarikciID INT NOT NULL,
    aksiyonTipi NVARCHAR(20) NOT NULL,
    eskiDurum CHAR(1) NULL,
    yeniDurum CHAR(1) NULL,
    teklifMiktarKg DECIMAL(12,2) NULL,
    birimFiyat DECIMAL(10,2) NULL,
    toplamTutar DECIMAL(14,2) NULL,
    aksiyonTarihi DATETIME NOT NULL DEFAULT GETDATE(),
    yapanKullaniciID INT NULL,
    aciklama NVARCHAR(255) NULL,
    FOREIGN KEY (teklifID) REFERENCES Teklifler(teklifID),
    FOREIGN KEY (ihaleID) REFERENCES Ihaleler(ihaleID),
    FOREIGN KEY (tedarikciID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (yapanKullaniciID) REFERENCES kullanicilar(kullaniciID)
);

CREATE TABLE Siparisler (
    siparisID INT PRIMARY KEY IDENTITY(1,1),
    teklifID INT,
    tedarikciID INT NULL,
    olusturanFirmaID INT NOT NULL,
    siparisTarihi DATETIME NOT NULL,
    toplamTutar DECIMAL(14,2) NOT NULL,
    kaynakTipi NVARCHAR(20) NULL,   -- ihale / market
    durum CHAR(1) NOT NULL,     -- 	b	Beklemede (tedarikçi onayı bekliyor)
                                -- 	o	Onaylandı (tedarikçi siparişi onayladı)
                                -- 	i	İptal Edildi (çiftçi iptal)
                                -- 	r	Reddedildi (tedarikçi reddetti)
                                -- 	t	Tamamlandı (sipariş teslim edildi)
    CONSTRAINT CK_Siparisler_Durum CHECK (durum IN ('b', 'o', 'i', 'r', 't')),
    FOREIGN KEY (teklifID) REFERENCES Teklifler(teklifID),
    FOREIGN KEY (tedarikciID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (olusturanFirmaID) REFERENCES firmalar(firmaID)
);

CREATE TABLE SiparisKalemleri (
    kalemID INT PRIMARY KEY IDENTITY(1,1),
    siparisID INT NOT NULL,
    yemID INT NOT NULL,
    miktarKg DECIMAL(12,2) NOT NULL,
    birimFiyat DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (siparisID) REFERENCES Siparisler(siparisID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID)
);

CREATE TABLE DepoGirisPlanlari (
    planID INT PRIMARY KEY IDENTITY(1,1),
    siparisID INT NOT NULL,
    teklifID INT NULL,
    ciftciFirmaID INT NOT NULL,
    tedarikciID INT NOT NULL,
    yemID INT NOT NULL,
    planlananMiktarKg DECIMAL(12,2) NOT NULL,
    planlananGirisTarihi DATETIME NOT NULL,
    gerceklesenMiktarKg DECIMAL(12,2) NOT NULL DEFAULT 0,
    kalanMiktarKg DECIMAL(12,2) NOT NULL,
    durum CHAR(1) NOT NULL DEFAULT 'p', -- p: plan, k: kısmi, t: tamam, i: iptal
    CONSTRAINT CK_DepoGirisPlanlari_Durum CHECK (durum IN ('p','k','t','i')),
    olusturmaTarihi DATETIME NOT NULL DEFAULT GETDATE(),
    guncellemeTarihi DATETIME NULL,
    aciklama NVARCHAR(255) NULL,
    FOREIGN KEY (siparisID) REFERENCES Siparisler(siparisID),
    FOREIGN KEY (teklifID) REFERENCES Teklifler(teklifID),
    FOREIGN KEY (ciftciFirmaID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (tedarikciID) REFERENCES firmalar(firmaID),
    FOREIGN KEY (yemID) REFERENCES YemMaddeleri(yemID)
);

CREATE TABLE SiparisDurumLog (
    logID INT PRIMARY KEY IDENTITY(1,1),
    siparisID INT NOT NULL,
    eskiDurum CHAR(1) NULL,          -- Önceki durum (null olabilir)
    yeniDurum CHAR(1) NOT NULL,      -- Yeni durum
    degisiklikTarihi DATETIME NOT NULL DEFAULT GETDATE(),
    yapanKullaniciID INT NOT NULL,   -- Durumu değiştiren kullanıcı
    FOREIGN KEY (siparisID) REFERENCES Siparisler(siparisID),
    FOREIGN KEY (yapanKullaniciID) REFERENCES kullanicilar(kullaniciID)
);

CREATE PROCEDURE sp_SiparisDurumGuncelle
    @siparisID INT,
    @yeniDurum CHAR(1),
    @yapanKullaniciID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @eskiDurum CHAR(1);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Önceki durumu al
        SELECT @eskiDurum = durum
        FROM Siparisler
        WHERE siparisID = @siparisID;

        -- Durumu güncelle
        UPDATE Siparisler
        SET durum = @yeniDurum
        WHERE siparisID = @siparisID;

        -- Log kaydı ekle
        INSERT INTO SiparisDurumLog (siparisID, eskiDurum, yeniDurum, degisiklikTarihi, yapanKullaniciID)
        VALUES (@siparisID, @eskiDurum, @yeniDurum, GETDATE(), @yapanKullaniciID);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- Sevkiyat ve Kabul tabloları
CREATE TABLE Sevkiyatlar (
    SevkiyatID       INT            IDENTITY(1,1) PRIMARY KEY,
    SiparisID        INT            NOT NULL,
    SevkTarihi       DATETIME       NOT NULL,
    BeklenenTeslim   DATETIME       NOT NULL,
    Durum            CHAR(1)        NOT NULL,           -- h	Hazırlıkta (ambar/üretim hazırlıyor)
                                                        -- y	Yolda (nakliye aracı yola çıktı)
                                                        -- t	Tamamlandı (teslim alındı)
                                                        -- i	İptal Edildi (sevk iptal edildi)
    CONSTRAINT CK_Sevkiyatlar_Durum CHECK (Durum IN ('h','y','t','i')),
    FOREIGN KEY (SiparisID) REFERENCES Siparisler(siparisID)
);

CREATE TABLE SevkiyatKalemleri (
    SevkiyatKalemID  INT            IDENTITY(1,1) PRIMARY KEY,
    SevkiyatID       INT            NOT NULL,
    YemID            INT            NOT NULL,
    MiktarKg         DECIMAL(12,2)  NOT NULL,
    FOREIGN KEY (SevkiyatID) REFERENCES dbo.Sevkiyatlar(SevkiyatID),
    FOREIGN KEY (YemID) REFERENCES dbo.YemMaddeleri(YemID)
);

CREATE TABLE SevkiyatDurumLog (
    LogID            INT            IDENTITY(1,1) PRIMARY KEY,
    SevkiyatID       INT            NOT NULL,
    EskiDurum        CHAR(1)        NULL,               -- Önceki durum (null olabilir)
    YeniDurum        CHAR(1)        NOT NULL,           -- Yeni durum
    DegisiklikTarihi DATETIME       NOT NULL DEFAULT GETDATE(),
    YapanKullaniciID INT            NOT NULL,           -- Durumu değiştiren kullanıcı
    FOREIGN KEY (SevkiyatID) REFERENCES Sevkiyatlar(SevkiyatID),
    FOREIGN KEY (YapanKullaniciID) REFERENCES kullanicilar(kullaniciID)
);

CREATE PROCEDURE sp_SevkiyatDurumGuncelle
    @SevkiyatID INT,
    @YeniDurum CHAR(1),
    @YapanKullaniciID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EskiDurum CHAR(1);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Önceki durumu al
        SELECT @EskiDurum = Durum
        FROM Sevkiyatlar
        WHERE SevkiyatID = @SevkiyatID;

        -- Durumu güncelle
        UPDATE Sevkiyatlar
        SET Durum = @YeniDurum
        WHERE SevkiyatID = @SevkiyatID;

        -- Log kaydı ekle
        INSERT INTO SevkiyatDurumLog (SevkiyatID, EskiDurum, YeniDurum, DegisiklikTarihi, YapanKullaniciID)
        VALUES (@SevkiyatID, @EskiDurum, @YeniDurum, GETDATE(), @YapanKullaniciID);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

CREATE TABLE Kabul (
    KabulID         INT            IDENTITY(1,1) PRIMARY KEY,
    SevkiyatID      INT            NOT NULL,
    KabulTarihi     DATETIME       NOT NULL,
    Durum           CHAR(1)        NOT NULL,            -- k	Tam kabul
                                                        -- p	Parçalı kabul (bazı kalemler kabul edildi)
                                                        -- i	Iade (tüm sevkiyat iade edildi)
    CONSTRAINT CK_Kabul_Durum CHECK (Durum IN ('k','p','i')),
    FOREIGN KEY (SevkiyatID) REFERENCES Sevkiyatlar(SevkiyatID)
);

CREATE TABLE KabulKalemleri (
    KabulKalemID    INT            IDENTITY(1,1) PRIMARY KEY,
    KabulID         INT            NOT NULL,
    YemID           INT            NOT NULL,
    KabulMiktarKg   DECIMAL(12,2)  NOT NULL,
    IadeMiktarKg    DECIMAL(12,2)  NOT NULL DEFAULT 0,
    CONSTRAINT CK_KabulKalemleri_Miktar CHECK (KabulMiktarKg + IadeMiktarKg > 0),
    FOREIGN KEY (KabulID) REFERENCES Kabul(KabulID),
    FOREIGN KEY (YemID) REFERENCES YemMaddeleri(YemID)
);

CREATE TABLE Iade (
    IadeID          INT            IDENTITY(1,1) PRIMARY KEY,
    KabulKalemID    INT            NOT NULL,
    IadeTarihi      DATETIME       NOT NULL,
    IadeMiktarKg    DECIMAL(12,2)  NOT NULL,
    IadeNedeni      NVARCHAR(255)  NOT NULL,           -- İade nedeni açıklaması
    IadeDurumu     CHAR(1)        NOT NULL,         -- a	Alındı (iade kabul edildi)
                                                    -- r	Reddedildi (iade reddedildi)
                                                    -- b	beklemede (iade beklemede)
    CONSTRAINT CK_Iade_Durum CHECK (IadeDurumu IN ('a', 'r', 'b')),
    FOREIGN KEY (KabulKalemID) REFERENCES KabulKalemleri(KabulKalemID)
);

/* DurumKodlari (opsiyonel) */
CREATE TABLE dbo.DurumKodlari (
    Tip        NVARCHAR(20)  NOT NULL,
    Kod        CHAR(1)       NOT NULL,
    Aciklama   NVARCHAR(50)  NOT NULL,
    CONSTRAINT PK_DurumKodlari PRIMARY KEY (Tip,Kod)
);
GO

/* Dosyalar */
CREATE TABLE dbo.Dosyalar (
    DosyaID     INT            IDENTITY(1,1) PRIMARY KEY,
    TabloAdi    NVARCHAR(30)   NOT NULL,
    KayitID     INT            NOT NULL,
    DosyaYol    NVARCHAR(250)  NOT NULL,
    DosyaTipi   NVARCHAR(20)   NOT NULL
);
GO
