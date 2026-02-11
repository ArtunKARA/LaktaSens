const { poolPromise } = require("../../../service/connection.js");
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

exports.postSiparisList = async (req, res) => {
  const { tedarikciID, durum, kaynakTipi } = req.body ?? {};
  if (!tedarikciID) return res.status(400).json({ error: 'tedarikciID zorunlu' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        s.siparisID,
        s.teklifID,
        s.tedarikciID AS siparisTedarikciID,
        s.olusturanFirmaID,
        s.siparisTarihi,
        s.toplamTutar,
        s.kaynakTipi,
        s.durum,
        COALESCE(s.tedarikciID, t.tedarikciID) AS tedarikciID,
        cf.firmaAdi AS ciftciFirmaAdi,
        sk.yemID,
        y.yemAdi,
        sk.miktarKg,
        sk.birimFiyat
      FROM Siparisler s
      LEFT JOIN Teklifler t ON s.teklifID = t.teklifID
      INNER JOIN firmalar cf ON s.olusturanFirmaID = cf.firmaID
      INNER JOIN SiparisKalemleri sk ON s.siparisID = sk.siparisID
      INNER JOIN YemMaddeleri y ON sk.yemID = y.yemID
      WHERE COALESCE(s.tedarikciID, t.tedarikciID) = @tedarikciID
    `;

    request.input('tedarikciID', sql.Int, tedarikciID);
    if (durum) {
      query += ' AND s.durum = @durum';
      request.input('durum', sql.Char(1), durum);
    }
    if (kaynakTipi) {
      query += ' AND s.kaynakTipi = @kaynakTipi';
      request.input('kaynakTipi', sql.NVarChar(20), kaynakTipi);
    }

    query += ' ORDER BY s.siparisTarihi DESC';
    const result = await request.query(query);

    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Sipariş listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postSiparisOnay = async (req, res) => {
  const { siparisID, yapanKullaniciID } = req.body ?? {};
  if (!siparisID || !yapanKullaniciID) {
    return res.status(400).json({ error: 'siparisID ve yapanKullaniciID zorunlu' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('siparisID', sql.Int, siparisID)
      .input('yeniDurum', sql.Char(1), 'o')
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID)
      .execute('sp_SiparisDurumGuncelle');

    return res.json({ message: 'Sipariş onaylandı' });
  } catch (error) {
    console.error('Sipariş onaylanamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postSiparisRed = async (req, res) => {
  const { siparisID, yapanKullaniciID } = req.body ?? {};
  if (!siparisID || !yapanKullaniciID) {
    return res.status(400).json({ error: 'siparisID ve yapanKullaniciID zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const siparisResult = await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .query(`
        SELECT
          s.siparisID,
          s.durum AS siparisDurum,
          s.teklifID,
          t.teklifMiktarKg,
          t.ihaleID,
          i.durum AS ihaleDurum,
          i.ihaleBitisTarihi
        FROM Siparisler s
        LEFT JOIN Teklifler t ON s.teklifID = t.teklifID
        LEFT JOIN Ihaleler i ON t.ihaleID = i.ihaleID
        WHERE s.siparisID = @siparisID
      `);

    if (siparisResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    const siparis = siparisResult.recordset[0];
    if (siparis.siparisDurum !== 'b') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Sipariş reddedilebilir durumda değil' });
    }

    await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .input('yeniDurum', sql.Char(1), 'r')
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID)
      .execute('sp_SiparisDurumGuncelle');

    if (siparis.teklifID) {
      await transaction.request()
        .input('teklifID', sql.Int, siparis.teklifID)
        .query(`UPDATE Teklifler SET durum = 'r' WHERE teklifID = @teklifID`);

      await transaction.request()
        .input('ihaleID', sql.Int, siparis.ihaleID)
        .input('teklifMiktarKg', sql.Decimal(12, 2), siparis.teklifMiktarKg)
        .query(`
          UPDATE IhaleKalemleri
          SET kalanMiktarKg = kalanMiktarKg + @teklifMiktarKg
          WHERE ihaleID = @ihaleID
        `);

      if (siparis.ihaleDurum === 't' && siparis.ihaleBitisTarihi >= new Date()) {
        await transaction.request()
          .input('ihaleID', sql.Int, siparis.ihaleID)
          .query(`UPDATE Ihaleler SET durum = 'a' WHERE ihaleID = @ihaleID`);
      }
    }

    await transaction.commit();
    return res.json({ message: 'Sipariş reddedildi' });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Sipariş reddedilemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postSevkiyatOlustur = async (req, res) => {
  const {
    siparisID,
    sevkTarihi,
    beklenenTeslim,
    miktarKg,
    kullaniciID,
    islemNedeniIDSevk
  } = req.body ?? {};

  if (!siparisID || !sevkTarihi || !beklenenTeslim || !miktarKg || !kullaniciID) {
    return res.status(400).json({ error: 'siparisID, sevkTarihi, beklenenTeslim, miktarKg, kullaniciID zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const siparisResult = await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .query(`
        SELECT
          s.siparisID,
          s.durum,
          COALESCE(s.tedarikciID, t.tedarikciID) AS tedarikciID,
          sk.yemID,
          sk.miktarKg AS siparisMiktar
        FROM Siparisler s
        LEFT JOIN Teklifler t ON s.teklifID = t.teklifID
        INNER JOIN SiparisKalemleri sk ON s.siparisID = sk.siparisID
        WHERE s.siparisID = @siparisID
      `);

    if (siparisResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    const siparis = siparisResult.recordset[0];
    if (siparis.durum !== 'o') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Sipariş onaylı değil' });
    }

    const sevkToplamResult = await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .query(`
        SELECT SUM(sk.MiktarKg) AS toplamSevk
        FROM Sevkiyatlar s
        INNER JOIN SevkiyatKalemleri sk ON s.SevkiyatID = sk.SevkiyatID
        WHERE s.SiparisID = @siparisID AND s.Durum <> 'i'
      `);

    const toplamSevk = Number(sevkToplamResult.recordset?.[0]?.toplamSevk || 0);
    const kalan = Number(siparis.siparisMiktar) - toplamSevk;
    if (Number(miktarKg) > kalan) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Sevk miktarı kalan miktarı aşıyor' });
    }

    const sevkInsert = await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .input('sevkTarihi', sql.DateTime, new Date(sevkTarihi))
      .input('beklenenTeslim', sql.DateTime, new Date(beklenenTeslim))
      .input('durum', sql.Char(1), 'h')
      .query(`
        INSERT INTO Sevkiyatlar (SiparisID, SevkTarihi, BeklenenTeslim, Durum)
        OUTPUT INSERTED.SevkiyatID
        VALUES (@siparisID, @sevkTarihi, @beklenenTeslim, @durum)
      `);

    const sevkiyatID = sevkInsert.recordset?.[0]?.SevkiyatID;
    if (!sevkiyatID) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Sevkiyat oluşturulamadı' });
    }

    await transaction.request()
      .input('sevkiyatID', sql.Int, sevkiyatID)
      .input('yemID', sql.Int, siparis.yemID)
      .input('miktarKg', sql.Decimal(12, 2), miktarKg)
      .query(`
        INSERT INTO SevkiyatKalemleri (SevkiyatID, YemID, MiktarKg)
        VALUES (@sevkiyatID, @yemID, @miktarKg)
      `);

    if (islemNedeniIDSevk) {
      await transaction.request()
        .input('firmaID', sql.Int, siparis.tedarikciID)
        .input('yemID', sql.Int, siparis.yemID)
        .input('miktarKg', sql.Decimal(10, 2), miktarKg)
        .input('kullaniciID', sql.Int, kullaniciID)
        .input('aciklama', sql.NVarChar(255), 'Sevk çıkışı')
        .input('islemNedeniID', sql.Int, islemNedeniIDSevk)
        .input('kaynakTipi', sql.NVarChar(20), 'Sevkiyat')
        .input('kaynakID', sql.Int, sevkiyatID)
        .execute('sp_YemIslemiEkle');
    }

    await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .input('planlananGirisTarihi', sql.DateTime, new Date(beklenenTeslim))
      .query(`
        UPDATE DepoGirisPlanlari
        SET planlananGirisTarihi = @planlananGirisTarihi,
            guncellemeTarihi = GETDATE()
        WHERE siparisID = @siparisID
      `);

    await transaction.commit();
    return res.json({ sevkiyatID });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Sevkiyat oluşturulamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postSevkiyatList = async (req, res) => {
  const { tedarikciID, durum, siparisID } = req.body ?? {};
  if (!tedarikciID) return res.status(400).json({ error: 'tedarikciID zorunlu' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        s.SevkiyatID,
        s.SiparisID,
        s.SevkTarihi,
        s.BeklenenTeslim,
        s.Durum,
        sk.YemID,
        y.yemAdi,
        sk.MiktarKg,
        sp.olusturanFirmaID AS ciftciFirmaID,
        cf.firmaAdi AS ciftciFirmaAdi
      FROM Sevkiyatlar s
      INNER JOIN Siparisler sp ON s.SiparisID = sp.siparisID
      LEFT JOIN Teklifler t ON sp.teklifID = t.teklifID
      INNER JOIN SevkiyatKalemleri sk ON s.SevkiyatID = sk.SevkiyatID
      INNER JOIN YemMaddeleri y ON sk.YemID = y.yemID
      INNER JOIN firmalar cf ON sp.olusturanFirmaID = cf.firmaID
      WHERE COALESCE(sp.tedarikciID, t.tedarikciID) = @tedarikciID
    `;

    request.input('tedarikciID', sql.Int, tedarikciID);
    if (durum) {
      query += ' AND s.Durum = @durum';
      request.input('durum', sql.Char(1), durum);
    }
    if (siparisID) {
      query += ' AND s.SiparisID = @siparisID';
      request.input('siparisID', sql.Int, siparisID);
    }

    query += ' ORDER BY s.SevkTarihi DESC';
    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Sevkiyat listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postSevkiyatDurumGuncelle = async (req, res) => {
  const { sevkiyatID, yeniDurum, yapanKullaniciID } = req.body ?? {};
  if (!sevkiyatID || !yeniDurum || !yapanKullaniciID) {
    return res.status(400).json({ error: 'sevkiyatID, yeniDurum, yapanKullaniciID zorunlu' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('SevkiyatID', sql.Int, sevkiyatID)
      .input('YeniDurum', sql.Char(1), yeniDurum)
      .input('YapanKullaniciID', sql.Int, yapanKullaniciID)
      .execute('sp_SevkiyatDurumGuncelle');

    return res.json({ message: 'Sevkiyat durumu güncellendi' });
  } catch (error) {
    console.error('Sevkiyat durumu güncellenemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIadeList = async (req, res) => {
  const { tedarikciID, durum } = req.body ?? {};
  if (!tedarikciID) return res.status(400).json({ error: 'tedarikciID zorunlu' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        i.IadeID,
        i.IadeTarihi,
        i.IadeMiktarKg,
        i.IadeNedeni,
        i.IadeDurumu,
        kk.KabulKalemID,
        kk.KabulMiktarKg,
        kk.IadeMiktarKg,
        k.KabulID,
        s.SevkiyatID,
        s.SiparisID,
        sp.olusturanFirmaID AS ciftciFirmaID,
        cf.firmaAdi AS ciftciFirmaAdi,
        sk.YemID,
        y.yemAdi
      FROM Iade i
      INNER JOIN KabulKalemleri kk ON i.KabulKalemID = kk.KabulKalemID
      INNER JOIN Kabul k ON kk.KabulID = k.KabulID
      INNER JOIN Sevkiyatlar s ON k.SevkiyatID = s.SevkiyatID
      INNER JOIN Siparisler sp ON s.SiparisID = sp.siparisID
      LEFT JOIN Teklifler t ON sp.teklifID = t.teklifID
      INNER JOIN firmalar cf ON sp.olusturanFirmaID = cf.firmaID
      INNER JOIN SevkiyatKalemleri sk ON s.SevkiyatID = sk.SevkiyatID
      INNER JOIN YemMaddeleri y ON sk.YemID = y.yemID
      WHERE COALESCE(sp.tedarikciID, t.tedarikciID) = @tedarikciID
    `;

    request.input('tedarikciID', sql.Int, tedarikciID);
    if (durum) {
      query += ' AND i.IadeDurumu = @durum';
      request.input('durum', sql.Char(1), durum);
    }

    query += ' ORDER BY i.IadeTarihi DESC';
    const result = await request.query(query);

    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('İade listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIadeDurumGuncelle = async (req, res) => {
  const {
    iadeID,
    yeniDurum,
    yapanKullaniciID,
    islemNedeniIDIadeCiftci,
    islemNedeniIDIadeTedarikci
  } = req.body ?? {};

  if (!iadeID || !yeniDurum) {
    return res.status(400).json({ error: 'iadeID ve yeniDurum zorunlu' });
  }
  if (!['a', 'r'].includes(yeniDurum)) {
    return res.status(400).json({ error: 'yeniDurum sadece a veya r olabilir' });
  }

  if (yeniDurum === 'a') {
    if (!yapanKullaniciID || !islemNedeniIDIadeCiftci || !islemNedeniIDIadeTedarikci) {
      return res.status(400).json({ error: 'Onay için yapanKullaniciID, islemNedeniIDIadeCiftci, islemNedeniIDIadeTedarikci zorunlu' });
    }
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const iadeResult = await transaction.request()
      .input('iadeID', sql.Int, iadeID)
      .query(`
        SELECT
          i.IadeID,
          i.IadeDurumu,
          i.IadeMiktarKg,
          kk.KabulKalemID,
          k.KabulID,
          s.SevkiyatID,
          s.SiparisID,
          sp.olusturanFirmaID AS ciftciFirmaID,
          COALESCE(sp.tedarikciID, t.tedarikciID) AS tedarikciID,
          sk.YemID
        FROM Iade i
        INNER JOIN KabulKalemleri kk ON i.KabulKalemID = kk.KabulKalemID
        INNER JOIN Kabul k ON kk.KabulID = k.KabulID
        INNER JOIN Sevkiyatlar s ON k.SevkiyatID = s.SevkiyatID
        INNER JOIN Siparisler sp ON s.SiparisID = sp.siparisID
        LEFT JOIN Teklifler t ON sp.teklifID = t.teklifID
        INNER JOIN SevkiyatKalemleri sk ON s.SevkiyatID = sk.SevkiyatID
        WHERE i.IadeID = @iadeID
      `);

    if (iadeResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'İade bulunamadı' });
    }

    const iade = iadeResult.recordset[0];
    if (iade.IadeDurumu !== 'b') {
      await transaction.rollback();
      return res.status(400).json({ error: 'İade güncellenebilir durumda değil' });
    }

    await transaction.request()
      .input('iadeID', sql.Int, iadeID)
      .input('yeniDurum', sql.Char(1), yeniDurum)
      .query(`
        UPDATE Iade
        SET IadeDurumu = @yeniDurum
        WHERE IadeID = @iadeID
      `);

    if (yeniDurum === 'a') {
      await transaction.request()
        .input('firmaID', sql.Int, iade.ciftciFirmaID)
        .input('yemID', sql.Int, iade.YemID)
        .input('miktarKg', sql.Decimal(10, 2), iade.IadeMiktarKg)
        .input('kullaniciID', sql.Int, yapanKullaniciID)
        .input('aciklama', sql.NVarChar(255), 'İade çıkış')
        .input('islemNedeniID', sql.Int, islemNedeniIDIadeCiftci)
        .input('kaynakTipi', sql.NVarChar(20), 'Iade')
        .input('kaynakID', sql.Int, iadeID)
        .execute('sp_YemIslemiEkle');

      await transaction.request()
        .input('firmaID', sql.Int, iade.tedarikciID)
        .input('yemID', sql.Int, iade.YemID)
        .input('miktarKg', sql.Decimal(10, 2), iade.IadeMiktarKg)
        .input('kullaniciID', sql.Int, yapanKullaniciID)
        .input('aciklama', sql.NVarChar(255), 'İade giriş')
        .input('islemNedeniID', sql.Int, islemNedeniIDIadeTedarikci)
        .input('kaynakTipi', sql.NVarChar(20), 'Iade')
        .input('kaynakID', sql.Int, iadeID)
        .execute('sp_YemIslemiEkle');
    }

    await transaction.commit();
    return res.json({ message: 'İade durumu güncellendi' });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('İade durumu güncellenemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
