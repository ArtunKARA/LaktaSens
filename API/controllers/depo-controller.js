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