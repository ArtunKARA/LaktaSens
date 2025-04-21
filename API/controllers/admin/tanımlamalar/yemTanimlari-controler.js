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
            CASE ym.durum
              WHEN 'a' THEN 'Aktif'
              WHEN 'p' THEN 'Pasif'
              WHEN 'b' THEN 'Beklemede'
              ELSE 'Bilinmiyor'
            END AS durum,
            ym.yemFirmaID,
            f.firmaAdi,
            ym.aciklama AS yemAciklama
          FROM YemMaddeleri ym
          LEFT JOIN firmalar f 
            ON ym.yemFirmaID = f.firmaID
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
  
    try {
      const pool = await poolPromise;
  
      // 1) Meta veriyi çek
      const metaQuery = `
        SELECT 
          ym.yemID,
          ym.yemAdi,
          ym.ozelYem,
          ym.durum AS durum,
          ym.yemFirmaID,
          f.firmaAdi,
          ym.aciklama AS yemAciklama
        FROM YemMaddeleri ym
        LEFT JOIN firmalar f 
          ON ym.yemFirmaID = f.firmaID
        WHERE ym.yemID = @yemID
      `;
      const metaResult = await pool
        .request()
        .input('yemID', sql.Int, parseInt(yemID, 10))
        .query(metaQuery);
  
      if (metaResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Yem bulunamadı' });
      }
      const yemMeta = metaResult.recordset[0];
  
      // 2) Besin değerlerini çek
      const detayQuery = `
        SELECT 
          ybd.id AS besinDegeriID,
          bt.tipID,
          bt.tipAdi AS besinTipi,
          ybd.miktar,
          bt.birimID,
          b.birimAdi
        FROM YemBesinDegerleri ybd
        LEFT JOIN BesinTipleri bt 
          ON ybd.tipID = bt.tipID
        LEFT JOIN Birimler b 
          ON bt.birimID = b.birimID
        WHERE ybd.yemID = @yemID
      `;
      const detayResult = await pool
        .request()
        .input('yemID', sql.Int, parseInt(yemID, 10))
        .query(detayQuery);
  
      // 3) Tek bir objede birleştir
      const response = {
        ...yemMeta,
        besinDegerleri: detayResult.recordset
      };
  
      return res.json(response);
    } catch (error) {
      console.error('Yem detayı alınamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  catch (error) {
    console.error('Yem detayı alınamadı:', error);
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

    // 1) META bilgisini al
    const metaQuery = `
      SELECT 
        standartID,
        laktasyonDonemi
      FROM BesinIhtiyaciStandartlari
      WHERE standartID = @standartID
    `;
    const metaResult = await pool.request()
      .input('standartID', sql.Int, standartID)
      .query(metaQuery);

    if (metaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Bu standartID için meta veri bulunamadı' });
    }

    const metaData = metaResult.recordset[0];

    // 2) DETAY (besin ihtiyacı) verilerini al
    const detailQuery = `
      SELECT 
        bid.detayID,
        bid.standartID,
        bt.tipID,
        bt.tipAdi AS besinTipi,
        bid.miktar,
        bt.birimID,
        b.birimAdi
      FROM BesinIhtiyacDetay AS bid
      LEFT JOIN BesinTipleri AS bt 
        ON bid.tipID = bt.tipID
      LEFT JOIN Birimler AS b 
        ON bt.birimID = b.birimID
      WHERE bid.standartID = @standartID
    `;
    const detailResult = await pool.request()
      .input('standartID', sql.Int, standartID)
      .query(detailQuery);

    // Eğer detay yoksa boş dizi dönüyoruz
    const details = detailResult.recordset;

    // 3) Birleştirilmiş cevabı dön
    return res.json({
      ...metaData,    // { standartID, laktasyonDonemi }
      details      // [ { detayID, standartID, tipID, besinTipi, miktar, birimID, birimAdi }, … ]
    });

  } catch (error) {
    console.error('Besin ihtiyacı detayları alınamadı:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};