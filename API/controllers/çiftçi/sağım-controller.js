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
                AND sonDogurmaTarihi > sonKuruTarihi 
                AND DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) <= 305;`
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
