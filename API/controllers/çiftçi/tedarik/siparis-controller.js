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
  const { firmaID, durum, kaynakTipi } = req.body ?? {};
  if (!firmaID) return res.status(400).json({ error: 'firmaID zorunlu' });

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
        tf.firmaAdi AS tedarikciAdi,
        sk.yemID,
        y.yemAdi,
        sk.miktarKg,
        sk.birimFiyat
      FROM Siparisler s
      LEFT JOIN Teklifler t ON s.teklifID = t.teklifID
      LEFT JOIN firmalar tf ON COALESCE(s.tedarikciID, t.tedarikciID) = tf.firmaID
      INNER JOIN SiparisKalemleri sk ON s.siparisID = sk.siparisID
      INNER JOIN YemMaddeleri y ON sk.yemID = y.yemID
      WHERE s.olusturanFirmaID = @firmaID
    `;

    request.input('firmaID', sql.Int, firmaID);
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

exports.postSiparisIptal = async (req, res) => {
  const { siparisID, yapanKullaniciID } = req.body ?? {};
  if (!siparisID || !yapanKullaniciID) {
    return res.status(400).json({ error: 'siparisID ve yapanKullaniciID zorunlu' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('siparisID', sql.Int, siparisID)
      .input('yeniDurum', sql.Char(1), 'i')
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID)
      .execute('sp_SiparisDurumGuncelle');

    return res.json({ message: 'Sipariş iptal edildi' });
  } catch (error) {
    console.error('Sipariş iptal edilemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postSevkiyatList = async (req, res) => {
  const { siparisID } = req.body ?? {};
  if (!siparisID) return res.status(400).json({ error: 'siparisID zorunlu' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('siparisID', sql.Int, siparisID)
      .query(`
        SELECT
          s.SevkiyatID,
          s.SiparisID,
          s.SevkTarihi,
          s.BeklenenTeslim,
          s.Durum,
          sk.YemID,
          y.yemAdi,
          sk.MiktarKg
        FROM Sevkiyatlar s
        INNER JOIN SevkiyatKalemleri sk ON s.SevkiyatID = sk.SevkiyatID
        INNER JOIN YemMaddeleri y ON sk.YemID = y.yemID
        WHERE s.SiparisID = @siparisID
        ORDER BY s.SevkTarihi DESC
      `);

    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Sevkiyat listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postKabulOlustur = async (req, res) => {
  const {
    sevkiyatID,
    kabulMiktarKg,
    iadeMiktarKg,
    iadeNedeni,
    kabulYapanKullaniciID,
    islemNedeniIDKabul,
    islemNedeniIDIadeCiftci,
    islemNedeniIDIadeTedarikci
  } = req.body ?? {};

  if (!sevkiyatID || kabulMiktarKg == null || iadeMiktarKg == null || !kabulYapanKullaniciID) {
    return res.status(400).json({ error: 'sevkiyatID, kabulMiktarKg, iadeMiktarKg, kabulYapanKullaniciID zorunlu' });
  }

  const toplamTeslim = Number(kabulMiktarKg) + Number(iadeMiktarKg);
  if (toplamTeslim <= 0) {
    return res.status(400).json({ error: 'Toplam teslim miktarı 0 olamaz' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const sevkInfoResult = await transaction.request()
      .input('sevkiyatID', sql.Int, sevkiyatID)
      .query(`
        SELECT
          s.SevkiyatID,
          s.SiparisID,
          sk.YemID,
          sk.MiktarKg,
          sp.olusturanFirmaID AS ciftciFirmaID,
          COALESCE(sp.tedarikciID, t.tedarikciID) AS tedarikciID,
          sp.teklifID AS teklifID
        FROM Sevkiyatlar s
        INNER JOIN SevkiyatKalemleri sk ON s.SevkiyatID = sk.SevkiyatID
        INNER JOIN Siparisler sp ON s.SiparisID = sp.siparisID
        LEFT JOIN Teklifler t ON sp.teklifID = t.teklifID
        WHERE s.SevkiyatID = @sevkiyatID
      `);

    if (sevkInfoResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Sevkiyat bulunamadı' });
    }

    const sevk = sevkInfoResult.recordset[0];
    if (toplamTeslim > Number(sevk.MiktarKg)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teslim miktarı sevk miktarını aşıyor' });
    }

    let kabulDurum = 'k';
    if (Number(iadeMiktarKg) > 0 && Number(kabulMiktarKg) > 0) kabulDurum = 'p';
    else if (Number(kabulMiktarKg) === 0 && Number(iadeMiktarKg) > 0) kabulDurum = 'i';

    const kabulInsert = await transaction.request()
      .input('sevkiyatID', sql.Int, sevkiyatID)
      .input('kabulTarihi', sql.DateTime, new Date())
      .input('durum', sql.Char(1), kabulDurum)
      .query(`
        INSERT INTO Kabul (SevkiyatID, KabulTarihi, Durum)
        OUTPUT INSERTED.KabulID
        VALUES (@sevkiyatID, @kabulTarihi, @durum)
      `);

    const kabulID = kabulInsert.recordset?.[0]?.KabulID;
    if (!kabulID) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Kabul oluşturulamadı' });
    }

    const kabulKalemInsert = await transaction.request()
      .input('kabulID', sql.Int, kabulID)
      .input('yemID', sql.Int, sevk.YemID)
      .input('kabulMiktarKg', sql.Decimal(12, 2), kabulMiktarKg)
      .input('iadeMiktarKg', sql.Decimal(12, 2), iadeMiktarKg)
      .query(`
        INSERT INTO KabulKalemleri (KabulID, YemID, KabulMiktarKg, IadeMiktarKg)
        OUTPUT INSERTED.KabulKalemID
        VALUES (@kabulID, @yemID, @kabulMiktarKg, @iadeMiktarKg)
      `);

    const kabulKalemID = kabulKalemInsert.recordset?.[0]?.KabulKalemID;
    if (!kabulKalemID) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Kabul kalemi oluşturulamadı' });
    }

    if (Number(iadeMiktarKg) > 0) {
      await transaction.request()
        .input('kabulKalemID', sql.Int, kabulKalemID)
        .input('iadeTarihi', sql.DateTime, new Date())
        .input('iadeMiktarKg', sql.Decimal(12, 2), iadeMiktarKg)
        .input('iadeNedeni', sql.NVarChar(255), iadeNedeni || 'Kalite sorunu')
        .input('iadeDurumu', sql.Char(1), 'b')
        .query(`
          INSERT INTO Iade (KabulKalemID, IadeTarihi, IadeMiktarKg, IadeNedeni, IadeDurumu)
          VALUES (@kabulKalemID, @iadeTarihi, @iadeMiktarKg, @iadeNedeni, @iadeDurumu)
        `);
    }

    await transaction.request()
      .input('sevkiyatID', sql.Int, sevkiyatID)
      .input('YeniDurum', sql.Char(1), 't')
      .input('YapanKullaniciID', sql.Int, kabulYapanKullaniciID)
      .execute('sp_SevkiyatDurumGuncelle');

    // Depo giriş/çıkış kayıtları (opsiyonel neden ID'leri ile)
    if (islemNedeniIDKabul && Number(kabulMiktarKg) > 0) {
      await transaction.request()
        .input('firmaID', sql.Int, sevk.ciftciFirmaID)
        .input('yemID', sql.Int, sevk.YemID)
        .input('miktarKg', sql.Decimal(10, 2), kabulMiktarKg)
        .input('kullaniciID', sql.Int, kabulYapanKullaniciID)
        .input('aciklama', sql.NVarChar(255), 'Mal kabul')
        .input('islemNedeniID', sql.Int, islemNedeniIDKabul)
        .input('kaynakTipi', sql.NVarChar(20), 'Kabul')
        .input('kaynakID', sql.Int, kabulID)
        .execute('sp_YemIslemiEkle');
    }

    // Depo giriş planını kısmi teslim/kabul ile güncelle
    const planResult = await transaction.request()
      .input('siparisID', sql.Int, sevk.SiparisID)
      .query(`
        SELECT TOP 1 planID, planlananMiktarKg, gerceklesenMiktarKg
        FROM DepoGirisPlanlari
        WHERE siparisID = @siparisID
        ORDER BY planID DESC
      `);

    if (planResult.recordset.length > 0) {
      const plan = planResult.recordset[0];
      const yeniGerceklesen = Number(plan.gerceklesenMiktarKg || 0) + Number(kabulMiktarKg || 0);
      const planlanan = Number(plan.planlananMiktarKg || 0);
      const yeniKalan = Math.max(planlanan - yeniGerceklesen, 0);
      const yeniDurum = yeniKalan <= 0 ? 't' : (yeniGerceklesen > 0 ? 'k' : 'p');

      await transaction.request()
        .input('planID', sql.Int, plan.planID)
        .input('gerceklesenMiktarKg', sql.Decimal(12, 2), yeniGerceklesen)
        .input('kalanMiktarKg', sql.Decimal(12, 2), yeniKalan)
        .input('durum', sql.Char(1), yeniDurum)
        .query(`
          UPDATE DepoGirisPlanlari
          SET gerceklesenMiktarKg = @gerceklesenMiktarKg,
              kalanMiktarKg = @kalanMiktarKg,
              durum = @durum,
              guncellemeTarihi = GETDATE()
          WHERE planID = @planID
        `);
    } else {
      const siparisMiktarResult = await transaction.request()
        .input('siparisID', sql.Int, sevk.SiparisID)
        .query(`SELECT miktarKg FROM SiparisKalemleri WHERE siparisID = @siparisID`);

      const siparisMiktar = Number(siparisMiktarResult.recordset?.[0]?.miktarKg || 0);
      await transaction.request()
        .input('siparisID', sql.Int, sevk.SiparisID)
        .input('teklifID', sql.Int, sevk.teklifID)
        .input('ciftciFirmaID', sql.Int, sevk.ciftciFirmaID)
        .input('tedarikciID', sql.Int, sevk.tedarikciID)
        .input('yemID', sql.Int, sevk.YemID)
        .input('planlananMiktarKg', sql.Decimal(12, 2), siparisMiktar)
        .input('planlananGirisTarihi', sql.DateTime, new Date())
        .input('gerceklesenMiktarKg', sql.Decimal(12, 2), kabulMiktarKg)
        .input('kalanMiktarKg', sql.Decimal(12, 2), Math.max(siparisMiktar - Number(kabulMiktarKg || 0), 0))
        .input('durum', sql.Char(1), 'k')
        .input('aciklama', sql.NVarChar(255), 'Kabul sırasında plan oluşturuldu')
        .query(`
          INSERT INTO DepoGirisPlanlari (
            siparisID, teklifID, ciftciFirmaID, tedarikciID, yemID,
            planlananMiktarKg, planlananGirisTarihi, gerceklesenMiktarKg, kalanMiktarKg, durum, aciklama
          )
          VALUES (
            @siparisID, @teklifID, @ciftciFirmaID, @tedarikciID, @yemID,
            @planlananMiktarKg, @planlananGirisTarihi, @gerceklesenMiktarKg, @kalanMiktarKg, @durum, @aciklama
          )
        `);
    }

    // Sipariş tamamlandı mı kontrol et (kümülatif kabul)
    const toplamKabulResult = await transaction.request()
      .input('siparisID', sql.Int, sevk.SiparisID)
      .query(`
        SELECT SUM(kk.KabulMiktarKg) AS toplamKabul
        FROM Kabul k
        INNER JOIN KabulKalemleri kk ON k.KabulID = kk.KabulID
        INNER JOIN Sevkiyatlar s ON k.SevkiyatID = s.SevkiyatID
        WHERE s.SiparisID = @siparisID
      `);

    const siparisMiktarResult = await transaction.request()
      .input('siparisID', sql.Int, sevk.SiparisID)
      .query(`SELECT miktarKg FROM SiparisKalemleri WHERE siparisID = @siparisID`);

    const toplamKabul = Number(toplamKabulResult.recordset?.[0]?.toplamKabul || 0);
    const siparisMiktar = Number(siparisMiktarResult.recordset?.[0]?.miktarKg || 0);

    if (siparisMiktar > 0 && toplamKabul >= siparisMiktar) {
      await transaction.request()
        .input('siparisID', sql.Int, sevk.SiparisID)
        .input('yeniDurum', sql.Char(1), 't')
        .input('yapanKullaniciID', sql.Int, kabulYapanKullaniciID)
        .execute('sp_SiparisDurumGuncelle');
    }

    await transaction.commit();
    return res.json({ kabulID });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Kabul oluşturulamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postDepoGirisPlanList = async (req, res) => {
  const { firmaID, siparisID, durum } = req.body ?? {};
  if (!firmaID && !siparisID) {
    return res.status(400).json({ error: 'firmaID veya siparisID zorunlu' });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        p.planID,
        p.siparisID,
        p.teklifID,
        p.ciftciFirmaID,
        cf.firmaAdi AS ciftciFirmaAdi,
        p.tedarikciID,
        tf.firmaAdi AS tedarikciFirmaAdi,
        p.yemID,
        y.yemAdi,
        p.planlananMiktarKg,
        p.planlananGirisTarihi,
        p.gerceklesenMiktarKg,
        p.kalanMiktarKg,
        p.durum,
        p.olusturmaTarihi,
        p.guncellemeTarihi,
        p.aciklama
      FROM DepoGirisPlanlari p
      INNER JOIN firmalar cf ON p.ciftciFirmaID = cf.firmaID
      INNER JOIN firmalar tf ON p.tedarikciID = tf.firmaID
      INNER JOIN YemMaddeleri y ON p.yemID = y.yemID
      WHERE 1=1
    `;

    if (firmaID) {
      query += ' AND p.ciftciFirmaID = @firmaID';
      request.input('firmaID', sql.Int, firmaID);
    }
    if (siparisID) {
      query += ' AND p.siparisID = @siparisID';
      request.input('siparisID', sql.Int, siparisID);
    }
    if (durum) {
      query += ' AND p.durum = @durum';
      request.input('durum', sql.Char(1), durum);
    }

    query += ' ORDER BY p.planlananGirisTarihi DESC';
    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Depo giriş planları alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
