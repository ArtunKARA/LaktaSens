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