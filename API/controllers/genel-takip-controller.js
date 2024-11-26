const { poolPromise } = require("../service/connection.js");

exports.postGenelTakip = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `SELECT
                kullaniciID,
                kullaniciTuru,
                hesapDurumu,
                eposta,
                isim,
                soyisim,
                telefonNo,
                firmaID
                FROM 
                kullanicilar
                WHERE
                eposta = @eposta
                AND parola = @sifre`
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