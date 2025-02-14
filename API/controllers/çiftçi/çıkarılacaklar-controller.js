const { poolPromise } = require("../../service/connection.js");

exports.postCikarilacaklar = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `       SELECT 
                        inek.inekID AS "İnekID",
                        inek.ad AS "Ad",
                        inek.irk AS "Irkı",
                        inek.dollenmeSayisi AS "DöllenmeSayısı",
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
							WHEN inek.dollenmeSayisi > 2 THEN 
                                CONCAT('Servis ', inek.dollenmeSayisi, ' adet döllneme sayısı')
                            ELSE NULL
                        END AS "Sebep",

						CASE 
                            WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 THEN 
                                'Sağım'
                            WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 THEN 
                                'Servis'
                            WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280 THEN 
                                'Gebe'
                            WHEN inek.sonDogurmaTarihi > inek.sonDollenme AND inek.tuttuMu = NULL  AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 127 THEN 
                                'Servis'
							WHEN inek.dollenmeSayisi > 2 THEN 
                                'Servis'
                            ELSE NULL
                        END AS "AksiyonAlınacakDöngü",

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
                        kullanicilar.kullaniciID = @ID
                        AND inek.dollenmeSayisi > 0
                        AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
                        AND (
                            DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 
                            OR DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 
                            OR (inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280)
							OR (inek.dollenmeSayisi > 2)
                        )
                        -- Sebep sütununun NULL olmadığı durumlar
                        AND 
                        (
							inek.sonDogurmaTarihi > inek.sonKuruTarihi AND DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 305 
							OR inek.sonKuruTarihi > inek.sonDogurmaTarihi AND DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) > 60 
							OR inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND DATEDIFF(DAY, inek.sonDollenme, GETDATE()) > 280
							OR inek.dollenmeSayisi > 2 
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

exports.postCikarilanInek = async (req, res) => {
    const {
        İnekID,
        CikarilmaTarihi,
        CikarilmaSebebi
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("İnekID",İnekID)
        .input("CikarilmaTarihi",CikarilmaTarihi)
        .input("CikarilmaSebebi",CikarilmaSebebi)
        .query(
            `       
                    DECLARE @inekID INT = @İnekID  -- Güncellenecek ve eklenecek inek ID
                    DECLARE @Cikarilma_Tarihi DATE = @CikarilmaTarihi  -- Bugünün tarihi otomatik olarak alınır
                    DECLARE @Cikarilma_Sebebi NVARCHAR(255) = @CikarilmaSebebi  -- Çıkarılma nedeni

                    UPDATE [laktasens].[dbo].[inek]
                    SET [dollenmeSayisi] = 0
                    WHERE [inekID] = @inekID;

                    INSERT INTO [laktasens].[dbo].[SürüdenÇıkarma] ([inekID], [cikarilmaTarihi], [cikarilmaSebebi])
                    VALUES (@inekID, @Cikarilma_Tarihi, @Cikarilma_Sebebi);`
        );
        if (result.rowsAffected[0] === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        console.error(İnekID,CikarilmaSebebi,CikarilmaTarihi);
        return res.status(500).json({ error: "dssdsd" });
        
    }
};

exports.postCikarilanlar = async (req, res) => {
    const {
        firmaID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("firmaID",firmaID)
        .query(
            `SELECT
                i.inekID AS İnekID,
                i.ad AS Ad,
                i.irk AS Irkı,
                CONVERT(varchar, s.cikarilmaTarihi, 23) AS CikarilmaTarihi,
                s.cikarilmaSebebi AS CikarilmaSebebi
            FROM [laktasens].[dbo].[inek] i
            LEFT JOIN [laktasens].[dbo].[SürüdenÇıkarma] s ON i.inekID = s.inekID
            WHERE i.firmaID = @firmaID
            AND i.dollenmeSayisi = 0;`
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