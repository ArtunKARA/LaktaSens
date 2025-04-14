const { poolPromise } = require("../../../service/connection.js");
const sql = require('mssql');


exports.getYemTanimlari = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { ozelYem } = req.query;

    let query = `
      SELECT 
        ym.yemID,
        ym.yemAdi,
        ym.ozelYem,
        ym.durum,
        ym.yemFirmaID,
        f.firmaAdi,
        ym.aciklama AS yemAciklama
      FROM YemMaddeleri ym
      LEFT JOIN firmalar f ON ym.yemFirmaID = f.firmaID
    `;

    if (ozelYem !== undefined) {
      query += ` WHERE ym.ozelYem = @ozelYem`;
    }

    const request = pool.request();
    if (ozelYem !== undefined) {
      request.input('ozelYem', sql.Bit, ozelYem === '1' ? 1 : 0);
    }

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json(null);
    }

    return res.json(result.recordset);
  } catch (error) {
    console.error('Genel bilgiler alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemTanimlariDetay = async (req, res) => {
  try {
    const { yemID } = req.body;

    if (!yemID) {
      return res.status(400).json({ error: 'yemID gerekli' });
    }

    const pool = await poolPromise;

    const query = `
      SELECT 
        ybd.id AS besinDegeriID,
        bt.tipID,
        bt.tipAdi AS besinTipi,
        ybd.miktar,
        bt.birimID,
        b.birimAdi
      FROM YemBesinDegerleri ybd
      LEFT JOIN BesinTipleri bt ON ybd.tipID = bt.tipID
      LEFT JOIN Birimler b ON bt.birimID = b.birimID
      WHERE ybd.yemID = @yemID
    `;

    const result = await pool.request()
      .input('yemID', sql.Int, yemID)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json([]);
    }

    return res.json(result.recordset);
  } catch (error) {
    console.error('Detaylar alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRasyonDonguler = async (req, res) => {
  try {
    const pool = await poolPromise;

    let query = `
      SELECT  standartID
          ,laktasyonDonemi
      FROM BesinIhtiyaciStandartlari
    `;
    
    const result = await pool.request()
    .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json(null);
    }

    return res.json(result.recordset);
  } catch (error) {
    console.error('Genel bilgiler alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.postRasyonDongulerIhtiyac = async (req, res) => {
  try {
    const { standartID } = req.body;

    if (!standartID) {
      return res.status(400).json({ error: 'standartID gereklidir' });
    }

    const pool = await poolPromise;

    const query = `
      SELECT 
        bid.detayID,
        bid.standartID,
        bt.tipID,
        bt.tipAdi,
        bid.miktar,
        bt.birimID,
        b.birimAdi
      FROM BesinIhtiyacDetay bid
      LEFT JOIN BesinTipleri bt ON bid.tipID = bt.tipID
      LEFT JOIN Birimler b ON bt.birimID = b.birimID
      WHERE bid.standartID = @standartID`;

    const result = await pool.request()
      .input('standartID', sql.Int, standartID)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json([]);
    }

    return res.json(result.recordset);
  } catch (error) {
    console.error('Besin ihtiyacı detayları alınamadı:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};