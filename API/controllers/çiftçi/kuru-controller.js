const { poolPromise } = require("../../service/connection.js");

exports.postKuru = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `SELECT 
                inek.inekID,
                inek.ad,
                inek.irk,                
                60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) AS kalanGun,
                CASE 
                    -- Kalan gün negatifse "Kontrol Edilmeli" mesajı döndürülür
                    WHEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                    -- Kalan gün pozitifse direkt kalan gün sayısı döndürülür
                    ELSE 'Kuruda'
                END AS durum
            FROM 
                inek
            JOIN 
                kullanicilar ON inek.firmaID = kullanicilar.firmaID
            WHERE 
                kullanicilar.kullaniciID = @ID
                AND inek.dollenmeSayisi > 0
                AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
                AND inek.sonKuruTarihi > inek.sonDogurmaTarihi;`
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