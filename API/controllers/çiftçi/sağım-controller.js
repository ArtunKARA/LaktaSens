const { poolPromise } = require("../../service/connection.js");

exports.postSagim = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `SELECT 
                inekID,
                ad,
                irk,
                305 - DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) AS kalanGun,
                CASE 
                    WHEN DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) > 305 
                    THEN 'Kontrol Edilmeli'
                    ELSE 'Sağımda'
                END AS durum
            FROM 
                inek
            JOIN 
                kullanicilar ON inek.firmaID = kullanicilar.firmaID
            WHERE 
                kullanicilar.kullaniciID = @ID
                AND inek.dollenmeSayisi > 0
                AND((inek.sonDogurmaTarihi IS NOT NULL AND inek.sonDollenme IS NOT NULL AND inek.sonKuruTarihi IS NULL)
                OR 
                (NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
                AND sonDogurmaTarihi > sonKuruTarihi ));`
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

exports.postSagimAksiyon = async (req, res) => {
    const { ID, Tarih } = req.body;

    try {
        // Tarih formatını doğrula
        const parsedDate = new Date(Tarih);
        if (isNaN(parsedDate)) {
            return res.status(400).json({ error: "Geçerli bir tarih formatı gönderin (YYYY-MM-DD)." });
        }

        // Tarihi sadece YYYY-MM-DD formatına dönüştür
        const formattedDate = parsedDate.toISOString().split('T')[0];

        const pool = await poolPromise;
        const result = await pool.request()
            .input("ID", ID)
            .input("Tarih", formattedDate)
            .query(
                `UPDATE [laktasens].[dbo].[inek]
                 SET [sonKuruTarihi] = @Tarih
                 WHERE [inekID] = @ID;`
            );

        // Güncelleme sonucunu kontrol et
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "İnek bulunamadı." });
        }

        return res.json({ message: "Güncelleme başarılı." });
    } catch (error) {
        console.error('Güncelleme sırasında hata oluştu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postSutTakip = async (req, res) => {
    const { ID } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ID", ID)
            .query(
                `SELECT TOP 500
                    S.olcumID,
                    I.inekID,
                    I.inekQR,
                    I.ad,
                    I.irk,
                    S.makineID,
                    M.makineAd,
                    S.sutMiktar,
                    S.sagimTarihi,
                    F.firmaAdi,
                    Previous.sutMiktar AS oncekiSutMiktar,
                    Avg7.avgSut,
                    CowTotals.toplamSut,
                    CowTotals.olcumSayisi
                FROM sutOlcum AS S
                INNER JOIN inek AS I ON S.inekID = I.inekID
                INNER JOIN kullanicilar AS K ON I.firmaID = K.firmaID
                INNER JOIN firmalar AS F ON I.firmaID = F.firmaID
                LEFT JOIN sagimMakine AS M ON S.makineID = M.makineID
                OUTER APPLY (
                    SELECT TOP 1 S2.sutMiktar
                    FROM sutOlcum AS S2
                    WHERE S2.inekID = I.inekID
                      AND (
                        S2.sagimTarihi < S.sagimTarihi
                        OR (S2.sagimTarihi = S.sagimTarihi AND S2.olcumID < S.olcumID)
                      )
                    ORDER BY S2.sagimTarihi DESC, S2.olcumID DESC
                ) AS Previous
                OUTER APPLY (
                    SELECT AVG(CAST(X.sutMiktar AS FLOAT)) AS avgSut
                    FROM (
                        SELECT TOP 7 S3.sutMiktar
                        FROM sutOlcum AS S3
                        WHERE S3.inekID = I.inekID
                        ORDER BY S3.sagimTarihi DESC, S3.olcumID DESC
                    ) AS X
                ) AS Avg7
                OUTER APPLY (
                    SELECT
                        SUM(CAST(S4.sutMiktar AS FLOAT)) AS toplamSut,
                        COUNT(1) AS olcumSayisi
                    FROM sutOlcum AS S4
                    WHERE S4.inekID = I.inekID
                ) AS CowTotals
                WHERE K.kullaniciID = @ID
                ORDER BY S.sagimTarihi DESC, S.olcumID DESC;`
            );

        return res.json(result.recordset);
    } catch (error) {
        console.error('Sut takip verisi getirilemedi:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
