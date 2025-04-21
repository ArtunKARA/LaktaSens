const { poolPromise } = require("../../../service/connection.js");

exports.getOlcu = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT [birimID]
                ,[birimAdi]
                ,[aciklama]
            FROM [laktasens].[dbo].[Birimler]
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

exports.postOlcuEkle = async (req, res) => {
    const { birimAdi, aciklama } = req.body;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('birimAdi', birimAdi)
        .input('aciklama', aciklama)
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
  exports.postOlcuGuncele = async (req, res) => {
    const { birimID, birimAdi, aciklama } = req.body;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('birimID', birimID)
        .input('birimAdi', birimAdi)
        .input('aciklama', aciklama)
        .query(`
          UPDATE [laktasens].[dbo].[Birimler]
          SET birimAdi = @birimAdi, aciklama = @aciklama
          WHERE birimID = @birimID
        `);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Kayıt bulunamadı.' });
      }
  
      return res.json({ message: 'Ölçü başarıyla güncellendi.' });
    } catch (error) {
      console.error('Ölçü güncellenirken hata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

exports.postOlcuSil = async (req, res) => {
    const { birimID } = req.body;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('birimID', birimID)
        .query(`
          DELETE FROM [laktasens].[dbo].[Birimler]
          WHERE birimID = @birimID
        `);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Kayıt bulunamadı.' });
      }
  
      return res.json({ message: 'Ölçü başarıyla silindi.' });
    } catch (error) {
      console.error('Ölçü silinirken hata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  exports.getBesinTipleri = async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT t.tipID, t.tipAdi, t.birimID, b.birimAdi, b.aciklama
        FROM [laktasens].[dbo].[BesinTipleri] t
        INNER JOIN [laktasens].[dbo].[Birimler] b ON t.birimID = b.birimID
      `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json([]);
      }
  
      return res.json(result.recordset);
    } catch (error) {
      console.error('Besin tipleri alınamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  exports.postBesinTipiEkle = async (req, res) => {
    const { tipAdi, birimID } = req.body;
  
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('tipAdi', tipAdi)
        .input('birimID', birimID)
        .query(`
          INSERT INTO [laktasens].[dbo].[BesinTipleri] (tipAdi, birimID)
          VALUES (@tipAdi, @birimID)
        `);
  
      return res.status(201).json({ message: 'Besin tipi başarıyla eklendi.' });
    } catch (error) {
      console.error('Besin tipi eklenirken hata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  
  exports.postBesinTipiGuncelle = async (req, res) => {
    const { tipID, tipAdi, birimID } = req.body;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('tipID', tipID)
        .input('tipAdi', tipAdi)
        .input('birimID', birimID)
        .query(`
          UPDATE [laktasens].[dbo].[BesinTipleri]
          SET tipAdi = @tipAdi, birimID = @birimID
          WHERE tipID = @tipID
        `);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Güncellenecek kayıt bulunamadı.' });
      }
  
      return res.json({ message: 'Besin tipi başarıyla güncellendi.' });
    } catch (error) {
      console.error('Besin tipi güncellenirken hata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  
  exports.postBesinTipiSil = async (req, res) => {
    const { tipID } = req.body;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('tipID', tipID)
        .query(`
          DELETE FROM [laktasens].[dbo].[BesinTipleri]
          WHERE tipID = @tipID
        `);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Silinecek kayıt bulunamadı.' });
      }
  
      return res.json({ message: 'Besin tipi başarıyla silindi.' });
    } catch (error) {
      console.error('Besin tipi silinirken hata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  