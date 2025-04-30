const { poolPromise } = require("../../../service/connection.js");
const sql = require('mssql');


exports.postStokListesi = async (req, res) => {
  const { firmaID } = req.body; // Artık body'den alıyoruz

  try {
      const pool = await poolPromise;
      const request = pool.request();

      let query = `
          USE laktasens; -- veya kendi database'ini kullan
          SELECT 
              fd.depoID,
              fd.firmaID,
              fd.yemID,
              ym.yemAdi, -- yem adını da çekiyoruz
              fd.miktarKg,
              fd.sonGuncellemeTarihi
          FROM FirmaDepo fd
          LEFT JOIN YemMaddeleri ym ON fd.yemID = ym.yemID
      `;

      if (firmaID) {
          query += ` WHERE fd.firmaID = @firmaID`;
          request.input('firmaID', firmaID);
      }

      const result = await request.query(query);

      if (result.recordset.length === 0) {
          return res.status(404).json({ message: 'Stok bulunamadı.' });
      }

      return res.json(result.recordset);
  } catch (error) {
      console.error('Stok listesi alınamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};