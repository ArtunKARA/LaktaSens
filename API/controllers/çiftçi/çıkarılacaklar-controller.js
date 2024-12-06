const { poolPromise } = require("../../service/connection.js");

exports.postCikarilacaklar = async (req, res) => {
    const {
        id
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("id",id)
        .query(
            `       SELECT 
                        inek.inekID AS "İnekID",
                        inek.ad AS "Ad",
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
                        END AS "KalanGün"

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
                        );`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};