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