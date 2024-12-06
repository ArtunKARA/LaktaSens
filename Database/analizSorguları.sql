-- Sağın Kuru Kalan Gün Analizi
SELECT 
    inekID,
    ad,
    CASE 
        WHEN sonDogurmaTarihi > sonKuruTarihi THEN 'sağımda'
        WHEN sonKuruTarihi > sonDogurmaTarihi THEN 'kuruda'
        ELSE 'Bilinmiyor'
    END AS durum,
    CASE 
        WHEN sonDogurmaTarihi > sonKuruTarihi THEN 
            CASE 
                WHEN DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) > 305 THEN -1
                ELSE 305 - DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) -- Sağımda kalan gün
            END
        WHEN sonKuruTarihi > sonDogurmaTarihi THEN 
            CASE 
                WHEN DATEDIFF(DAY, sonKuruTarihi, GETDATE()) > 60 THEN -1
                ELSE 60 - DATEDIFF(DAY, sonKuruTarihi, GETDATE()) -- Kuruda kalan gün
            END
        ELSE NULL -- Bilinmiyor durumu için NULL döndür
    END AS kalanGun
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1;

-- Servis ve Gebe Kalan Gün Analizi
SELECT 
    inek.inekID,
    inek.ad,
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 'gebe'
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN 'serviste'
        ELSE 'Çıkarılmalı'
    END AS durum,
    
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
            CASE 
                WHEN inek.dollenmeSayisi IS NULL THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                WHEN inek.dollenmeSayisi = 1 THEN 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                WHEN inek.dollenmeSayisi = 2 THEN 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                ELSE -DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
            END
        ELSE NULL
    END AS guncelGunSayisi
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1;
-- Genel Takip tablosu MySQL kodu
USE laktasense;

SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    TIMESTAMPDIFF(YEAR, inek.dogumTarihi, CURDATE()) AS "Yaşı",  -- Yaş hesaplama
    inek.kilo AS "Kilosu",
    
    -- Süt döngüsünün durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 'Sağımda'
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 'Kuruda'
        ELSE 'Bilinmiyor'
    END AS "Süt Döngüsü Durumu",
    
    -- Süt kalan gün durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 
            CASE 
                WHEN 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 
            CASE 
                WHEN 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        ELSE 'Kontrol Edilmeli'
    END AS "Süt Kalan Gün Durumu",

    -- Yavru döngüsünün durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 'Gebe'
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN 'Serviste'
        ELSE 'Çıkarılmalı'
    END AS "Yavru Döngüsü Durumu",

    -- Yavru kalan gün durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 
            CASE 
                WHEN 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
            CASE 
                WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN 'Kontrol Edilmeli'
                WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 'Kontrol Edilmeli'
                WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 'Kontrol Edilmeli'
                WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        ELSE 'Kontrol Edilmeli'
    END AS "Yavru Kalan Gün Durumu"
FROM 
    inek;
-- mssql chat versiyonu
USE laktasens;

SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) AS "Yaşı",  -- Yaş hesaplama
    inek.kilo AS "Kilosu",
    
    -- Süt döngüsünün durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 'Sağımda'
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 'Kuruda'
        ELSE 'Bilinmiyor'
    END AS "Süt Döngüsü Durumu",
    
    -- Süt döngüsünde kalan gün sayısı ve durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE())
        ELSE NULL
    END AS "Süt Kalan Gün Sayısı",
    
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        ELSE 'Normal'
    END AS "Süt Kalan Gün Durumu",

    -- Yavru döngüsünün durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 'Gebe'
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN 'Serviste'
        ELSE 'Çıkarılmalı'
    END AS "Yavru Döngüsü Durumu",

    -- Yavru döngüsünde kalan gün sayısı ve durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
            CASE 
                WHEN inek.dollenmeSayisi IS NULL THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                WHEN inek.dollenmeSayisi = 1 THEN 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                WHEN inek.dollenmeSayisi = 2 THEN 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                ELSE NULL
            END
        ELSE NULL
    END AS "Yavru Kalan Gün Sayısı",

    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) >= 0 THEN 'Normal'
        WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        ELSE 'Normal'
    END AS "Yavru Kalan Gün Durumu"

FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1;



-- çıkarılacak tablosu mysql kodu 
USE laktasense;

SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    
    -- Sebep sütununda gecikme durumu ve döngü adı
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN CONCAT('Sağımda ', 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi), ' gün gecikme')
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi) < 0 THEN CONCAT('Kuruda ', 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi), ' gün gecikme')
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN CONCAT('Gebe ', 280 - DATEDIFF(CURDATE(), inek.sonDollenme), ' gün gecikme')
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
            CASE 
                WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN CONCAT('Gebe ', 280 - DATEDIFF(CURDATE(), inek.sonDollenme), ' gün gecikme')
                WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN CONCAT('Serviste ', 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi), ' gün gecikme')
                WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN CONCAT('Serviste ', 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi), ' gün gecikme')
                WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN CONCAT('Serviste ', 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi), ' gün gecikme')
                ELSE NULL
            END
        ELSE NULL
    END AS "Sebep",

    -- Kalan gün sayısı
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi)
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi) < 0 THEN 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi)
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN 280 - DATEDIFF(CURDATE(), inek.sonDollenme)
        WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi)
        WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi)
        WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi)
        ELSE NULL
    END AS "Sütun"

FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 2
    -- Sadece geçerli bir "Sebep" (gecikme durumu) olan inekleri seçiyoruz
   And (
        (inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0) 
        OR (inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi) < 0)
        OR (inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0)
        OR (inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0)
        OR (inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0)
        OR (inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0)
    )
    AND 
    -- "Sebep" sütununda geçerli bir değer olmalı, NULL olamaz
    (
        CASE 
            WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 1
            WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(CURDATE(), inek.sonKuruTarihi) < 0 THEN 1
            WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN 1
            WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
                 OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
                CASE 
                    WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(CURDATE(), inek.sonDollenme) < 0 THEN 1
                    WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 1
                    WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 1
                    WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(CURDATE(), inek.sonDogurmaTarihi) < 0 THEN 1
                    ELSE 0
                END
            ELSE 0
        END > 0
    );

-- çıkarılacak tablosu chat mssql versiyonu
USE laktasens;

SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    
    -- Gecikme durumunu belirten metin
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 THEN 
            CONCAT('Sağımda ', DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) - 305, ' gün gecikme')
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 THEN 
            CONCAT('Kuruda ', DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) - 60, ' gün gecikme')
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280 THEN 
            CONCAT('Gebe ', DATEDIFF(DAY, inek.sonDollenme, GETDATE()) - 280, ' gün gecikme')
        ELSE NULL
    END AS "Sebep",

    -- Kalan gün sayısı
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE())
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
        ELSE NULL
    END AS "Kalan Gün"

FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1
    AND (
        DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 
        OR DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 
        OR (inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280)
    )
    -- Sebep sütununun NULL olmadığı durumlar
    AND 
    (
        CASE 
            WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 THEN 1
            WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 THEN 1
            WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280 THEN 1
            ELSE NULL
        END IS NOT NULL
    );



    -- yaşam payı hesabı
    SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.kilo AS "Vücut Ağırlığı (kg)",
    
    -- Yaşam Payı Enerji İhtiyacı Hesaplama
    0.086 * 0.75 * inek.kilo AS "Yaşam Payı Enerji İhtiyacı (Mcal)"
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1; -- Kullanıcı ID'si burada belirtiliyor

--kuruda kontrolü
USE laktasens;
SELECT 
    inek.inekID,
    inek.ad,
    'Kuruda' AS durum,
    CASE 
        -- Kalan gün negatifse "Kontrol Edilmeli" mesajı döndürülür
        WHEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        -- Kalan gün pozitifse direkt kalan gün sayısı döndürülür
        ELSE CONCAT(60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()), ' gün kaldı')
    END AS kalanGun
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1 
    AND inek.sonKuruTarihi > inek.sonDogurmaTarihi;

-- sağımda kontrolü
SELECT 
    inekID,
    ad,
    'sağımda' AS durum,
    CASE 
        WHEN DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) > 305 THEN -1
        ELSE 305 - DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) -- Sağımda kalan gün
    END AS kalanGun
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 2
    AND sonDogurmaTarihi > sonKuruTarihi 
    AND DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) <= 305;

--gebe kontrolü
USE laktasens;
SELECT 
    inek.inekID,
    inek.ad,
    CASE 
        WHEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
        ELSE CONCAT(280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()), ' gün kaldı')
    END AS guncelGunSayisi,
    'Gebe' AS durum
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 2 
    AND inek.sonDollenme > inek.sonDogurmaTarihi 
    AND inek.tuttuMu = 'E';

--servis kontrolü
USE laktasens;

SELECT 
    servisteInekler.inekID,
    servisteInekler.ad,
	servisteInekler.kalanGun AS guncelGunSayisi,
	servisteInekler.dollenmeSayisi,
    CASE 
		WHEN servisteInekler.dollenmeSayisi > 2 AND servisteInekler.kalanGun > 127 THEN 'Sürüden Çıkarlmalı'
        WHEN servisteInekler.kalanGun < 0 THEN 'Döllenmeli'
        ELSE 'Serviste'
    END AS durum
FROM 
    (
        SELECT 
            inek.inekID,
            inek.ad,
			inek.dollenmeSayisi,
            CASE 
                WHEN inek.tuttuMu IS NULL THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                WHEN inek.dollenmeSayisi = 1 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) -- 106
                WHEN inek.dollenmeSayisi = 2 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) -- 127
                ELSE -DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
            END AS kalanGun
        FROM 
            inek
        JOIN 
            kullanicilar ON inek.firmaID = kullanicilar.firmaID
        WHERE 
            kullanicilar.kullaniciID = 2
            AND (
                (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
                OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
            )
    ) AS servisteInekler;



--DöllenmeDetaySorgusu Update
UPDATE dollenme
SET 
    tuttuMu = 'H',                   -- Yeni döllenme durumu ('E': Evet, 'H': Hayır)
    dollenmeTarihi = '2024-11-22',   -- Yeni döllenme tarihi
    dollenmeSayisi = dollenmeSayisi + 1    -- Yeni döllenme sayısı
WHERE inekID = 1;                    -- Güncellenecek inekID

-- Güncellenen kayıtları görüntüle
SELECT * 
FROM dollenme;




--İnek detay sorgusu-id, adı, ırkı,süt dongu, yavru döngü, yaşam payı
SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) AS "Yaşı",  -- Yaş hesaplama
    inek.kilo AS "Kilosu",
    
    -- Süt döngüsünün durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 'Sağımda'
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 'Kuruda'
        ELSE 'Bilinmiyor'
    END AS "Süt Döngüsü Durumu",

    -- Yavru döngüsünün durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 'Gebe'
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN 'Serviste'
        ELSE 'Çıkarılmalı'
    END AS "Yavru Döngüsü Durumu",

    -- Yaşam Payı Enerji İhtiyacı
    0.086 * 0.75 * inek.kilo AS "Yaşam Payı Enerji İhtiyacı (Mcal)"
FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 1; -- Kullanıcı ID'si burada belirtiliyor


-- Servisdetay update


-- Çıkarılacaklar Upadate
SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    
    -- Gecikme durumunu belirten metin
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 THEN 
            CONCAT('Sağımda ', DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) - 305, ' gün gecikme')
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 THEN 
            CONCAT('Kuruda ', DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) - 60, ' gün gecikme')
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280 THEN 
            CONCAT('Gebe ', DATEDIFF(DAY, inek.sonDollenme, GETDATE()) - 280, ' gün gecikme')
		WHEN inek.sonDogurmaTarihi > inek.sonDollenme AND inek.tuttuMu = NULL  AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 127 THEN 
            CONCAT('Servis ', DATEDIFF(DAY, inek.sonDollenme, GETDATE()) - 127, ' gün gecikme')
        ELSE NULL
    END AS "Sebep",

    -- Kalan gün sayısı
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE())
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
        ELSE NULL
    END AS "Kalan Gün"

FROM 
    inek
JOIN 
    kullanicilar ON inek.firmaID = kullanicilar.firmaID
WHERE 
    kullanicilar.kullaniciID = 2
    AND (
        DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 
        OR DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 
        OR (inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280)
    )
    -- Sebep sütununun NULL olmadığı durumlar
    AND 
    (
        CASE 
            WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 THEN 1
            WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 THEN 1
            WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280 THEN 1
            ELSE NULL
        END IS NOT NULL
    );


