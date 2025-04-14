const { poolPromise } = require("../../../service/connection.js");
const sql = require('mssql');

exports.postStoklar = async (req, res) => {
    try {
      const { firmaID } = req.body;
  
      if (!firmaID) {
        return res.status(400).json({ error: 'firmaID gerekli' });
      }
  
      const pool = await poolPromise;
  
      const query = `
        SELECT 
          d.yemID,
          y.yemAdi,
          d.miktarKg,
          d.sonGuncellemeTarihi
        FROM FirmaDepo d
        LEFT JOIN YemMaddeleri y ON d.yemID = y.yemID
        WHERE d.firmaID = @firmaID
      `;
  
      const result = await pool.request()
        .input('firmaID', sql.Int, firmaID)
        .query(query);
  
      return res.json(result.recordset);
    } catch (error) {
      console.error('Stoklar alınamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.postYemIslem = async (req, res) => {
    try {
      const { firmaID, yemID, islemTipi, miktarKg, kullaniciID, aciklama } = req.body;
  
      if (!firmaID || !yemID || !islemTipi || !miktarKg || !kullaniciID) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
      }
  
      const pool = await poolPromise;
  
      await pool.request()
        .input('firmaID', sql.Int, firmaID)
        .input('yemID', sql.Int, yemID)
        .input('islemTipi', sql.Char, islemTipi)
        .input('miktarKg', sql.Decimal(10, 2), miktarKg)
        .input('kullaniciID', sql.Int, kullaniciID)
        .input('aciklama', sql.NVarChar(200), aciklama || null)
        .execute('sp_YemIslemiEkle');
  
      return res.json({ success: true, message: 'İşlem başarıyla kaydedildi.' });
    } catch (error) {
      console.error('İşlem yapılamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.postYemLogs = async (req, res) => {
    try {
      const { firmaID } = req.body;
  
      if (!firmaID) {
        return res.status(400).json({ error: 'firmaID gerekli' });
      }
  
      const pool = await poolPromise;
  
      const query = `
        SELECT 
          l.islemTipi,
          l.miktarKg,
          l.islemTarihi,
          l.aciklama,
          y.yemAdi,
          k.kullaniciAdi
        FROM FirmaDepoLog l
        LEFT JOIN YemMaddeleri y ON l.yemID = y.yemID
        LEFT JOIN Kullanici k ON l.kullaniciID = k.kullaniciID
        WHERE l.firmaID = @firmaID
        ORDER BY l.islemTarihi DESC
      `;
  
      const result = await pool.request()
        .input('firmaID', sql.Int, firmaID)
        .query(query);
  
      return res.json(result.recordset);
    } catch (error) {
      console.error('Loglar alınamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };