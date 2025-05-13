const { poolPromise } = require("../service/connection.js");
const sql = require('mssql');

exports.postIslemNedenleri = async (req, res) => {
    const { islemTipi } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        let query = `
            USE laktasens;
            SELECT
            islemNedeniID,
            nedenAdi,
            islemTipi
            FROM IslemNedenleri
        `;

        if (islemTipi) {
            query += ` WHERE islemTipi = @islemTipi`;
            request.input('islemTipi', islemTipi);
        }

        query += ` ORDER BY islemNedeniID ASC`;

        const result = await request.query(query);
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'İşlem nedeni bulunamadı.' });
        }
        return res.json(result.recordset);
    } catch (error) {
        console.error('İşlem nedenleri alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.postStokListesi = async (req, res) => {
    const { firmaID } = req.body;
  
    try {
        const pool = await poolPromise;
        const request = pool.request();
  
        let query = `
            USE laktasens;
            SELECT 
                fd.depoID,
                fd.firmaID,
                fd.yemID,
                ym.yemAdi,
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

        const formattedResult = result.recordset.map(item => ({
            ...item,
            sonGuncellemeTarihi: item.sonGuncellemeTarihi
                ? new Date(item.sonGuncellemeTarihi).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : null
        }));
  
        return res.json(formattedResult);
    } catch (error) {
        console.error('Stok listesi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
  
exports.postTuketimListesi = async (req, res) => {
    const { firmaID } = req.body; // Body'den firma ve islem nedeni ID alıyoruz

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let query = `
            SELECT 
                l.logID,
                l.firmaID,
                f.firmaAdi,
                l.yemID,
                y.yemAdi,
                l.miktarKg,
                l.islemTarihi,
                l.aciklama,
                n.nedenAdi,
                k.isim + ' ' + k.soyisim AS kullaniciAdi
            FROM FirmaDepoLog l
            INNER JOIN IslemNedenleri n ON l.islemNedeniID = n.islemNedeniID
            INNER JOIN firmalar f ON l.firmaID = f.firmaID
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            INNER JOIN kullanicilar k ON l.kullaniciID = k.kullaniciID
            WHERE l.islemTipi = 'c'
            AND l.islemNedeniID = 8
        `;

        // Eğer firmaID verilmişse
        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        query += ` ORDER BY l.islemTarihi DESC`;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim kaydı bulunamadı.' });
        }

        const formattedResult = result.recordset.map(item => ({
            ...item,
            islemTarihi: item.islemTarihi
                ? new Date(item.islemTarihi).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : null
        }));

        return res.json(formattedResult);
    } catch (error) {
        console.error('Tüketim listesi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postTuketimZamanliGrafik = async (req, res) => {
    const { firmaID, zamanTipi } = req.body; // zamanTipi: 'haftalik', 'aylik', 'yillik'

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let zamanGrubuSQL = '';
        let groupByFields = '';

        if (zamanTipi === 'haftalik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(10), YEAR(l.islemTarihi)) + '-' + 
                RIGHT('0' + CAST(DATEPART(WEEK, l.islemTarihi) AS NVARCHAR(2)), 2)
            `;
            groupByFields = 'YEAR(l.islemTarihi), DATEPART(WEEK, l.islemTarihi), y.yemAdi';
        } 
        else if (zamanTipi === 'aylik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(10), YEAR(l.islemTarihi)) + '-' + 
                RIGHT('0' + CAST(MONTH(l.islemTarihi) AS NVARCHAR(2)), 2)
            `;
            groupByFields = 'YEAR(l.islemTarihi), MONTH(l.islemTarihi), y.yemAdi';
        } 
        else if (zamanTipi === 'yillik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(4), YEAR(l.islemTarihi))
            `;
            groupByFields = 'YEAR(l.islemTarihi), y.yemAdi';
        } 
        else {
            return res.status(400).json({ error: 'Geçersiz zamanTipi. "haftalik", "aylik" veya "yillik" olmalı.' });
        }

        let query = `
            USE laktasens;
            SELECT 
                y.yemAdi,
                ${zamanGrubuSQL} AS zamanGrubu,
                SUM(l.miktarKg) AS toplamTuketimKg
            FROM FirmaDepoLog l
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            WHERE l.islemTipi = 'c'
              AND l.islemNedeniID = 8
        `;

        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        query += `
            GROUP BY ${groupByFields}
            ORDER BY zamanGrubu ASC
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim verisi bulunamadı.' });
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Zamanlı tüketim verisi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postTuketimToplamGrafik = async (req, res) => {
    const { firmaID, zamanTipi } = req.body; // zamanTipi: 'haftalik', 'aylik', 'yillik'

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let whereDateSQL = '';

        if (zamanTipi === 'haftalik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE()) AND DATEPART(WEEK, l.islemTarihi) = DATEPART(WEEK, GETDATE())`;
        } 
        else if (zamanTipi === 'aylik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE()) AND MONTH(l.islemTarihi) = MONTH(GETDATE())`;
        } 
        else if (zamanTipi === 'yillik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE())`;
        } 
        else {
            return res.status(400).json({ error: 'Geçersiz zamanTipi. "haftalik", "aylik" veya "yillik" olmalı.' });
        }

        let query = `
            USE laktasens;
            SELECT 
                y.yemAdi,
                SUM(l.miktarKg) AS toplamTuketimKg
            FROM FirmaDepoLog l
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            WHERE l.islemTipi = 'c'
              AND l.islemNedeniID = 8
              AND ${whereDateSQL}
        `;

        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        query += `
            GROUP BY y.yemAdi
            ORDER BY toplamTuketimKg DESC
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim verisi bulunamadı.' });
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Toplam tüketim verisi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postMalKabulListesi = async (req, res) => {
    const { firmaID } = req.body; // Body'den firma ve islem nedeni ID alıyoruz

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let query = `
            SELECT 
                l.logID,
                l.firmaID,
                f.firmaAdi,
                l.yemID,
                y.yemAdi,
                l.miktarKg,
                l.islemTarihi,
                l.aciklama,
                n.nedenAdi,
                l.islemNedeniID,
                k.isim + ' ' + k.soyisim AS kullaniciAdi
            FROM FirmaDepoLog l
            INNER JOIN IslemNedenleri n ON l.islemNedeniID = n.islemNedeniID
            INNER JOIN firmalar f ON l.firmaID = f.firmaID
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            INNER JOIN kullanicilar k ON l.kullaniciID = k.kullaniciID
            WHERE l.islemTipi = 'g'
        `;

        // Eğer firmaID verilmişse
        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        query += ` ORDER BY l.islemTarihi DESC`;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim kaydı bulunamadı.' });
        }

        const formattedResult = result.recordset.map(item => ({
            ...item,
            islemTarihi: item.islemTarihi
                ? new Date(item.islemTarihi).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : null
        }));

        return res.json(formattedResult);
    } catch (error) {
        console.error('Tüketim listesi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postMalKabulZamanliGrafik = async (req, res) => {
    const { firmaID, zamanTipi, nedenIDList } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let zamanGrubuSQL = '';
        let groupByFields = '';

        if (zamanTipi === 'haftalik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(10), YEAR(l.islemTarihi)) + '-' + 
                RIGHT('0' + CAST(DATEPART(WEEK, l.islemTarihi) AS NVARCHAR(2)), 2)
            `;
            groupByFields = 'YEAR(l.islemTarihi), DATEPART(WEEK, l.islemTarihi), y.yemAdi';
        } 
        else if (zamanTipi === 'aylik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(10), YEAR(l.islemTarihi)) + '-' + 
                RIGHT('0' + CAST(MONTH(l.islemTarihi) AS NVARCHAR(2)), 2)
            `;
            groupByFields = 'YEAR(l.islemTarihi), MONTH(l.islemTarihi), y.yemAdi';
        } 
        else if (zamanTipi === 'yillik') {
            zamanGrubuSQL = `CONVERT(NVARCHAR(4), YEAR(l.islemTarihi))`;
            groupByFields = 'YEAR(l.islemTarihi), y.yemAdi';
        } 
        else {
            return res.status(400).json({ error: 'Geçersiz zamanTipi. "haftalik", "aylik" veya "yillik" olmalı.' });
        }

        let query = `
            USE laktasens;
            SELECT 
                y.yemAdi,
                ${zamanGrubuSQL} AS zamanGrubu,
                SUM(l.miktarKg) AS toplamTuketimKg
            FROM FirmaDepoLog l
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            WHERE l.islemTipi = 'g'
        `;

        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        if (Array.isArray(nedenIDList) && nedenIDList.length > 0) {
            query += ` AND l.islemNedeniID IN (${nedenIDList.map((_, idx) => `@nedenID${idx}`).join(', ')})`;
            nedenIDList.forEach((id, idx) => {
                request.input(`nedenID${idx}`, id);
            });
        }

        query += `
            GROUP BY ${groupByFields}
            ORDER BY zamanGrubu ASC
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim verisi bulunamadı.' });
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Zamanlı tüketim verisi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postMalKabulToplamGrafik = async (req, res) => {
    const { firmaID, zamanTipi, nedenIDList } = req.body; // nedenIDList: [1, 2, 3] gibi bir dizi

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let whereDateSQL = '';

        if (zamanTipi === 'haftalik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE()) AND DATEPART(WEEK, l.islemTarihi) = DATEPART(WEEK, GETDATE())`;
        } else if (zamanTipi === 'aylik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE()) AND MONTH(l.islemTarihi) = MONTH(GETDATE())`;
        } else if (zamanTipi === 'yillik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE())`;
        } else {
            return res.status(400).json({ error: 'Geçersiz zamanTipi. "haftalik", "aylik" veya "yillik" olmalı.' });
        }

        let query = `
            USE laktasens;
            SELECT 
                y.yemAdi,
                y.yemID,
                SUM(l.miktarKg) AS toplamTuketimKg
            FROM FirmaDepoLog l
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            WHERE l.islemTipi = 'g'
              AND ${whereDateSQL}
        `;

        // Firma filtresi
        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        // Neden filtresi varsa uygula
        if (Array.isArray(nedenIDList) && nedenIDList.length > 0) {
            query += ` AND l.islemNedeniID IN (${nedenIDList.map((_, idx) => `@nedenID${idx}`).join(', ')})`;
            nedenIDList.forEach((id, idx) => {
                request.input(`nedenID${idx}`, id);
            });
        }

        query += `
            GROUP BY y.yemAdi, y.yemID
            ORDER BY toplamTuketimKg DESC
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim verisi bulunamadı.' });
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Toplam tüketim verisi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postSevkListesi = async (req, res) => {
    const { firmaID } = req.body; // Body'den firma ve islem nedeni ID alıyoruz

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let query = `
            SELECT 
                l.logID,
                l.firmaID,
                f.firmaAdi,
                l.yemID,
                y.yemAdi,
                l.miktarKg,
                l.islemTarihi,
                l.aciklama,
                n.nedenAdi,
                l.islemNedeniID,
                k.isim + ' ' + k.soyisim AS kullaniciAdi
            FROM FirmaDepoLog l
            INNER JOIN IslemNedenleri n ON l.islemNedeniID = n.islemNedeniID
            INNER JOIN firmalar f ON l.firmaID = f.firmaID
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            INNER JOIN kullanicilar k ON l.kullaniciID = k.kullaniciID
            WHERE l.islemTipi = 'c'
        `;

        // Eğer firmaID verilmişse
        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        query += ` ORDER BY l.islemTarihi DESC`;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim kaydı bulunamadı.' });
        }

        const formattedResult = result.recordset.map(item => ({
            ...item,
            islemTarihi: item.islemTarihi
                ? new Date(item.islemTarihi).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : null
        }));

        return res.json(formattedResult);
    } catch (error) {
        console.error('Tüketim listesi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postSevkZamanliGrafik = async (req, res) => {
    const { firmaID, zamanTipi, nedenIDList } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let zamanGrubuSQL = '';
        let groupByFields = '';

        if (zamanTipi === 'haftalik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(10), YEAR(l.islemTarihi)) + '-' + 
                RIGHT('0' + CAST(DATEPART(WEEK, l.islemTarihi) AS NVARCHAR(2)), 2)
            `;
            groupByFields = 'YEAR(l.islemTarihi), DATEPART(WEEK, l.islemTarihi), y.yemAdi';
        } 
        else if (zamanTipi === 'aylik') {
            zamanGrubuSQL = `
                CONVERT(NVARCHAR(10), YEAR(l.islemTarihi)) + '-' + 
                RIGHT('0' + CAST(MONTH(l.islemTarihi) AS NVARCHAR(2)), 2)
            `;
            groupByFields = 'YEAR(l.islemTarihi), MONTH(l.islemTarihi), y.yemAdi';
        } 
        else if (zamanTipi === 'yillik') {
            zamanGrubuSQL = `CONVERT(NVARCHAR(4), YEAR(l.islemTarihi))`;
            groupByFields = 'YEAR(l.islemTarihi), y.yemAdi';
        } 
        else {
            return res.status(400).json({ error: 'Geçersiz zamanTipi. "haftalik", "aylik" veya "yillik" olmalı.' });
        }

        let query = `
            USE laktasens;
            SELECT 
                y.yemAdi,
                ${zamanGrubuSQL} AS zamanGrubu,
                SUM(l.miktarKg) AS toplamTuketimKg
            FROM FirmaDepoLog l
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            WHERE l.islemTipi = 'c'
        `;

        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        if (Array.isArray(nedenIDList) && nedenIDList.length > 0) {
            query += ` AND l.islemNedeniID IN (${nedenIDList.map((_, idx) => `@nedenID${idx}`).join(', ')})`;
            nedenIDList.forEach((id, idx) => {
                request.input(`nedenID${idx}`, id);
            });
        }

        query += `
            GROUP BY ${groupByFields}
            ORDER BY zamanGrubu ASC
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim verisi bulunamadı.' });
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Zamanlı tüketim verisi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postSevkToplamGrafik = async (req, res) => {
    const { firmaID, zamanTipi, nedenIDList } = req.body; // nedenIDList: [1, 2, 3] gibi bir dizi

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let whereDateSQL = '';

        if (zamanTipi === 'haftalik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE()) AND DATEPART(WEEK, l.islemTarihi) = DATEPART(WEEK, GETDATE())`;
        } else if (zamanTipi === 'aylik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE()) AND MONTH(l.islemTarihi) = MONTH(GETDATE())`;
        } else if (zamanTipi === 'yillik') {
            whereDateSQL = `YEAR(l.islemTarihi) = YEAR(GETDATE())`;
        } else {
            return res.status(400).json({ error: 'Geçersiz zamanTipi. "haftalik", "aylik" veya "yillik" olmalı.' });
        }

        let query = `
            USE laktasens;
            SELECT 
                y.yemAdi,
                y.yemID,
                SUM(l.miktarKg) AS toplamTuketimKg
            FROM FirmaDepoLog l
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            WHERE l.islemTipi = 'c'
              AND ${whereDateSQL}
        `;

        // Firma filtresi
        if (firmaID) {
            query += ` AND l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }

        // Neden filtresi varsa uygula
        if (Array.isArray(nedenIDList) && nedenIDList.length > 0) {
            query += ` AND l.islemNedeniID IN (${nedenIDList.map((_, idx) => `@nedenID${idx}`).join(', ')})`;
            nedenIDList.forEach((id, idx) => {
                request.input(`nedenID${idx}`, id);
            });
        }

        query += `
            GROUP BY y.yemAdi, y.yemID
            ORDER BY toplamTuketimKg DESC
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim verisi bulunamadı.' });
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Toplam tüketim verisi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postCiflikYemTuketimAnaliz = async (req, res) => {
    const { firmaID, yemID, zamanTipi } = req.body;
  
    if (!['haftalik','aylik','yillik'].includes(zamanTipi))
      return res.status(400).json({ error: 'zamanTipi "haftalik" | "aylik" | "yillik" olmalı' });
    if (!Number.isInteger(firmaID) || !Number.isInteger(yemID))
      return res.status(400).json({ error: 'firmaID & yemID tam sayı olmalı' });
  
    // 1) Geri / ileri aralık
    const beforeCount = zamanTipi === 'haftalik' ? 12
                      : zamanTipi === 'aylik'   ? 6
                                                 : 3;
    const afterCount = beforeCount;
  
    // 2) SQL DATEADD birimi ve baseDate ifadesi
    let unit, baseDateSql, formatString;
    if (zamanTipi === 'haftalik') {
        unit = 'WEEK';
        baseDateSql = 'DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)';
      
        // <<< tek satırda: FORMAT() yerine kendi SQL parçanızı oluşturun >>>
        zamanGrubuSQL = `
          CONVERT(NVARCHAR(4), YEAR(c.periyotDate))
          + '-' +
          RIGHT(
            '0' + CAST(DATEPART(ISO_WEEK, c.periyotDate) AS NVARCHAR(2)),
            2
          )
        `;
    }else if (zamanTipi === 'aylik') {
        unit         = 'MONTH';
        baseDateSql  = "CONVERT(date, DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0))";
        zamanGrubuSQL = `FORMAT(c.periyotDate, 'yyyy-MM')`;
    }
    else { // yillik
        unit         = 'YEAR';
        baseDateSql  = "CONVERT(date, DATEFROMPARTS(YEAR(GETDATE()),1,1))";
        zamanGrubuSQL = `FORMAT(c.periyotDate, 'yyyy')`;
    }
  
    // 3) Dinamik SQL
    const query = `
      USE laktasens;
      DECLARE
        @firmaID  INT   = ${firmaID},
        @yemID    INT   = ${yemID},
        @before   INT   = ${beforeCount},
        @after    INT   = ${afterCount},
        @baseDate DATE  = ${baseDateSql};
  
      ;WITH
      Seq AS (
        SELECT TOP (@before + @after + 1)
          ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - (@before + 1) AS idx
        FROM sys.all_objects
      ),
      Takvim AS (
        SELECT
          idx,
          DATEADD(${unit}, idx, @baseDate) AS periyotDate,
          CASE WHEN idx > 0 THEN 1 ELSE 0 END    AS isFuture
        FROM Seq
      ),
      Historical AS (
        SELECT
          DATEADD(${unit},
                  DATEDIFF(${unit}, 0, l.islemTarihi),
                  0)                              AS periyotDate,
          SUM(CASE WHEN l.islemTipi='c' AND l.islemNedeniID=8
                   THEN l.miktarKg END)         AS tuketimKg,
          SUM(CASE WHEN l.islemTipi='g' THEN l.miktarKg
                   WHEN l.islemTipi='c' THEN -l.miktarKg END)
                                            AS deltaStock
        FROM FirmaDepoLog l
        WHERE l.firmaID     = @firmaID
          AND l.yemID       = @yemID
          AND l.islemTarihi >= DATEADD(${unit}, -@before, @baseDate)
          AND l.islemTarihi <  DATEADD(${unit},  1, @baseDate)
        GROUP BY DATEADD(${unit},
                         DATEDIFF(${unit}, 0, l.islemTarihi),
                         0)
      ),
      AvgCons AS (
        SELECT AVG(tuketimKg * 1.0) AS avgTuketim
        FROM Historical
      ),
      Forecast AS (
        SELECT
          t.periyotDate,
          ac.avgTuketim   AS tuketimKg,
          -ac.avgTuketim  AS deltaStock
        FROM Takvim t
        CROSS JOIN AvgCons ac
        WHERE t.isFuture = 1
      ),
      Combined AS (
        SELECT
          t.idx,
          t.periyotDate,
          COALESCE(h.tuketimKg, f.tuketimKg, 0)    AS tuketimKg,
          COALESCE(h.deltaStock, f.deltaStock, 0)  AS deltaStock
        FROM Takvim t
        LEFT JOIN Historical h
          ON h.periyotDate = t.periyotDate
         AND t.isFuture    = 0
        LEFT JOIN Forecast f
          ON f.periyotDate = t.periyotDate
         AND t.isFuture    = 1
      )
  
      SELECT
        y.yemAdi,
        ${zamanGrubuSQL} AS zamanGrubu,
        c.tuketimKg,
        SUM(c.deltaStock) OVER (
          ORDER BY c.idx
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS depoStok
      FROM Combined c
      CROSS JOIN YemMaddeleri y
      WHERE y.yemID = @yemID
      ORDER BY c.idx;
    `;
  
    try {
      const pool    = await poolPromise;
      const request = pool.request();
      const { recordset } = await request.query(query);
      return res.json(recordset);
    } catch (err) {
      console.error('postCiflikYemTuketimAnaliz error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postCiflikYemDepoGecmisiAnaliz = async (req, res) => {
    const { firmaID, yemID, zamanTipi } = req.body;
  
    if (!['haftalik','aylik','yillik'].includes(zamanTipi))
      return res.status(400).json({ error: 'zamanTipi "haftalik" | "aylik" | "yillik" olmalı' });
    if (!Number.isInteger(firmaID) || !Number.isInteger(yemID))
      return res.status(400).json({ error: 'firmaID & yemID tam sayı olmalı' });
  
    // ───────────────────────────────────────────────
    // 1) Yalnızca geçmiş için kaç dönem geriye gideceğiz
    const beforeCount = zamanTipi === 'haftalik' ? 12   // 12 hafta
                      : zamanTipi === 'aylik'   ? 6    //  6 ay
                                                 : 3;  //  3 yıl
    // ───────────────────────────────────────────────
    // 2) SQL DATEADD birimi, baseDate ve grup kolonu
    let unit, baseDateSql, zamanGrubuSQL;
    if (zamanTipi === 'haftalik') {
      unit         = 'WEEK';
      baseDateSql  = 'DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)';   // içindeki haftanın ilk günü
      zamanGrubuSQL = `
        CONVERT(NVARCHAR(4), YEAR(h.periyotDate))
        + '-' +
        RIGHT('0' + CAST(DATEPART(ISO_WEEK, h.periyotDate) AS NVARCHAR(2)), 2)
      `;
    } else if (zamanTipi === 'aylik') {
      unit         = 'MONTH';
      baseDateSql  = "CONVERT(date, DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0))";
      zamanGrubuSQL = `FORMAT(h.periyotDate, 'yyyy-MM')`;
    } else { // yillik
      unit         = 'YEAR';
      baseDateSql  = "CONVERT(date, DATEFROMPARTS(YEAR(GETDATE()),1,1))";
      zamanGrubuSQL = `FORMAT(h.periyotDate, 'yyyy')`;
    }
  
    // ───────────────────────────────────────────────
    // 3) Dinamik SQL – sadece geçmiş veri
    const query = `
      USE laktasens;
      DECLARE
        @firmaID  INT   = ${firmaID},
        @yemID    INT   = ${yemID},
        @before   INT   = ${beforeCount},
        @baseDate DATE  = ${baseDateSql};
  
        ;WITH Historical AS (
        SELECT
            DATEADD(${unit},
                    DATEDIFF(${unit}, 0, l.islemTarihi), 0)      AS periyotDate,
            SUM(CASE WHEN l.islemTipi='g' THEN  l.miktarKg
                    WHEN l.islemTipi='c' THEN -l.miktarKg END)  AS deltaStock
        FROM FirmaDepoLog l
        WHERE l.firmaID  = @firmaID
            AND l.yemID    = @yemID
            AND l.islemTarihi >= DATEADD(${unit}, -@before, @baseDate)   -- geçmiş limit
            AND l.islemTarihi <  DATEADD(${unit}, 1, @baseDate)          -- BUGÜN dâhil
        GROUP BY DATEADD(${unit},
                        DATEDIFF(${unit}, 0, l.islemTarihi), 0)
        )
      SELECT
        y.yemAdi,
        ${zamanGrubuSQL}                                          AS zamanGrubu,
        SUM(h.deltaStock) OVER (
            ORDER BY h.periyotDate
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                         AS depoStok
      FROM Historical h
      CROSS JOIN YemMaddeleri y
      WHERE y.yemID = @yemID
      ORDER BY h.periyotDate;
    `;
  
    try {
      const pool    = await poolPromise;
      const request = pool.request();
      const { recordset } = await request.query(query);
      return res.json(recordset);   // ← sadece geçmiş stok çıktısı
    } catch (err) {
      console.error('postCiflikYemTuketimAnaliz error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
};  

exports.postSevkKayidiEkle = async (req, res) => {
    const {
      firmaID,
      yemID,
      miktarKg,
      kullaniciID,
      aciklama,
      islemNedeniID
    } = req.body;

    // Gerekli parametre kontrolü
    if (
      firmaID == null ||
      yemID == null ||
      miktarKg == null ||
      kullaniciID == null ||
      islemNedeniID == null
    ) {
      return res.status(400).json({ error: 'Eksik parametre' });
    }
  
    try {
      const pool = await poolPromise;
      const request = pool.request();
  
      request.input('firmaID', sql.Int, firmaID);
      request.input('yemID', sql.Int, yemID);
      request.input('miktarKg', sql.Decimal(18, 2), miktarKg);
      request.input('kullaniciID', sql.Int, kullaniciID);
      request.input('aciklama', sql.NVarChar(250), aciklama || '');
      request.input('islemNedeniID', sql.Int, islemNedeniID);
  
      const result = await request.execute('sp_YemIslemiEkle');
  
      res.json({
        success: true,
        recordset: result.recordset,
        returnValue: result.returnValue
      });
    } catch (err) {
      console.error('SQL Hatası:', err);
      res.status(500).json({ error: 'Sunucu hatası', details: err.message });
    }
};

exports.postCiflikYemDepoGecmisi = async (req, res) => {
    const { firmaID, islemNedeniID, yemID } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let query = `
            SELECT 
                l.logID,
                l.firmaID,
                f.firmaAdi,
                l.yemID,
                y.yemAdi,
                l.miktarKg,
                l.islemTarihi,
                l.aciklama,
                n.nedenAdi,
                l.islemNedeniID,
                k.isim + ' ' + k.soyisim AS kullaniciAdi
            FROM FirmaDepoLog l
            INNER JOIN IslemNedenleri n ON l.islemNedeniID = n.islemNedeniID
            INNER JOIN firmalar f ON l.firmaID = f.firmaID
            INNER JOIN YemMaddeleri y ON l.yemID = y.yemID
            INNER JOIN kullanicilar k ON l.kullaniciID = k.kullaniciID
        `;

        if (firmaID) {
            query += ` WHERE l.firmaID = @firmaID`;
            request.input('firmaID', firmaID);
        }
        
        if (Array.isArray(islemNedeniID) && islemNedeniID.length > 0) {
            // Dinamik IN listesi
            const ids = islemNedeniID.map((_, idx) => `@id${idx}`).join(', ');
            query += ` AND l.islemNedeniID IN (${ids})`;
            islemNedeniID.forEach((id, idx) => {
                request.input(`id${idx}`, id);
            });
        } else if (Number.isInteger(islemNedeniID)) {
            query += ` AND l.islemNedeniID = @islemNedeniID`;
            request.input('islemNedeniID', islemNedeniID);
        }

        if (yemID) {
            query += ` AND l.yemID = @yemID`;
            request.input('yemID', yemID);
        }

        query += ` ORDER BY l.islemTarihi DESC`;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tüketim kaydı bulunamadı.' });
        }

        const formattedResult = result.recordset.map(item => ({
            ...item,
            islemTarihi: item.islemTarihi
                ? new Date(item.islemTarihi).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : null
        }));

        return res.json(formattedResult);
    } catch (error) {
        console.error('Tüketim listesi alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postCiflikYemDepoAnaliz = async (req, res) => {
    const { firmaID, yemID, zamanTipi } = req.body;
  
    if (!['haftalik', 'aylik', 'yillik'].includes(zamanTipi))
      return res.status(400).json({ error: 'zamanTipi "haftalik" | "aylik" | "yillik" olmalı' });
    if (!Number.isInteger(firmaID) || !Number.isInteger(yemID))
      return res.status(400).json({ error: 'firmaID & yemID tam sayı olmalı' });
  
    /* 1) Sadece geçmişe bakıyoruz ─ ileri aralık = 0  */
    const beforeCount = zamanTipi === 'haftalik' ? 12
                      : zamanTipi === 'aylik'   ?  6
                                                 :  3;
    const afterCount  = 0;        // <─ tahmin kaldırıldı!
  
    /* 2) Zaman parametreleri (aynen) */
    let unit, baseDateSql, zamanGrubuSQL;
    if (zamanTipi === 'haftalik') {
      unit        = 'WEEK';
      baseDateSql = 'DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)';
      zamanGrubuSQL = `
        CONVERT(NVARCHAR(4), YEAR(c.periyotDate))
        + '-' +
        RIGHT('0' + CAST(DATEPART(ISO_WEEK, c.periyotDate) AS NVARCHAR(2)), 2)
      `;
    } else if (zamanTipi === 'aylik') {
      unit        = 'MONTH';
      baseDateSql = "CONVERT(date, DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0))";
      zamanGrubuSQL = `FORMAT(c.periyotDate, 'yyyy-MM')`;
    } else {           /* yillik */
      unit        = 'YEAR';
      baseDateSql = "CONVERT(date, DATEFROMPARTS(YEAR(GETDATE()),1,1))";
      zamanGrubuSQL = `FORMAT(c.periyotDate, 'yyyy')`;
    }
  
    /* 3) Dinamik SQL */
    const query = `
      USE laktasens;
      DECLARE
        @firmaID  INT  = ${firmaID},
        @yemID    INT  = ${yemID},
        @before   INT  = ${beforeCount},
        @baseDate DATE = ${baseDateSql};
  
      ;WITH
      /* --- Takvim: yalnızca geçmiş dönemleri üretir --- */
      Seq AS (
        SELECT TOP (@before + 1)
          ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - (@before) AS idx
        FROM sys.all_objects
      ),
      Takvim AS (
        SELECT
          idx,
          DATEADD(${unit}, idx, @baseDate) AS periyotDate
        FROM Seq
      ),
      /* --- Geçmiş hareketler: tüketim + tüm çıkış & giriş --- */
      Historical AS (
        SELECT
          DATEADD(${unit},
                  DATEDIFF(${unit}, 0, l.islemTarihi),
                  0)                              AS periyotDate,
  
          /* Sadece Nedeni=8 olan çıkışlar => tüketim */
          SUM(CASE WHEN l.islemTipi = 'c' AND l.islemNedeniID = 8
                   THEN l.miktarKg END)          AS tuketimKg,
  
          /* Tüm çıkışlar */
          SUM(CASE WHEN l.islemTipi = 'c'
                   THEN l.miktarKg END)          AS cikisKg,
  
          /* Tüm girişler */
          SUM(CASE WHEN l.islemTipi = 'g'
                   THEN l.miktarKg END)          AS girisKg,
  
          /* Stok değişimi */
          SUM(CASE WHEN l.islemTipi = 'g' THEN  l.miktarKg
                   WHEN l.islemTipi = 'c' THEN -l.miktarKg END) AS deltaStock
        FROM FirmaDepoLog l
        WHERE l.firmaID     = @firmaID
          AND l.yemID       = @yemID
          AND l.islemTarihi >= DATEADD(${unit}, -@before, @baseDate)
          AND l.islemTarihi <  DATEADD(${unit},  1, @baseDate)
        GROUP BY DATEADD(${unit},
                         DATEDIFF(${unit}, 0, l.islemTarihi),
                         0)
      ),
      /* --- Takvim + gerçekleşen veriyi birleştir --- */
      Combined AS (
        SELECT
          t.idx,
          t.periyotDate,
          COALESCE(h.tuketimKg, 0) AS tuketimKg,
          COALESCE(h.cikisKg  , 0) AS cikisKg,
          COALESCE(h.girisKg  , 0) AS girisKg,
          COALESCE(h.deltaStock,0) AS deltaStock
        FROM Takvim t
        LEFT JOIN Historical h
          ON h.periyotDate = t.periyotDate
      )
  
      /* --- Sonuç --- */
      SELECT
        y.yemAdi,
        ${zamanGrubuSQL}                       AS zamanGrubu,
        c.tuketimKg,
        c.cikisKg,
        c.girisKg,
        /* kümülatif depo stok seviyesi */
        SUM(c.deltaStock) OVER (
          ORDER BY c.idx
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS depoStok
      FROM Combined c
      CROSS JOIN YemMaddeleri y
      WHERE y.yemID = @yemID
      ORDER BY c.idx;
    `;
  
    try {
      const pool    = await poolPromise;
      const request = pool.request();
      const { recordset } = await request.query(query);
      return res.json(recordset);
    } catch (err) {
      console.error('postCiflikYemTuketimAnaliz error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
};