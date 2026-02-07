const { poolPromise } = require("../../service/connection.js");
const sql = require('mssql');


exports.getYemTanimlari = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { firmaID } = req.query;

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
        ym.birimFiyat,
        ym.minSiparisKg,
        ym.maxSiparisKg,
        ym.aciklama AS yemAciklama
      FROM YemMaddeleri ym
      LEFT JOIN firmalar f
        ON ym.yemFirmaID = f.firmaID
    `;

    const request = pool.request();   // önce request’i oluştur

    /* Parametre verildiyse sorguya WHERE ekle ve değeri tanımla */
    if (firmaID !== undefined) {
      query += ' WHERE f.firmaID = @firmaID';   // veya ym.yemFirmaID = @firmaID
      request.input('firmaID', sql.Int, firmaID); // <‑‑ eksik olan satır
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
        ym.birimFiyat,
        ym.minSiparisKg,
        ym.maxSiparisKg,
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

exports.postYemTanimlariSil = async (req, res) => {
  const yemID = Number(req.body.yemID ?? req.params.yemID);

  // 1) Basit validasyon
  if (!yemID || Number.isNaN(yemID)) {
    return res.status(400).json({ error: 'Geçerli bir yemID gönderin.' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);

    await transaction.begin();               // -------- TRANSACTION START

    // 2) Önce alt tablodaki satırları sil
    await transaction
      .request()
      .input('yemID', sql.Int, yemID)
      .query('DELETE FROM YemBesinDegerleri WHERE yemID = @yemID');

    // 3) Ardından ana kaydı sil
    const result = await transaction
      .request()
      .input('yemID', sql.Int, yemID)
      .query('DELETE FROM YemMaddeleri WHERE yemID = @yemID');

    // result.rowsAffected[0] ana tabloda kaç satır silindiğini verir.
    if (result.rowsAffected[0] === 0) {
      // Besin değerleri silinmiş olsa da ana kayıt yoktu ⇒ tüm operasyonu geri al.
      await transaction.rollback();
      return res.status(404).json({ error: 'Yem bulunamadı, silinemedi.' });
    }

    await transaction.commit();              // -------- TRANSACTION COMMIT
    return res.json({ message: 'Yem başarıyla silindi.' });
  } catch (err) {
    // Bir hata olursa bütün işlemi geri al
    if (transaction?.inTransaction) {
      await transaction.rollback();
    }
    console.error('Yem silinirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemTanimlariGuncele = async (req, res) => {
  const yemID = Number(req.body.yemID);
  const {
    yemAdi,
    ozelYem,
    durum,
    yemFirmaID,
    yemAciklama,
    birimFiyat,
    minSiparisKg,
    maxSiparisKg
  } = req.body ?? {};

  // ---- Basit validasyon ---------------------------------------------------
  if (!yemID || Number.isNaN(yemID))
    return res.status(400).json({ error: 'Geçerli yemID belirtin' });

  if (
    yemAdi === undefined &&
    ozelYem === undefined &&
    durum === undefined &&
    yemFirmaID === undefined &&
    yemAciklama === undefined &&
    birimFiyat === undefined &&
    minSiparisKg === undefined &&
    maxSiparisKg === undefined
  ) {
    return res
      .status(400)
      .json({ error: 'Güncellenecek en az bir alan gönderin' });
  }

  if (ozelYem !== undefined && typeof ozelYem !== 'boolean')
    return res.status(400).json({ error: 'ozelYem true / false olmalı' });

  if (durum !== undefined && typeof durum !== 'string')
    return res.status(400).json({ error: 'durum harf olmalı' });

  if (yemFirmaID !== undefined && Number.isNaN(Number(yemFirmaID)))
    return res.status(400).json({ error: 'yemFirmaID sayısal olmalı' });

  // ---- Dinamik SET listesi hazırlığı --------------------------------------
  const setClauses = [];
  const params = [];

  if (yemAdi !== undefined) {
    setClauses.push('yemAdi = @yemAdi');
    params.push({ name: 'yemAdi', type: sql.NVarChar(255), value: yemAdi });
  }
  if (ozelYem !== undefined) {
    setClauses.push('ozelYem = @ozelYem');
    params.push({ name: 'ozelYem', type: sql.Bit, value: ozelYem });
  }
  if (durum !== undefined) {
    setClauses.push('durum = @durum');
    params.push({ name: 'durum', type: sql.VarChar(1), value: String(durum) });
  }
  if (yemFirmaID !== undefined) {
    setClauses.push('yemFirmaID = @yemFirmaID');
    params.push({
      name: 'yemFirmaID',
      type: sql.Int,
      value: Number(yemFirmaID)
    });
  }
  if (yemAciklama !== undefined) {
    setClauses.push('aciklama = @yemAciklama');
    params.push({
      name: 'yemAciklama',
      type: sql.NVarChar(sql.MAX),
      value: yemAciklama
    });
  }
  if (birimFiyat !== undefined) {
    setClauses.push('birimFiyat = @birimFiyat');
    params.push({
      name: 'birimFiyat',
      type: sql.Decimal(10, 2),
      value: birimFiyat
    });
  }
  if (minSiparisKg !== undefined) {
    setClauses.push('minSiparisKg = @minSiparisKg');
    params.push({
      name: 'minSiparisKg',
      type: sql.Decimal(12, 2),
      value: minSiparisKg
    });
  }
  if (maxSiparisKg !== undefined) {
    setClauses.push('maxSiparisKg = @maxSiparisKg');
    params.push({
      name: 'maxSiparisKg',
      type: sql.Decimal(12, 2),
      value: maxSiparisKg
    });
  }

  const setSql = setClauses.join(', ');

  // ---- Sorgu --------------------------------------------------------------
  try {
    const pool = await poolPromise;
    const reqq = pool.request().input('yemID', sql.Int, yemID);
    params.forEach((p) => reqq.input(p.name, p.type, p.value));

    const result = await reqq.query(`
      UPDATE YemMaddeleri
      SET ${setSql}
      WHERE yemID = @yemID
    `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Yem bulunamadı' });

    return res.json({ message: 'Yem güncellendi' });
  } catch (err) {
    console.error('Yem güncellenirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemTanimlariBesinDegerleriSil = async (req, res) => {
  const besinDegeriID = Number(req.body.besinDegeriID);

  // ---- Validasyon ---------------------------------------------------------
  if (!besinDegeriID || Number.isNaN(besinDegeriID)) {
    return res.status(400).json({ error: 'Geçerli besinDegeriID belirtin' });
  }

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, besinDegeriID)
      .query('DELETE FROM YemBesinDegerleri WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Besin değeri bulunamadı' });
    }

    return res.json({ message: 'Besin değeri silindi' });
  } catch (err) {
    console.error('Besin değeri silinirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemTanimlariOlustur = async (req, res) => {
  const {
    yemAdi,
    ozelYem = false,
    durum = "b",
    yemFirmaID = null,
    yemAciklama = null,
    birimFiyat = null,
    minSiparisKg = null,
    maxSiparisKg = null
  } = req.body ?? {};

  if (!yemAdi || typeof yemAdi !== 'string') {
    return res.status(400).json({ error: 'yemAdi gerekli' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('yemAdi',       sql.NVarChar(255),  yemAdi)
      .input('ozelYem',      sql.Bit,            ozelYem)
      .input('durum',        sql.VarChar(1),        durum)
      .input('yemFirmaID',   sql.Int,            yemFirmaID)
      .input('yemAciklama',  sql.NVarChar(sql.MAX), yemAciklama)
      .input('birimFiyat',   sql.Decimal(10,2),    birimFiyat)
      .input('minSiparisKg', sql.Decimal(12,2),    minSiparisKg)
      .input('maxSiparisKg', sql.Decimal(12,2),    maxSiparisKg)
      .query(`
        INSERT INTO YemMaddeleri (yemAdi, ozelYem, durum, yemFirmaID, birimFiyat, minSiparisKg, maxSiparisKg, aciklama)
        VALUES (@yemAdi, @ozelYem, @durum, @yemFirmaID, @birimFiyat, @minSiparisKg, @maxSiparisKg, @yemAciklama);
        SELECT SCOPE_IDENTITY() AS yemID;
      `);

    const newYemID = result.recordset[0].yemID;
    return res.status(201).json({
      message: 'Yem başarıyla eklendi',
      yemID: newYemID
    });
  } catch (err) {
    console.error('Yem eklenirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemTanimlariBesinDegerleriEkle = async (req, res) => {
  const yemID  = Number(req.body?.yemID);
  const tipID  = Number(req.body?.tipID);
  const miktar = Number(req.body?.miktar);

  // --- Validasyon ----------------------------------------------------------
  if (!yemID || Number.isNaN(yemID))
    return res.status(400).json({ error: 'Geçerli yemID belirtin' });

  if (Number.isNaN(tipID) || Number.isNaN(miktar))
    return res.status(400).json({ error: 'tipID ve miktar sayısal olmalı' });

  try {
    const pool = await poolPromise;

    // Yem var mı?
    const yemCheck = await pool.request()
      .input('yemID', sql.Int, yemID)
      .query('SELECT 1 FROM YemMaddeleri WHERE yemID = @yemID');

    if (yemCheck.recordset.length === 0)
      return res.status(404).json({ error: 'Yem bulunamadı' });

    // Ekleme
    await pool.request()
      .input('yemID',  sql.Int,          yemID)
      .input('tipID',  sql.Int,          tipID)
      .input('miktar', sql.Decimal(18,4), miktar)
      .query(`
        INSERT INTO YemBesinDegerleri (yemID, tipID, miktar)
        VALUES (@yemID, @tipID, @miktar)
      `);

    return res.status(201).json({ message: 'Besin değeri eklendi' });
  } catch (err) {
    console.error('Besin değeri eklenirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemTanimlariBesinDegerleriGuncelle = async (req, res) => {
  const besinDegeriID = Number(req.body.besinDegeriID);
  const { tipID, miktar } = req.body ?? {};

  // ---- Validasyon ---------------------------------------------------------
  if (!besinDegeriID || Number.isNaN(besinDegeriID))
    return res.status(400).json({ error: 'Geçerli besinDegeriID belirtin' });

  if (tipID === undefined && miktar === undefined)
    return res.status(400).json({ error: 'Güncellenecek en az bir alan gönderin' });

  if (tipID !== undefined && Number.isNaN(Number(tipID)))
    return res.status(400).json({ error: 'tipID sayısal olmalı' });

  if (miktar !== undefined && Number.isNaN(Number(miktar)))
    return res.status(400).json({ error: 'miktar sayısal olmalı' });

  // ---- Dinamik SET listesi -------------------------------------------------
  const setClauses = [];
  const params     = [];

  if (tipID !== undefined) {
    setClauses.push('tipID = @tipID');
    params.push({ name: 'tipID', type: sql.Int, value: Number(tipID) });
  }
  if (miktar !== undefined) {
    setClauses.push('miktar = @miktar');
    params.push({ name: 'miktar', type: sql.Decimal(18, 4), value: Number(miktar) });
  }

  const setSql = setClauses.join(', ');

  try {
    const pool = await poolPromise;
    const reqq = pool.request().input('id', sql.Int, besinDegeriID);
    params.forEach(p => reqq.input(p.name, p.type, p.value));

    const result = await reqq.query(`
      UPDATE YemBesinDegerleri
      SET ${setSql}
      WHERE id = @id
    `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Besin değeri bulunamadı' });

    return res.json({ message: 'Besin değeri güncellendi' });
  } catch (err) {
    console.error('Besin değeri güncellenirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYemYenidenBasvurma = async (req, res) => {
  const yemID = Number(req.body.yemID);

  // ---- Validasyon ---------------------------------------------------------
  if (!yemID || Number.isNaN(yemID))
    return res.status(400).json({ error: 'Geçerli yemID belirtin' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('yemID', sql.Int, yemID)
      .query(`
        UPDATE YemMaddeleri
        SET durum = 'b'
        WHERE yemID = @yemID
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Yem bulunamadı' });

    return res.json({ message: 'Yeniden başvuru durumu güncellendi' });
  } catch (err) {
    console.error('Yeniden başvuru güncellenirken hata:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
