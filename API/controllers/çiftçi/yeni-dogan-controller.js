const { poolPromise } = require("../../service/connection.js");

exports.postYeniDoganlar = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `SELECT 
              inek.inekID AS "İnekID",
              inek.ad AS "İnekAdı",
              inek.irk AS "Irkı",
			  CONVERT(VARCHAR(10), inek.dogumTarihi, 120) AS "DoğumTarihi",
              DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) AS "Yaşı",  -- Yaş hesaplama
              inek.kilo AS "Kilosu",
              CASE 
                  WHEN DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) < 2 THEN 'Normal'
                  ELSE 'Döllenmeli'
              END AS "Durum"

          FROM 
              inek
          JOIN 
              kullanicilar ON inek.firmaID = kullanicilar.firmaID
          WHERE 
              kullanicilar.kullaniciID = @ID
              AND (inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL);`
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