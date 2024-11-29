const { poolPromise } = require("../../service/connection.js");

exports.postAllGebe = async (req, res) => {
    const {
        id
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("id",id)
        .query(
            `USE laktasens;
                SELECT 
                    inek.inekID,
                    inek.ad,
                    inek.irk,
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
                    kullanicilar.kullaniciID = @id 
                    AND inek.sonDollenme > inek.sonDogurmaTarihi 
                    AND inek.tuttuMu = 'E';
`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
        return res.json(result.recordset[0]);
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};