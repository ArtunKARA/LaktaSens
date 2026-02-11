const { poolPromise } = require("../../../service/connection.js");
const sql = require('mssql');

const buildMarketBaseQuery = () => `
  SELECT * FROM (
    SELECT
      ym.yemID,
      ym.yemAdi,
      ym.ozelYem,
      ym.durum,
      ym.yemFirmaID,
      ym.birimFiyat,
      ym.minSiparisKg,
      ym.maxSiparisKg,
      ym.aciklama AS yemAciklama,
      ym.yemFirmaID AS tedarikciID,
      f.firmaAdi AS tedarikciAdi,
      ISNULL(fd.miktarKg, 0) AS stokKg
    FROM YemMaddeleri ym
    LEFT JOIN firmalar f ON ym.yemFirmaID = f.firmaID
    LEFT JOIN FirmaDepo fd ON fd.firmaID = ym.yemFirmaID AND fd.yemID = ym.yemID
    WHERE ym.durum = 'a' AND ym.birimFiyat IS NOT NULL AND ym.yemFirmaID IS NOT NULL

    UNION ALL

    SELECT
      ym.yemID,
      ym.yemAdi,
      ym.ozelYem,
      ym.durum,
      ym.yemFirmaID,
      ym.birimFiyat,
      ym.minSiparisKg,
      ym.maxSiparisKg,
      ym.aciklama AS yemAciklama,
      fd.firmaID AS tedarikciID,
      f.firmaAdi AS tedarikciAdi,
      ISNULL(fd.miktarKg, 0) AS stokKg
    FROM YemMaddeleri ym
    INNER JOIN FirmaDepo fd ON fd.yemID = ym.yemID
    INNER JOIN firmalar f ON fd.firmaID = f.firmaID
    WHERE ym.durum = 'a' AND ym.birimFiyat IS NOT NULL AND ym.yemFirmaID IS NULL AND f.firmaTur = 't'
  ) m
  WHERE 1=1
`;

exports.postMarketList = async (req, res) => {
  const {
    arama,
    ozelYem,
    tedarikciID,
    minFiyat,
    maxFiyat,
    minStok,
    maxStok,
    minSiparisKg,
    maxSiparisKg,
    stokVar,
    siralama
  } = req.body ?? {};

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = buildMarketBaseQuery();

    if (arama) {
      query += ' AND (m.yemAdi LIKE @arama OR m.tedarikciAdi LIKE @arama)';
      request.input('arama', sql.NVarChar, `%${arama}%`);
    }
    if (ozelYem !== undefined && ozelYem !== null && ozelYem !== '') {
      const ozelYemValue = ozelYem === true || ozelYem === 1 || ozelYem === '1';
      query += ' AND m.ozelYem = @ozelYem';
      request.input('ozelYem', sql.Bit, ozelYemValue ? 1 : 0);
    }
    if (tedarikciID) {
      query += ' AND m.tedarikciID = @tedarikciID';
      request.input('tedarikciID', sql.Int, tedarikciID);
    }
    if (minFiyat != null) {
      query += ' AND m.birimFiyat >= @minFiyat';
      request.input('minFiyat', sql.Decimal(10, 2), minFiyat);
    }
    if (maxFiyat != null) {
      query += ' AND m.birimFiyat <= @maxFiyat';
      request.input('maxFiyat', sql.Decimal(10, 2), maxFiyat);
    }
    if (minStok != null) {
      query += ' AND m.stokKg >= @minStok';
      request.input('minStok', sql.Decimal(12, 2), minStok);
    }
    if (maxStok != null) {
      query += ' AND m.stokKg <= @maxStok';
      request.input('maxStok', sql.Decimal(12, 2), maxStok);
    }
    if (minSiparisKg != null) {
      query += ' AND (m.minSiparisKg IS NULL OR m.minSiparisKg <= @minSiparisKg)';
      request.input('minSiparisKg', sql.Decimal(12, 2), minSiparisKg);
    }
    if (maxSiparisKg != null) {
      query += ' AND (m.maxSiparisKg IS NULL OR m.maxSiparisKg >= @maxSiparisKg)';
      request.input('maxSiparisKg', sql.Decimal(12, 2), maxSiparisKg);
    }
    if (stokVar) {
      query += ' AND m.stokKg > 0';
    }

    switch (siralama) {
      case 'fiyat_desc':
        query += ' ORDER BY m.birimFiyat DESC';
        break;
      case 'stok_desc':
        query += ' ORDER BY m.stokKg DESC';
        break;
      case 'stok_asc':
        query += ' ORDER BY m.stokKg ASC';
        break;
      case 'adi_desc':
        query += ' ORDER BY m.yemAdi DESC';
        break;
      case 'tedarikci_asc':
        query += ' ORDER BY m.tedarikciAdi ASC';
        break;
      case 'tedarikci_desc':
        query += ' ORDER BY m.tedarikciAdi DESC';
        break;
      case 'fiyat_asc':
      default:
        query += ' ORDER BY m.birimFiyat ASC';
        break;
    }

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json([]);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Market listesi alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postMarketDetay = async (req, res) => {
  const { yemID, tedarikciID } = req.body ?? {};
  if (!yemID) return res.status(400).json({ error: 'yemID zorunlu' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `${buildMarketBaseQuery()} AND m.yemID = @yemID`;
    request.input('yemID', sql.Int, yemID);

    if (tedarikciID) {
      query += ' AND m.tedarikciID = @tedarikciID';
      request.input('tedarikciID', sql.Int, tedarikciID);
    }

    query += ' ORDER BY m.stokKg DESC';
    const marketResult = await request.query(query);
    if (marketResult.recordset.length === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
    const market = marketResult.recordset[0];

    const detayResult = await pool.request()
      .input('yemID', sql.Int, yemID)
      .query(`
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
      `);

    return res.json({
      ...market,
      besinDegerleri: detayResult.recordset
    });
  } catch (error) {
    console.error('Market detay alınamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postMarketSiparisOlustur = async (req, res) => {
  const {
    ciftciFirmaID,
    tedarikciID,
    yemID,
    miktarKg,
    planlananGirisTarihi
  } = req.body ?? {};

  if (!ciftciFirmaID || !tedarikciID || !yemID || !miktarKg) {
    return res.status(400).json({ error: 'ciftciFirmaID, tedarikciID, yemID, miktarKg zorunlu' });
  }

  let pool, transaction;
  try {
    pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const yemResult = await transaction.request()
      .input('yemID', sql.Int, yemID)
      .query(`
        SELECT yemID, yemAdi, ozelYem, durum, yemFirmaID, birimFiyat, minSiparisKg, maxSiparisKg
        FROM YemMaddeleri
        WHERE yemID = @yemID AND durum = 'a' AND birimFiyat IS NOT NULL
      `);

    if (yemResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Yem bulunamadı veya markete kapalı' });
    }

    const yem = yemResult.recordset[0];
    if (yem.yemFirmaID && Number(yem.yemFirmaID) !== Number(tedarikciID)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Seçilen tedarikçi bu yemi sunmuyor' });
    }

    const minKg = Number(yem.minSiparisKg || 0);
    const maxKg = Number(yem.maxSiparisKg || 0);
    if (minKg > 0 && Number(miktarKg) < minKg) {
      await transaction.rollback();
      return res.status(400).json({ error: `Minimum sipariş miktarı ${minKg} kg` });
    }
    if (maxKg > 0 && Number(miktarKg) > maxKg) {
      await transaction.rollback();
      return res.status(400).json({ error: `Maksimum sipariş miktarı ${maxKg} kg` });
    }

    const stokResult = await transaction.request()
      .input('tedarikciID', sql.Int, tedarikciID)
      .input('yemID', sql.Int, yemID)
      .query(`
        SELECT miktarKg
        FROM FirmaDepo
        WHERE firmaID = @tedarikciID AND yemID = @yemID
      `);

    const stokKg = Number(stokResult.recordset?.[0]?.miktarKg || 0);
    if (stokKg <= 0 || Number(miktarKg) > stokKg) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Stok yetersiz' });
    }

    const toplamTutar = Number(miktarKg) * Number(yem.birimFiyat);
    const siparisInsert = await transaction.request()
      .input('teklifID', sql.Int, null)
      .input('tedarikciID', sql.Int, tedarikciID)
      .input('olusturanFirmaID', sql.Int, ciftciFirmaID)
      .input('toplamTutar', sql.Decimal(14, 2), toplamTutar)
      .input('kaynakTipi', sql.NVarChar(20), 'market')
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
      .input('yemID', sql.Int, yemID)
      .input('miktarKg', sql.Decimal(12, 2), miktarKg)
      .input('birimFiyat', sql.Decimal(10, 2), yem.birimFiyat)
      .query(`
        INSERT INTO SiparisKalemleri (siparisID, yemID, miktarKg, birimFiyat)
        VALUES (@siparisID, @yemID, @miktarKg, @birimFiyat)
      `);

    const planTarihi = planlananGirisTarihi ? new Date(planlananGirisTarihi) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const planTarihiSafe = Number.isNaN(planTarihi.getTime()) ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : planTarihi;
    await transaction.request()
      .input('siparisID', sql.Int, siparisID)
      .input('teklifID', sql.Int, null)
      .input('ciftciFirmaID', sql.Int, ciftciFirmaID)
      .input('tedarikciID', sql.Int, tedarikciID)
      .input('yemID', sql.Int, yemID)
      .input('planlananMiktarKg', sql.Decimal(12, 2), miktarKg)
      .input('planlananGirisTarihi', sql.DateTime, planTarihiSafe)
      .input('gerceklesenMiktarKg', sql.Decimal(12, 2), 0)
      .input('kalanMiktarKg', sql.Decimal(12, 2), miktarKg)
      .input('durum', sql.Char(1), 'p')
      .input('aciklama', sql.NVarChar(255), 'Market siparişi depo giriş planı')
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

    await transaction.commit();
    return res.json({ siparisID });
  } catch (error) {
    if (transaction?.inTransaction) await transaction.rollback();
    console.error('Market siparişi oluşturulamadı:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
