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

exports.postIhaleOlustur = async (req, res) => {
  const {
    acanFirmaID,
    ihaleAdi,
    ihaleBaslangicTarihi,
    ihaleBitisTarihi,
    aciklama,
    yemID,
    talepMiktarKg,
    yapanKullaniciID
  } = req.body ?? {};

  if (!acanFirmaID || !yemID || !talepMiktarKg || !ihaleBaslangicTarihi || !ihaleBitisTarihi) {
    return res.status(400).json({ error: 'acanFirmaID, yemID, talepMiktarKg, ihaleBaslangicTarihi, ihaleBitisTarihi zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const ihaleInsert = await transaction.request()
      .input('ihaleAdi', sql.NVarChar(100), ihaleAdi || null)
      .input('ihaleBaslangicTarihi', sql.DateTime, new Date(ihaleBaslangicTarihi))
      .input('ihaleBitisTarihi', sql.DateTime, new Date(ihaleBitisTarihi))
      .input('durum', sql.Char(1), 'a')
      .input('aciklama', sql.NVarChar(500), aciklama || null)
      .input('acanFirmaID', sql.Int, acanFirmaID)
      .query(`
        INSERT INTO Ihaleler (ihaleAdi, ihaleBaslangicTarihi, ihaleBitisTarihi, durum, aciklama, acanFirmaID)
        OUTPUT INSERTED.ihaleID
        VALUES (@ihaleAdi, @ihaleBaslangicTarihi, @ihaleBitisTarihi, @durum, @aciklama, @acanFirmaID)
      `);

    const ihaleID = ihaleInsert.recordset?.[0]?.ihaleID;
    if (!ihaleID) {
      await transaction.rollback();
      return res.status(500).json({ error: 'İhale oluşturulamadı' });
    }

    await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .input('yemID', sql.Int, yemID)
      .input('talepMiktarKg', sql.Decimal(12, 2), talepMiktarKg)
      .input('kalanMiktarKg', sql.Decimal(12, 2), talepMiktarKg)
      .query(`
        INSERT INTO IhaleKalemleri (ihaleID, yemID, talepMiktarKg, kalanMiktarKg)
        VALUES (@ihaleID, @yemID, @talepMiktarKg, @kalanMiktarKg)
      `);

    await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .input('eskiDurum', sql.Char(1), null)
      .input('yeniDurum', sql.Char(1), 'a')
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), 'İhale oluşturuldu')
      .query(`
        INSERT INTO IhaleDurumLog (ihaleID, eskiDurum, yeniDurum, yapanKullaniciID, aciklama)
        VALUES (@ihaleID, @eskiDurum, @yeniDurum, @yapanKullaniciID, @aciklama)
      `);

    await transaction.commit();
    return res.json({ ihaleID });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('İhale oluşturulamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIhaleList = async (req, res) => {
  const { acanFirmaID, durum, baslangicTarihi, bitisTarihi } = req.body ?? {};

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        i.ihaleID,
        i.ihaleAdi,
        i.ihaleBaslangicTarihi,
        i.ihaleBitisTarihi,
        i.durum,
        i.aciklama,
        i.acanFirmaID,
        f.firmaAdi AS acanFirmaAdi,
        k.ihaleKalemID,
        k.yemID,
        y.yemAdi,
        k.talepMiktarKg,
        k.kalanMiktarKg,
        ISNULL(tstats.teklifSayisi, 0) AS teklifSayisi,
        tstats.enDusukBirimFiyat,
        tstats.sonTeklifTarihi
      FROM Ihaleler i
      INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
      INNER JOIN YemMaddeleri y ON k.yemID = y.yemID
      INNER JOIN firmalar f ON i.acanFirmaID = f.firmaID
      OUTER APPLY (
        SELECT
          COUNT(1) AS teklifSayisi,
          MIN(t.birimFiyat) AS enDusukBirimFiyat,
          MAX(t.teklifTarihi) AS sonTeklifTarihi
        FROM Teklifler t
        WHERE t.ihaleID = i.ihaleID
      ) tstats
      WHERE 1=1
    `;

    if (acanFirmaID) {
      query += ' AND i.acanFirmaID = @acanFirmaID';
      request.input('acanFirmaID', sql.Int, acanFirmaID);
    }
    if (durum) {
      query += ' AND i.durum = @durum';
      request.input('durum', sql.Char(1), durum);
    }
    if (baslangicTarihi) {
      const startDate = new Date(baslangicTarihi);
      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Geçersiz baslangicTarihi' });
      }
      query += ' AND i.ihaleBaslangicTarihi >= @baslangicTarihi';
      request.input('baslangicTarihi', sql.DateTime, startDate);
    }
    if (bitisTarihi) {
      const endDate = new Date(bitisTarihi);
      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Geçersiz bitisTarihi' });
      }
      query += ' AND i.ihaleBaslangicTarihi <= @bitisTarihi';
      request.input('bitisTarihi', sql.DateTime, endDate);
    }

    query += ' ORDER BY i.ihaleBaslangicTarihi DESC';

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('İhale listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIhaleDetay = async (req, res) => {
  const { ihaleID } = req.body ?? {};
  if (!ihaleID) return res.status(400).json({ error: 'ihaleID zorunlu' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ihaleID', sql.Int, ihaleID)
      .query(`
        SELECT
          i.ihaleID,
          i.ihaleAdi,
          i.ihaleBaslangicTarihi,
          i.ihaleBitisTarihi,
          i.durum,
          i.aciklama,
          i.acanFirmaID,
          f.firmaAdi AS acanFirmaAdi,
          k.ihaleKalemID,
          k.yemID,
          y.yemAdi,
          k.talepMiktarKg,
          k.kalanMiktarKg
        FROM Ihaleler i
        INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
        INNER JOIN YemMaddeleri y ON k.yemID = y.yemID
        INNER JOIN firmalar f ON i.acanFirmaID = f.firmaID
        WHERE i.ihaleID = @ihaleID
      `);

    if (result.recordset.length === 0) return res.status(404).json(null);
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error('İhale detay alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIhaleDurumGuncelle = async (req, res) => {
  const { ihaleID, durum, yapanKullaniciID, aciklama } = req.body ?? {};
  if (!ihaleID || !durum) return res.status(400).json({ error: 'ihaleID ve durum zorunlu' });
  if (!['a', 'k', 't', 'i'].includes(durum)) {
    return res.status(400).json({ error: 'geçersiz durum' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const ihaleResult = await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .query('SELECT durum FROM Ihaleler WHERE ihaleID = @ihaleID');

    if (ihaleResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'İhale bulunamadı' });
    }

    const eskiDurum = ihaleResult.recordset[0].durum;
    await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .input('durum', sql.Char(1), durum)
      .query('UPDATE Ihaleler SET durum = @durum WHERE ihaleID = @ihaleID');

    await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .input('eskiDurum', sql.Char(1), eskiDurum)
      .input('yeniDurum', sql.Char(1), durum)
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), aciklama || null)
      .query(`
        INSERT INTO IhaleDurumLog (ihaleID, eskiDurum, yeniDurum, yapanKullaniciID, aciklama)
        VALUES (@ihaleID, @eskiDurum, @yeniDurum, @yapanKullaniciID, @aciklama)
      `);

    await transaction.commit();
    return res.json({ message: 'İhale durumu güncellendi' });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('İhale durumu güncellenemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIhaleTeklifList = async (req, res) => {
  const { ihaleID, basariPeriyotAy } = req.body ?? {};
  if (!ihaleID) return res.status(400).json({ error: 'ihaleID zorunlu' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ihaleID', sql.Int, ihaleID)
      .input('basariPeriyotAy', sql.Int, basariPeriyotAy ?? null)
      .query(`
        SELECT
          t.teklifID,
          t.ihaleID,
          t.tedarikciID,
          f.firmaAdi AS tedarikciAdi,
          t.teklifMiktarKg,
          t.birimFiyat,
          t.toplamTutar,
          t.teklifTarihi,
          t.durum,
          ISNULL(sstat.toplamSiparis, 0) AS tedarikciToplamSiparis,
          ISNULL(sstat.tamamlananSiparis, 0) AS tedarikciTamamlananSiparis,
          ISNULL(sstat.ortalamaTeslimGun, 0) AS tedarikciOrtalamaTeslimGun,
          CASE 
            WHEN ISNULL(sstat.toplamSiparis, 0) = 0 THEN 0
            ELSE CAST(100.0 * sstat.tamamlananSiparis / sstat.toplamSiparis AS DECIMAL(5,2))
          END AS tedarikciBasariOrani
        FROM Teklifler t
        INNER JOIN firmalar f ON t.tedarikciID = f.firmaID
        LEFT JOIN (
          SELECT
            t2.tedarikciID,
            COUNT(s.siparisID) AS toplamSiparis,
            SUM(CASE WHEN s.durum = 't' THEN 1 ELSE 0 END) AS tamamlananSiparis,
            AVG(CAST(DATEDIFF(DAY, sv.SevkTarihi, k.KabulTarihi) AS DECIMAL(10,2))) AS ortalamaTeslimGun
          FROM Siparisler s
          INNER JOIN Teklifler t2 ON s.teklifID = t2.teklifID
          LEFT JOIN Sevkiyatlar sv ON s.siparisID = sv.SiparisID
          LEFT JOIN Kabul k ON sv.SevkiyatID = k.SevkiyatID
          WHERE (@basariPeriyotAy IS NULL OR s.siparisTarihi >= DATEADD(MONTH, -@basariPeriyotAy, GETDATE()))
          GROUP BY t2.tedarikciID
        ) sstat ON sstat.tedarikciID = t.tedarikciID
        WHERE t.ihaleID = @ihaleID
        ORDER BY t.teklifTarihi DESC
      `);

    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Teklif listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifSec = async (req, res) => {
  const { teklifID, yapanKullaniciID, tahminiGirisTarihi } = req.body ?? {};
  if (!teklifID) return res.status(400).json({ error: 'teklifID zorunlu' });

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const teklifResult = await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .query(`
        SELECT
          t.teklifID,
          t.ihaleID,
          t.tedarikciID,
          t.teklifMiktarKg,
          t.birimFiyat,
          t.toplamTutar,
          t.durum AS teklifDurum,
          i.durum AS ihaleDurum,
          i.acanFirmaID,
          k.yemID,
          k.kalanMiktarKg
        FROM Teklifler t
        INNER JOIN Ihaleler i ON t.ihaleID = i.ihaleID
        INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
        WHERE t.teklifID = @teklifID
      `);

    if (teklifResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Teklif bulunamadı' });
    }

    const teklif = teklifResult.recordset[0];
    if (teklif.teklifDurum !== 'b') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif seçilebilir durumda değil' });
    }
    if (teklif.ihaleDurum !== 'a') {
      await transaction.rollback();
      return res.status(400).json({ error: 'İhale aktif değil' });
    }
    if (Number(teklif.teklifMiktarKg) > Number(teklif.kalanMiktarKg)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif miktarı kalan miktarı aşıyor' });
    }

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .query(`UPDATE Teklifler SET durum = 's' WHERE teklifID = @teklifID`);

    const yeniKalan = Number(teklif.kalanMiktarKg) - Number(teklif.teklifMiktarKg);
    await transaction.request()
      .input('ihaleID', sql.Int, teklif.ihaleID)
      .input('kalanMiktarKg', sql.Decimal(12, 2), yeniKalan)
      .query(`UPDATE IhaleKalemleri SET kalanMiktarKg = @kalanMiktarKg WHERE ihaleID = @ihaleID`);

    const siparisInsert = await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('tedarikciID', sql.Int, teklif.tedarikciID)
      .input('olusturanFirmaID', sql.Int, teklif.acanFirmaID)
      .input('toplamTutar', sql.Decimal(14, 2), teklif.toplamTutar)
      .input('kaynakTipi', sql.NVarChar(20), 'ihale')
      .query(`
        INSERT INTO Siparisler (teklifID, tedarikciID, olusturanFirmaID, siparisTarihi, toplamTutar, kaynakTipi, durum)
        OUTPUT INSERTED.siparisID
        VALUES (@teklifID, @tedarikciID, @olusturanFirmaID, GETDATE(), @toplamTutar, @kaynakTipi, 'b')
      `);

    const siparisID = siparisInsert.recordset?.[0]?.siparisID;
    if (!siparisID) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Sipariş oluşturulamadı' });
    }

    await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .input('yemID', sql.Int, teklif.yemID)
      .input('miktarKg', sql.Decimal(12, 2), teklif.teklifMiktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), teklif.birimFiyat)
      .query(`
        INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
        VALUES (@siparisID, @yemID, @miktarKg, @birimFiyat)
      `);

    const planTarihi = tahminiGirisTarihi ? new Date(tahminiGirisTarihi) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const planTarihiSafe = Number.isNaN(planTarihi.getTime()) ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : planTarihi;
    await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .input('teklifID', sql.Int, teklifID)
      .input('ciftciFirmaID', sql.Int, teklif.acanFirmaID)
      .input('tedarikciID', sql.Int, teklif.tedarikciID)
      .input('yemID', sql.Int, teklif.yemID)
      .input('planlananMiktarKg', sql.Decimal(12, 2), teklif.teklifMiktarKg)
      .input('planlananGirisTarihi', sql.DateTime, planTarihiSafe)
      .input('gerceklesenMiktarKg', sql.Decimal(12, 2), 0)
      .input('kalanMiktarKg', sql.Decimal(12, 2), teklif.teklifMiktarKg)
      .input('durum', sql.Char(1), 'p')
      .input('aciklama', sql.NVarChar(255), 'Tahmini depo giriş planı')
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

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('ihaleID', sql.Int, teklif.ihaleID)
      .input('tedarikciID', sql.Int, teklif.tedarikciID)
      .input('aksiyonTipi', sql.NVarChar(20), 'sec')
      .input('eskiDurum', sql.Char(1), teklif.teklifDurum)
      .input('yeniDurum', sql.Char(1), 's')
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklif.teklifMiktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), teklif.birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), teklif.toplamTutar)
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), 'Çiftçi teklif seçti')
      .query(`
        INSERT INTO TeklifAksiyonLog (
          teklifID, ihaleID, tedarikciID, aksiyonTipi, eskiDurum, yeniDurum,
          teklifMiktarKg, birimFiyat, toplamTutar, yapanKullaniciID, aciklama
        )
        VALUES (
          @teklifID, @ihaleID, @tedarikciID, @aksiyonTipi, @eskiDurum, @yeniDurum,
          @teklifMiktarKg, @birimFiyat, @toplamTutar, @yapanKullaniciID, @aciklama
        )
      `);

    if (yeniKalan <= 0) {
      await transaction.request()
        .input('ihaleID', sql.Int, teklif.ihaleID)
        .query(`UPDATE Ihaleler SET durum = 't' WHERE ihaleID = @ihaleID`);
    }

    await transaction.commit();
    return res.json({ siparisID });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Teklif seçilemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifReddet = async (req, res) => {
  const { teklifID, yapanKullaniciID } = req.body ?? {};
  if (!teklifID) return res.status(400).json({ error: 'teklifID zorunlu' });

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const teklifResult = await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .query(`
        SELECT teklifID, ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, durum
        FROM Teklifler
        WHERE teklifID = @teklifID
      `);

    if (teklifResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Teklif bulunamadı veya reddedilemez' });
    }

    const teklif = teklifResult.recordset[0];
    if (teklif.durum !== 'b') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif reddedilemez' });
    }

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .query(`
        UPDATE Teklifler
        SET durum = 'r'
        WHERE teklifID = @teklifID
      `);

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('ihaleID', sql.Int, teklif.ihaleID)
      .input('tedarikciID', sql.Int, teklif.tedarikciID)
      .input('aksiyonTipi', sql.NVarChar(20), 'reddet')
      .input('eskiDurum', sql.Char(1), teklif.durum)
      .input('yeniDurum', sql.Char(1), 'r')
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklif.teklifMiktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), teklif.birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), teklif.toplamTutar)
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), 'Çiftçi teklif reddetti')
      .query(`
        INSERT INTO TeklifAksiyonLog (
          teklifID, ihaleID, tedarikciID, aksiyonTipi, eskiDurum, yeniDurum,
          teklifMiktarKg, birimFiyat, toplamTutar, yapanKullaniciID, aciklama
        )
        VALUES (
          @teklifID, @ihaleID, @tedarikciID, @aksiyonTipi, @eskiDurum, @yeniDurum,
          @teklifMiktarKg, @birimFiyat, @toplamTutar, @yapanKullaniciID, @aciklama
        )
      `);

    await transaction.commit();
    return res.json({ message: 'Teklif reddedildi' });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Teklif reddedilemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postIhaleDurumLogList = async (req, res) => {
  const { ihaleID } = req.body ?? {};
  if (!ihaleID) return res.status(400).json({ error: 'ihaleID zorunlu' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ihaleID', sql.Int, ihaleID)
      .query(`
        SELECT
          l.logID,
          l.ihaleID,
          l.eskiDurum,
          l.yeniDurum,
          l.degisiklikTarihi,
          l.yapanKullaniciID,
          k.isim + ' ' + k.soyisim AS yapanKullaniciAdi,
          l.aciklama
        FROM IhaleDurumLog l
        LEFT JOIN kullanicilar k ON l.yapanKullaniciID = k.kullaniciID
        WHERE l.ihaleID = @ihaleID
        ORDER BY l.degisiklikTarihi DESC
      `);

    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('İhale durum logu alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifAksiyonLogList = async (req, res) => {
  const { ihaleID, teklifID } = req.body ?? {};
  if (!ihaleID && !teklifID) {
    return res.status(400).json({ error: 'ihaleID veya teklifID zorunlu' });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        l.logID,
        l.teklifID,
        l.ihaleID,
        l.tedarikciID,
        f.firmaAdi AS tedarikciAdi,
        l.aksiyonTipi,
        l.eskiDurum,
        l.yeniDurum,
        l.teklifMiktarKg,
        l.birimFiyat,
        l.toplamTutar,
        l.aksiyonTarihi,
        l.yapanKullaniciID,
        k.isim + ' ' + k.soyisim AS yapanKullaniciAdi,
        l.aciklama
      FROM TeklifAksiyonLog l
      LEFT JOIN firmalar f ON l.tedarikciID = f.firmaID
      LEFT JOIN kullanicilar k ON l.yapanKullaniciID = k.kullaniciID
      WHERE 1=1
    `;

    if (ihaleID) {
      query += ' AND l.ihaleID = @ihaleID';
      request.input('ihaleID', sql.Int, ihaleID);
    }
    if (teklifID) {
      query += ' AND l.teklifID = @teklifID';
      request.input('teklifID', sql.Int, teklifID);
    }

    query += ' ORDER BY l.aksiyonTarihi DESC';
    const result = await request.query(query);

    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Teklif aksiyon logu alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
