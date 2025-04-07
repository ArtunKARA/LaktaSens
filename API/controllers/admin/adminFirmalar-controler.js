const { poolPromise } = require("../../service/connection.js");

exports.getAktifCiflikler = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT 
                f.firmaID AS CompanyID,
                f.firmaAdi AS CompanyName,
                f.telefonNo AS CompanyPhone,
                f.firmaMail AS CompanyMail,
                s.SehirIlceMahalleAdi AS CompanyCity,
                i.SehirIlceMahalleAdi AS CompanyDistrict
            FROM firmalar f
            LEFT JOIN RedEdilenBaşvurularFirmalar r ON f.firmaID = r.firmaID
            LEFT JOIN bolgeler AS s ON f.sehirID = s.ID
            LEFT JOIN bolgeler AS i ON f.ilceID = i.ID
            WHERE 
                f.hesapDurumu = 'a'
                AND f.firmaTur = 'c'
            GROUP BY 
                f.firmaID, f.firmaAdi, f.telefonNo, f.firmaMail, 
                s.SehirIlceMahalleAdi, i.SehirIlceMahalleAdi;`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Data could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPasifCiflikler = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT 
                f.firmaID AS CompanyID,
                f.firmaAdi AS CompanyName,
                f.telefonNo AS CompanyPhone,
                f.firmaMail AS CompanyMail,
                s.SehirIlceMahalleAdi AS CompanyCity,
                i.SehirIlceMahalleAdi AS CompanyDistrict,
                COUNT(r.redEdilenBaşvurularID) AS CompanyRejectedBefore,
                (
                    SELECT TOP 1 redNedeni 
                    FROM RedEdilenBaşvurularFirmalar r2 
                    WHERE r2.firmaID = f.firmaID 
                    ORDER BY r2.redTarihi DESC
                ) AS CompanyRejectedReason
            FROM firmalar f
            LEFT JOIN RedEdilenBaşvurularFirmalar r ON f.firmaID = r.firmaID
            LEFT JOIN bolgeler AS s ON f.sehirID = s.ID
            LEFT JOIN bolgeler AS i ON f.ilceID = i.ID
            WHERE 
                f.hesapDurumu = 'p'
                AND f.firmaTur = 'c'
            GROUP BY 
                f.firmaID, f.firmaAdi, f.telefonNo, f.firmaMail, 
                s.SehirIlceMahalleAdi, i.SehirIlceMahalleAdi;`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Data could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAktifTedarikciler = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT 
                f.firmaID AS CompanyID,
                f.firmaAdi AS CompanyName,
                f.telefonNo AS CompanyPhone,
                f.firmaMail AS CompanyMail,
                s.SehirIlceMahalleAdi AS CompanyCity,
                i.SehirIlceMahalleAdi AS CompanyDistrict
            FROM firmalar f
            LEFT JOIN RedEdilenBaşvurularFirmalar r ON f.firmaID = r.firmaID
            LEFT JOIN bolgeler AS s ON f.sehirID = s.ID
            LEFT JOIN bolgeler AS i ON f.ilceID = i.ID
            WHERE 
                f.hesapDurumu = 'a'
                AND f.firmaTur = 't'
            GROUP BY 
                f.firmaID, f.firmaAdi, f.telefonNo, f.firmaMail, 
                s.SehirIlceMahalleAdi, i.SehirIlceMahalleAdi;`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Data could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPasifTedarikciler = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT 
                f.firmaID AS CompanyID,
                f.firmaAdi AS CompanyName,
                f.telefonNo AS CompanyPhone,
                f.firmaMail AS CompanyMail,
                s.SehirIlceMahalleAdi AS CompanyCity,
                i.SehirIlceMahalleAdi AS CompanyDistrict,
                COUNT(r.redEdilenBaşvurularID) AS CompanyRejectedBefore,
                (
                    SELECT TOP 1 redNedeni 
                    FROM RedEdilenBaşvurularFirmalar r2 
                    WHERE r2.firmaID = f.firmaID 
                    ORDER BY r2.redTarihi DESC
                ) AS CompanyRejectedReason
            FROM firmalar f
            LEFT JOIN RedEdilenBaşvurularFirmalar r ON f.firmaID = r.firmaID
            LEFT JOIN bolgeler AS s ON f.sehirID = s.ID
            LEFT JOIN bolgeler AS i ON f.ilceID = i.ID
            WHERE 
                f.hesapDurumu = 'p'
                AND f.firmaTur = 't'
            GROUP BY 
                f.firmaID, f.firmaAdi, f.telefonNo, f.firmaMail, 
                s.SehirIlceMahalleAdi, i.SehirIlceMahalleAdi;`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Data could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postFirmaRedBilgileri = async (req, res) => {
    const {firmaID} = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("firmaID",firmaID)
        .query(
            `SELECT 
                r.redEdilenBaşvurularID AS redID,
                r.redNedeni AS RededilmeNedeni,
                CONVERT(varchar(10), r.redTarihi, 120) AS RededilmeTarihi,
                CONCAT(k.isim, ' ', k.soyisim) AS ReddedenKullanıcı
            FROM 
                RedEdilenBaşvurularFirmalar r
            INNER JOIN 
                kullanicilar k ON r.kullaniciID = k.kullaniciID
            WHERE 
                r.firmaID = @firmaID;
            `
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Data could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};