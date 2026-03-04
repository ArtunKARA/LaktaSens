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

exports.postAcikIhaleList = async (req, res) => {
  const { yemID } = req.body ?? {};

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
        k.kalanMiktarKg
      FROM Ihaleler i
      INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
      INNER JOIN YemMaddeleri y ON k.yemID = y.yemID
      INNER JOIN firmalar f ON i.acanFirmaID = f.firmaID
      WHERE i.durum = 'a'
        AND i.ihaleBitisTarihi >= GETDATE()
    `;

    if (yemID) {
      query += ' AND k.yemID = @yemID';
      request.input('yemID', sql.Int, yemID);
    }

    query += ' ORDER BY i.ihaleBaslangicTarihi DESC';

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Açık ihaleler alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifOlustur = async (req, res) => {
  const { ihaleID, tedarikciID, tedarikciFirmaID, teklifMiktarKg, miktarKg, birimFiyat, yapanKullaniciID } = req.body ?? {};
  const supplierId = tedarikciID ?? tedarikciFirmaID; // UI bazen tedarikciFirmaID gönderiyor
  const teklifKg = teklifMiktarKg ?? miktarKg;        // UI bazen miktarKg gönderiyor

  if (!ihaleID || !supplierId || !teklifKg || !birimFiyat) {
    return res.status(400).json({ error: 'ihaleID, tedarikciID, teklifMiktarKg, birimFiyat zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const ihaleResult = await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .query(`
        SELECT
          i.durum,
          k.talepMiktarKg
        FROM Ihaleler i
        INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
        WHERE i.ihaleID = @ihaleID
      `);

    if (ihaleResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'İhale bulunamadı' });
    }

    const ihale = ihaleResult.recordset[0];
    if (ihale.durum !== 'a') {
      await transaction.rollback();
      return res.status(400).json({ error: 'İhale aktif değil' });
    }

    if (Number(teklifKg) > Number(ihale.talepMiktarKg)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif miktarı talep miktarını aşamaz' });
    }

    const toplamTutar = Number(teklifKg) * Number(birimFiyat);

    const teklifInsert = await transaction.request()
      .input('ihaleID', sql.Int, ihaleID)
      .input('tedarikciID', sql.Int, supplierId)
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklifKg)
      .input('birimFiyat', sql.Decimal(10, 2), birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), toplamTutar)
      .query(`
        INSERT INTO Teklifler (ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, teklifTarihi, durum)
        OUTPUT INSERTED.teklifID
        VALUES (@ihaleID, @tedarikciID, @teklifMiktarKg, @birimFiyat, @toplamTutar, GETDATE(), 'b')
      `);

    const teklifID = teklifInsert.recordset?.[0]?.teklifID;
    if (!teklifID) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Teklif oluşturulamadı' });
    }

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('ihaleID', sql.Int, ihaleID)
      .input('tedarikciID', sql.Int, supplierId)
      .input('aksiyonTipi', sql.NVarChar(20), 'olustur')
      .input('eskiDurum', sql.Char(1), null)
      .input('yeniDurum', sql.Char(1), 'b')
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklifKg)
      .input('birimFiyat', sql.Decimal(10, 2), birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), toplamTutar)
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), 'Teklif oluşturuldu')
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
    return res.json({ teklifID });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Teklif oluşturulamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifCek = async (req, res) => {
  const { teklifID, tedarikciID, yapanKullaniciID } = req.body ?? {};
  if (!teklifID || !tedarikciID) {
    return res.status(400).json({ error: 'teklifID ve tedarikciID zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const teklifResult = await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('tedarikciID', sql.Int, tedarikciID)
      .query(`
        SELECT teklifID, ihaleID, tedarikciID, teklifMiktarKg, birimFiyat, toplamTutar, durum
        FROM Teklifler
        WHERE teklifID = @teklifID AND tedarikciID = @tedarikciID
      `);

    if (teklifResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Teklif bulunamadı veya çekilemez' });
    }

    const teklif = teklifResult.recordset[0];
    if (teklif.durum !== 'b') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif çekilemez' });
    }

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .query(`
        UPDATE Teklifler
        SET durum = 'c'
        WHERE teklifID = @teklifID
      `);

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('ihaleID', sql.Int, teklif.ihaleID)
      .input('tedarikciID', sql.Int, teklif.tedarikciID)
      .input('aksiyonTipi', sql.NVarChar(20), 'cek')
      .input('eskiDurum', sql.Char(1), teklif.durum)
      .input('yeniDurum', sql.Char(1), 'c')
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklif.teklifMiktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), teklif.birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), teklif.toplamTutar)
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), 'Teklif geri çekildi')
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
    return res.json({ message: 'Teklif çekildi' });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Teklif çekilemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifList = async (req, res) => {
  const { tedarikciID, durum } = req.body ?? {};
  if (!tedarikciID) return res.status(400).json({ error: 'tedarikciID zorunlu' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        t.teklifID,
        t.ihaleID,
        t.tedarikciID,
        t.teklifMiktarKg,
        t.birimFiyat,
        t.toplamTutar,
        t.teklifTarihi,
        t.durum,
        i.ihaleAdi,
        i.ihaleBaslangicTarihi,
        i.ihaleBitisTarihi,
        i.durum AS ihaleDurum,
        k.yemID,
        y.yemAdi,
        k.talepMiktarKg,
        k.kalanMiktarKg
      FROM Teklifler t
      INNER JOIN Ihaleler i ON t.ihaleID = i.ihaleID
      INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
      INNER JOIN YemMaddeleri y ON k.yemID = y.yemID
      WHERE t.tedarikciID = @tedarikciID
    `;

    request.input('tedarikciID', sql.Int, tedarikciID);
    if (durum) {
      query += ' AND t.durum = @durum';
      request.input('durum', sql.Char(1), durum);
    }

    query += ' ORDER BY t.teklifTarihi DESC';

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Teklif listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Tedarikçinin kendi teklif/ihale listesi (İhalelerim)
exports.postIhalelerimList = async (req, res) => {
  const { tedarikciID, tedarikciFirmaID, arama, durum, minFiyat, maxFiyat, siralama } = req.body ?? {};
  const supplierId = tedarikciID ?? tedarikciFirmaID;
  if (!supplierId) return res.status(400).json({ error: 'tedarikciID zorunlu' });

  const mapTeklifDurum = (kod) => {
    switch (kod) {
      case 'b': return 'aktif';         // beklemede
      case 's': return 'kazanildi';     // seçildi
      case 'r': return 'kaybedildi';    // reddedildi
      case 'c': return 'geri_cekildi';  // çekildi
      default: return 'iptal';
    }
  };

  const mapSiparisDurum = (kod) => {
    switch (kod) {
      case 'b': return 'bekleyen_onay';
      case 'o': return 'hazirlanan';
      case 'y': return 'sevk_edilen';
      case 't': return 'tamamlanan';
      case 'i':
      case 'r':
        return 'iptal_edilen';
      default:
        return null;
    }
  };

  try {
    const pool = await poolPromise;
    const request = pool.request().input('supplierId', sql.Int, supplierId);

    let query = `
      SELECT
        t.teklifID,
        t.ihaleID,
        i.ihaleAdi,
        f.firmaAdi AS acanFirmaAdi,
        y.yemAdi,
        i.ihaleBaslangicTarihi,
        i.ihaleBitisTarihi,
        k.talepMiktarKg,
        k.kalanMiktarKg,
        t.birimFiyat        AS benimTeklifBirimFiyat,
        t.teklifMiktarKg    AS benimTeklifMiktarKg,
        t.teklifTarihi      AS benimTeklifTarihi,
        t.durum             AS teklifDurumKod,
        stats.enDusukBirimFiyat,
        stats.teklifSayisi,
        s.durum             AS siparisDurum
      FROM Teklifler t
      INNER JOIN Ihaleler i        ON t.ihaleID = i.ihaleID
      INNER JOIN IhaleKalemleri k  ON i.ihaleID = k.ihaleID
      INNER JOIN YemMaddeleri y    ON k.yemID   = y.yemID
      INNER JOIN firmalar f        ON i.acanFirmaID = f.firmaID
      OUTER APPLY (
        SELECT MIN(birimFiyat) AS enDusukBirimFiyat, COUNT(1) AS teklifSayisi
        FROM Teklifler tt
        WHERE tt.ihaleID = t.ihaleID
      ) stats
      LEFT JOIN Siparisler s ON s.teklifID = t.teklifID
      WHERE t.tedarikciID = @supplierId
    `;

    if (arama) {
      query += ' AND (i.ihaleAdi LIKE @arama OR y.yemAdi LIKE @arama OR f.firmaAdi LIKE @arama)';
      request.input('arama', sql.NVarChar, `%${arama}%`);
    }
    if (minFiyat !== undefined && minFiyat !== null && minFiyat !== '') {
      query += ' AND t.birimFiyat >= @minFiyat';
      request.input('minFiyat', sql.Decimal(10, 2), minFiyat);
    }
    if (maxFiyat !== undefined && maxFiyat !== null && maxFiyat !== '') {
      query += ' AND t.birimFiyat <= @maxFiyat';
      request.input('maxFiyat', sql.Decimal(10, 2), maxFiyat);
    }

    // Sıralama
    switch (siralama) {
      case 'tarih_asc':
        query += ' ORDER BY i.ihaleBitisTarihi ASC';
        break;
      case 'fiyat_asc':
        query += ' ORDER BY t.birimFiyat ASC';
        break;
      case 'fiyat_desc':
        query += ' ORDER BY t.birimFiyat DESC';
        break;
      case 'bitis_asc':
        query += ' ORDER BY i.ihaleBitisTarihi ASC';
        break;
      case 'tarih_desc':
      default:
        query += ' ORDER BY i.ihaleBitisTarihi DESC';
        break;
    }

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);

    const payload = result.recordset
      .map((row) => ({
        ...row,
        teklifDurum: mapTeklifDurum(row.teklifDurumKod),
        islemDurum: mapSiparisDurum(row.siparisDurum),
      }))
      // durum filtresi frontend kodlarına göre uygulanıyor ('aktif','kazanildi', vb.)
      .filter((row) => !durum || row.teklifDurum === durum);

    return res.json(payload);
  } catch (error) {
    console.error('İhalelerim listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postTeklifGuncelle = async (req, res) => {
  const { teklifID, tedarikciID, teklifMiktarKg, birimFiyat, yapanKullaniciID } = req.body ?? {};
  if (!teklifID || !tedarikciID || !teklifMiktarKg || !birimFiyat) {
    return res.status(400).json({ error: 'teklifID, tedarikciID, teklifMiktarKg, birimFiyat zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const teklifResult = await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('tedarikciID', sql.Int, tedarikciID)
      .query(`
        SELECT
          t.ihaleID,
          t.teklifMiktarKg AS eskiMiktarKg,
          t.birimFiyat AS eskiBirimFiyat,
          t.toplamTutar AS eskiToplamTutar,
          t.durum AS teklifDurum,
          i.durum AS ihaleDurum,
          k.talepMiktarKg
        FROM Teklifler t
        INNER JOIN Ihaleler i ON t.ihaleID = i.ihaleID
        INNER JOIN IhaleKalemleri k ON i.ihaleID = k.ihaleID
        WHERE t.teklifID = @teklifID AND t.tedarikciID = @tedarikciID
      `);

    if (teklifResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Teklif bulunamadı' });
    }

    const teklif = teklifResult.recordset[0];
    if (teklif.teklifDurum !== 'b') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif güncellenebilir durumda değil' });
    }
    if (teklif.ihaleDurum !== 'a') {
      await transaction.rollback();
      return res.status(400).json({ error: 'İhale aktif değil' });
    }
    if (Number(teklifMiktarKg) > Number(teklif.talepMiktarKg)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Teklif miktarı talep miktarını aşamaz' });
    }

    const toplamTutar = Number(teklifMiktarKg) * Number(birimFiyat);
    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklifMiktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), toplamTutar)
      .query(`
        UPDATE Teklifler
        SET teklifMiktarKg = @teklifMiktarKg,
            birimFiyat = @birimFiyat,
            toplamTutar = @toplamTutar
        WHERE teklifID = @teklifID
      `);

    await transaction.request()
      .input('teklifID', sql.Int, teklifID)
      .input('ihaleID', sql.Int, teklif.ihaleID)
      .input('tedarikciID', sql.Int, tedarikciID)
      .input('aksiyonTipi', sql.NVarChar(20), 'guncelle')
      .input('eskiDurum', sql.Char(1), teklif.teklifDurum)
      .input('yeniDurum', sql.Char(1), 'b')
      .input('teklifMiktarKg', sql.Decimal(12, 2), teklifMiktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), birimFiyat)
      .input('toplamTutar', sql.Decimal(14, 2), toplamTutar)
      .input('yapanKullaniciID', sql.Int, yapanKullaniciID || null)
      .input('aciklama', sql.NVarChar(255), 'Teklif güncellendi')
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
    return res.json({ message: 'Teklif güncellendi' });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Teklif güncellenemedi:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
