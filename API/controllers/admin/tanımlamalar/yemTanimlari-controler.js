const { poolPromise } = require("../../../service/connection.js");

exports.getYemTanimlari = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT ym.yemID
                    ,ym.yemAdi
                    ,ym.durum
                FROM YemMaddeleri ym 
                WHERE ym.ozelYem = 0 
            `
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Data could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postYemTanimlariDetay = async (req, res) => {
    const { yemID } = req.body;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('yemID', yemID)
        .query(`
          INSERT INTO [laktasens].[dbo].[Birimler] (birimAdi, aciklama)
          VALUES (@birimAdi, @aciklama)
        `);
  
      return res.status(201).json({ message: 'Ölçü başarıyla eklendi.' });
    } catch (error) {
      console.error('Ölçü eklenirken hata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };