const { poolPromise } = require("../../../service/connection.js");
const sql = require('mssql');


exports.postStokListesi = async (req, res) => {
  const { firmaID } = req.body; // Artık body'den alıyoruz

  try {
      const pool = await poolPromise;
      const request = pool.request();

      let query = `
          USE laktasens; -- veya kendi database'ini kullan
          SELECT 
              fd.depoID,
              fd.firmaID,
              fd.yemID,
              ym.yemAdi, -- yem adını da çekiyoruz
              fd.miktarKg,
              fd.sonGuncellemeTarihi
          FROM FirmaDepo fd
          LEFT JOIN YemMaddeleri ym ON fd.yemID = ym.yemID
      `;

      if (firmaID) {
          query += ` WHERE fd.firmaID = @firmaID`;
          request.input('firmaID', firmaID);
      }

      const result = await request.query(query);

      if (result.recordset.length === 0) {
          return res.status(404).json({ message: 'Stok bulunamadı.' });
      }

      return res.json(result.recordset);
  } catch (error) {
      console.error('Stok listesi alınamadı:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postHayvanSayisi = async (req, res) => {
    const {
        firmaID
    } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ID", firmaID)
            .query(
                `USE laktasens;
                SELECT
	SUM(CASE 
        -- Erişkin olanlar
        WHEN 
            NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL AND servisteInekler.dollenmeSayisi > 0) AND NOT servisteInekler.dollenmeSayisi = 0
        THEN 1 
        ELSE 0 
    END) AS dongudekiHayvanSayisi,
	SUM(CASE 
		-- Yavru olanlar
		WHEN 
			(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL AND servisteInekler.dollenmeSayisi > 0 AND NOT servisteInekler.dollenmeSayisi = 0)
		THEN 1 
		ELSE 0 
	END) AS yavruHayvanSayisi,
    SUM(CASE 
            WHEN 
                servisteInekler.dollenmeSayisi > 0
				AND NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL)
				AND servisteInekler.sonKuruTarihi > servisteInekler.sonDogurmaTarihi
            THEN 1 
            ELSE 0 
        END) AS kuruHayvanSayisi,
    SUM(CASE 
            -- Serviste olanlar: Tuttu mu 'H', döllenme sayısı 2 veya daha az, süre uygun
            WHEN    
			servisteInekler.dollenmeSayisi > 0
                    AND (
                        (servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonSutOlcumTarihi IS NULL AND servisteInekler.tuttuMu = 'E')
                        OR 
                        (NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL) 
                        AND servisteInekler.sonDollenme > servisteInekler.sonDogurmaTarihi 
                        AND servisteInekler.tuttuMu = 'E')
                    )
            THEN 1 
            ELSE 0 
        END) AS gebeHayvanSayisi,
		    SUM(CASE 
            -- Serviste olanlar: Tuttu mu 'H', döllenme sayısı 2 veya daha az, süre uygun
            WHEN    
			servisteInekler.dollenmeSayisi > 0
                AND((servisteInekler.sonDogurmaTarihi IS NOT NULL AND servisteInekler.sonDollenme IS NOT NULL AND servisteInekler.sonKuruTarihi IS NULL)
                OR 
                (NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL)
                AND sonDogurmaTarihi > sonKuruTarihi ))
            THEN 1 
            ELSE 0 
        END) AS sagmalHayvanSayisi
FROM 
    (
        SELECT 
            inek.inekID,
            inek.ad,
            inek.dollenmeSayisi,
            inek.irk,
            inek.tuttuMu,
            inek.sonDogurmaTarihi,
            inek.sonDollenme,
            inek.sonKuruTarihi,
            inek.sonSutOlcumTarihi,
            280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) AS guncelGunSayisi,
            CASE 
                WHEN inek.tuttuMu IS NULL THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                WHEN inek.dollenmeSayisi = 1 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
                WHEN inek.dollenmeSayisi = 2 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
                ELSE -DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
            END AS kalanGun
        FROM 
            inek
        WHERE 
            inek.firmaID = 2
            AND NOT inek.dollenmeSayisi = 0
            AND inek.dollenmeSayisi > 0
    ) AS servisteInekler;
`
            );
        if (result.recordset.length === 0) {
            return res.status(404).json(null);
        }
        return res.json(result.recordset[0]);
    } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postHayvanYemIhtiyac = async (req, res) => {
  const { firmaID } = req.body;

  if (!firmaID) {
    return res.status(400).json({ error: "firmaID parametresi zorunludur" });
  }

  /*------------------------------------------------------------------*/
  // 1) Parametreli sorgu – firmaID yerine @firmaID kullanıyoruz
  const SQL_SORGUSU = `
    ;WITH ServisteInekler AS (
        SELECT  inekID, dollenmeSayisi, tuttuMu,
                sonDogurmaTarihi, sonDollenme, sonKuruTarihi, sonSutOlcumTarihi
        FROM    inek
        WHERE   firmaID = @firmaID
          AND   dollenmeSayisi > 0
    ),
    Gebeler AS (
        SELECT  inekID FROM ServisteInekler WHERE tuttuMu = 'E'
    ),
    KuruSagmal AS (
        SELECT  si.inekID,
                CASE
                   WHEN si.sonKuruTarihi IS NOT NULL
                        AND si.sonKuruTarihi >= COALESCE(si.sonDogurmaTarihi,'1900-01-01')
                        THEN 'Kuru'
                   WHEN si.sonSutOlcumTarihi IS NOT NULL THEN 'Sağmal'
                   ELSE 'Diger'
                END AS donem
        FROM    ServisteInekler si
        LEFT JOIN Gebeler g ON g.inekID = si.inekID
        WHERE   g.inekID IS NULL
    ),
    DonemAdet AS (
        SELECT 'Gebelik' AS donem, COUNT(*) AS hayvanAdedi FROM Gebeler
        UNION ALL
        SELECT  donem, COUNT(*) FROM KuruSagmal
        WHERE donem IN ('Kuru','Sağmal') GROUP BY donem
        UNION ALL
        SELECT 'Yavru', COUNT(*) FROM inek
        WHERE firmaID = @firmaID AND dollenmeSayisi = 0
    ),
    BesinToplam AS (
        SELECT  d.donem, b.tipID,
                SUM(d.hayvanAdedi * b.miktar) AS toplamMiktar
        FROM    DonemAdet d
        JOIN    BesinIhtiyaciStandartlari s ON s.laktasyonDonemi = d.donem
        JOIN    BesinIhtiyacDetay b         ON b.standartID      = s.standartID
        GROUP BY d.donem, b.tipID
    )
    SELECT  bt.donem              AS laktasyonDonemi,
            da.hayvanAdedi,
            t.tipAdi              AS besinAdi,
            u.birimAdi,
            bt.toplamMiktar
    FROM        BesinToplam bt
    JOIN        DonemAdet   da ON da.donem  = bt.donem
    JOIN        BesinTipleri t  ON t.tipID  = bt.tipID
    JOIN        Birimler     u  ON u.birimID= t.birimID
    ORDER BY    bt.donem, t.tipID;
  `;

  /*------------------------------------------------------------------*/
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("firmaID", sql.Int, firmaID)
      .query(SQL_SORGUSU);

    if (result.recordset.length === 0) {
      // Firma bulunamadı veya veri yok → boş dizi dön
      return res.json([]);
    }

    // 2) SQL çıktısını front‑end yapısına dönüştür
    const map = new Map(); // donem -> { donem, hayvanAdedi, details: [] }

    result.recordset.forEach((row) => {
      const {
        laktasyonDonemi: donem,
        hayvanAdedi,
        besinAdi: tipAdi,
        birimAdi,
        toplamMiktar,
      } = row;

      if (!map.has(donem)) {
        map.set(donem, { donem, hayvanAdedi, details: [] });
      }
      map.get(donem).details.push({ tipAdi, birimAdi, toplamMiktar: Number(toplamMiktar) });
    });

    // İstenen sabit sıra → Gebelik, Kuru, Sagmal, Yavru
    const orderedDonemler = ["Gebelik", "Kuru", "Sagmal", "Yavru"];
    const response = orderedDonemler.map((d) =>
      map.get(d) || { donem: d, hayvanAdedi: 0, details: [] }
    );

    return res.json(response);
  } catch (error) {
    console.error("Data could not be retrieved:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


/** ---------- Tüketim Analiz ----------*/

function appendDateFilter(query, { startDate, endDate }) {
  if (startDate) query += ' AND l.islemTarihi >= @startDate';
  if (endDate)   query += ' AND l.islemTarihi <  DATEADD(day,1,@endDate)'; // <= endDate 23:59:59
  return query;
}
/** 1) Stok Eğilimi (kümülatif net kg) */
exports.postStokEgilimi = async (req, res) => {
  const { firmaID, startDate, endDate, granularity = 'aylik' } = req.body;
  if (!firmaID) return res.status(400).json({ message: 'firmaID gerekli.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('firmaID', firmaID);
    if (startDate) request.input('startDate', startDate);
    if (endDate)   request.input('endDate',   endDate);

    // Tarihi yıl-ayın ilk günü (yyyy-MM-01) veya yyyy-MM-dd’ye göre grupluyoruz
    const dateExpr = granularity === 'gunluk'
      ? "FORMAT(l.islemTarihi,'yyyy-MM-dd')"
      : "FORMAT(l.islemTarihi,'yyyy-MM')";

    let query = `USE laktasens;
      WITH hareket AS (
        SELECT ${dateExpr}   AS period,
               SUM(CASE WHEN l.islemTipi='g' THEN l.miktarKg ELSE -l.miktarKg END) AS netKg
        FROM   FirmaDepoLog l
        WHERE  l.firmaID = @firmaID`;

    query = appendDateFilter(query, { startDate, endDate });

    query += `
        GROUP BY ${dateExpr}
      )
      SELECT period,
             SUM(netKg) OVER (ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS kumulatifKg
      FROM   hareket
      ORDER BY period;`;

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Stok eğilimi hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/** 2) Yem Türüne Göre Net Tüketim (çıkış) */
exports.postNetTuketim = async (req, res) => {
  const { firmaID, startDate, endDate } = req.body;
  if (!firmaID) return res.status(400).json({ message: 'firmaID gerekli.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('firmaID', firmaID);
    if (startDate) request.input('startDate', startDate);
    if (endDate)   request.input('endDate',   endDate);

    let query = `USE laktasens;
      SELECT y.yemAdi,
             SUM(l.miktarKg) AS cikisKg
      FROM   FirmaDepoLog l
      JOIN   YemMaddeleri y ON y.yemID = l.yemID
      WHERE  l.firmaID = @firmaID AND l.islemTipi = 'c'AND l.islemNedeniID=8`;
    query = appendDateFilter(query, { startDate, endDate });

    query += `
      GROUP BY y.yemAdi
      ORDER BY cikisKg DESC;`;

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Net tüketim hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/** 3) Güncel Stok Dağılımı (Donut) */
exports.postStokDagilim = async (req, res) => {
  const { firmaID } = req.body;
  if (!firmaID) return res.status(400).json({ message: 'firmaID gerekli.' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('firmaID', firmaID)
      .query(`USE laktasens;
        SELECT y.yemAdi, d.miktarKg
        FROM   FirmaDepo d
        JOIN   YemMaddeleri y ON y.yemID = d.yemID
        WHERE  d.firmaID = @firmaID;`);

    return res.json(result.recordset);
  } catch (err) {
    console.error('Stok dagilim hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/** 4) Giriş–Çıkış Dengesi */
exports.postGirisCikis = async (req, res) => {
  const { firmaID, startDate, endDate, granularity = 'aylik' } = req.body;
  if (!firmaID) return res.status(400).json({ message: 'firmaID gerekli.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('firmaID', firmaID);
    if (startDate) request.input('startDate', startDate);
    if (endDate)   request.input('endDate',   endDate);

    const dateExpr = granularity === 'gunluk'
      ? "FORMAT(l.islemTarihi,'yyyy-MM-dd')"
      : "FORMAT(l.islemTarihi,'yyyy-MM')";

    let query = `USE laktasens;
      SELECT ${dateExpr} AS period,
             SUM(CASE WHEN l.islemTipi='g' THEN l.miktarKg ELSE 0 END) AS girisKg,
             SUM(CASE WHEN l.islemTipi='c' THEN l.miktarKg ELSE 0 END) AS cikisKg
      FROM   FirmaDepoLog l
      WHERE  l.firmaID = @firmaID`;

    query = appendDateFilter(query, { startDate, endDate });

    query += `
      GROUP BY ${dateExpr}
      ORDER BY period;`;

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Giris–Cikis hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/** 5) Tüketim Nedeni Kırılımı */
exports.postTuketimNeden = async (req, res) => {
  const { firmaID, startDate, endDate } = req.body;
  if (!firmaID) return res.status(400).json({ message: 'firmaID gerekli.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('firmaID', firmaID);
    if (startDate) request.input('startDate', startDate);
    if (endDate)   request.input('endDate',   endDate);

    let query = `USE laktasens;
      SELECT n.nedenAdi,
             SUM(l.miktarKg) AS toplamKg
      FROM   FirmaDepoLog l
      JOIN   IslemNedenleri n ON n.islemNedeniID = l.islemNedeniID
      WHERE  l.firmaID = @firmaID AND l.islemTipi = 'c'`;

    query = appendDateFilter(query, { startDate, endDate });

    query += `
      GROUP BY n.nedenAdi
      ORDER BY toplamKg DESC;`;

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Tuketim neden hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/** 6) Kg / İnek / Gün KPI (son N gün, varsayılan 30) */
exports.postKpiKgInekGun = async (req, res) => {
  const { firmaID, days = 30 } = req.body;
  if (!firmaID) return res.status(400).json({ message: 'firmaID gerekli.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('firmaID', firmaID);
    request.input('days', days);

    const query = `USE laktasens;
      DECLARE @dateFrom date = DATEADD(day,-@days,CAST(GETDATE() AS date));

      /* Toplam çıkış kg */
      SELECT  SUM(l.miktarKg)*1.0/@days                      AS kgPerDay,
              (SELECT COUNT(*) FROM inek WHERE firmaID=@firmaID) AS inekCount
      INTO    #tmp
      FROM    FirmaDepoLog l
      WHERE   l.firmaID = @firmaID AND l.islemTipi='c'AND l.islemNedeniID=8 AND l.islemTarihi >= @dateFrom;

      SELECT  kgPerDay/NULLIF(inekCount,0) AS kgPerInekGun, kgPerDay, inekCount
      FROM    #tmp;`;

    const result = await request.query(query);
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('KPI kg/inek/gün hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/** 7) Besin İhtiyacı Karşılama Oranı */
exports.postBesinOran = async (req, res) => {
  const { firmaID, standartID, days = 30 } = req.body;
  if (!firmaID || !standartID)
    return res.status(400).json({ message: 'firmaID ve standartID gerekli.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('firmaID', firmaID);
    request.input('standartID', standartID);
    request.input('days', days);

    const query = `USE laktasens;
      DECLARE @dateFrom date = DATEADD(day,-@days,CAST(GETDATE() AS date));
      DECLARE @cowCnt  int  = (SELECT COUNT(*) FROM inek WHERE firmaID=@firmaID);

      /* Son N günde yem çıkışları (kg) */
      ;WITH feedExit AS (
        SELECT yemID, SUM(miktarKg) AS kg
        FROM   FirmaDepoLog
        WHERE  firmaID=@firmaID AND islemTipi='c' AND islemTipi='c' AND islemNedeniID=8 AND islemTarihi>=@dateFrom
        GROUP BY yemID
      ),
      deliver AS (
        SELECT ybd.tipID,
               SUM(fe.kg * ybd.miktar / CASE WHEN bi.birimAdi LIKE '%%' THEN 100.0 ELSE 1.0 END) AS totalDelivered
        FROM   feedExit fe
        JOIN   YemBesinDegerleri ybd ON ybd.yemID = fe.yemID
        JOIN   BesinTipleri bt       ON bt.tipID = ybd.tipID
        JOIN   Birimler bi           ON bi.birimID = bt.birimID
        GROUP BY ybd.tipID
      )
      SELECT bt.tipAdi,
             bd.miktar                      AS dailyNeedPerCow,
             CASE WHEN @cowCnt=0 THEN NULL
                  ELSE d.totalDelivered/(@days*@cowCnt) END AS deliveredPerCow,
             CASE WHEN bd.miktar=0 OR d.totalDelivered IS NULL THEN NULL
                  ELSE (d.totalDelivered/(@days*@cowCnt))/bd.miktar END  AS karsilamaOran
      FROM   BesinIhtiyacDetay bd
      JOIN   BesinTipleri bt ON bt.tipID = bd.tipID
      LEFT JOIN deliver d    ON d.tipID  = bd.tipID
      WHERE  bd.standartID   = @standartID
      ORDER BY bt.tipAdi;`;

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Besin oran hatası:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};