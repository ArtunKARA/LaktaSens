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
FROM inek;

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
FROM inek;
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
USE laktasense;

SELECT 
    inek.inekID AS [İnek ID],
    inek.ad AS [İnek Adı],
    inek.irk AS [Irkı],
    
    -- Yaş hesaplama
    DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) AS [Yaşı],

    inek.kilo AS [Kilosu],
    
    -- Süt döngüsünün durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 'Sağımda'
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 'Kuruda'
        ELSE 'Bilinmiyor'
    END AS [Süt Döngüsü Durumu],
    
    -- Süt kalan gün durumu
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 
            CASE 
                WHEN 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 
            CASE 
                WHEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        ELSE 'Kontrol Edilmeli'
    END AS [Süt Kalan Gün Durumu],

    -- Yavru döngüsünün durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 'Gebe'
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN 'Serviste'
        ELSE 'Çıkarılmalı'
    END AS [Yavru Döngüsü Durumu],

    -- Yavru kalan gün durumu
    CASE 
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 
            CASE 
                WHEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
            CASE 
                WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                ELSE 'Normal'
            END
        ELSE 'Kontrol Edilmeli'
    END AS [Yavru Kalan Gün Durumu]
FROM 
    inek;

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
WHERE 
    -- Sadece geçerli bir "Sebep" (gecikme durumu) olan inekleri seçiyoruz
    (
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
USE laktasense;

SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.irk AS "Irkı",
    
    -- Sebep sütununda gecikme durumu ve döngü adı
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN CONCAT('Sağımda ', 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()), ' gün gecikme')
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN CONCAT('Kuruda ', 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()), ' gün gecikme')
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN CONCAT('Gebe ', 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()), ' gün gecikme')
        WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
             OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
            CASE 
                WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN CONCAT('Gebe ', 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()), ' gün gecikme')
                WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN CONCAT('Serviste ', 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()), ' gün gecikme')
                WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN CONCAT('Serviste ', 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()), ' gün gecikme')
                WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN CONCAT('Serviste ', 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()), ' gün gecikme')
                ELSE NULL
            END
        ELSE NULL
    END AS "Sebep",

    -- Kalan gün sayısı
    CASE 
        WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE())
        WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
        WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
        ELSE NULL
    END AS "Sütun"

FROM 
    inek
WHERE 
    -- Sadece geçerli bir "Sebep" (gecikme durumu) olan inekleri seçiyoruz
    (
        (inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0) 
        OR (inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0)
        OR (inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0)
        OR (inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0)
        OR (inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0)
        OR (inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0)
    )
    AND 
    -- "Sebep" sütununda geçerli bir değer olmalı, NULL olamaz
    (
        CASE 
            WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 1
            WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 1
            WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 1
            WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
                 OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN
                CASE 
                    WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 1
                    WHEN inek.dollenmeSayisi IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 1
                    WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 1
                    WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 1
                    ELSE 0
                END
            ELSE 0
        END > 0
    );
    -- yaşam payı hesabı
    SELECT 
    inek.inekID AS "İnek ID",
    inek.ad AS "İnek Adı",
    inek.kilo AS "Vücut Ağırlığı (kg)",
    
    -- Yaşam Payı Enerji İhtiyacı Hesaplama
    0.086 * 0.75 * inek.kilo AS "Yaşam Payı Enerji İhtiyacı (Mcal)"
FROM 
    inek;

