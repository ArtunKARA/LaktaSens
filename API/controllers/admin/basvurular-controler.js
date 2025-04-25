const { poolPromise } = require("../../service/connection.js");

exports.getCifciBasvurular = async (req, res) => {
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
                f.hesapDurumu = 'b'
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

exports.getTedarikciBasvurular = async (req, res) => {
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
                f.hesapDurumu = 'b'
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

exports.postBasvuruKabul = async (req, res) => {
    const {firmaID} = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("firmaID", firmaID)
            .query(
                `   UPDATE firmalar
                    SET hesapDurumu = 'a'
                    WHERE firmaID = @firmaID;

                    UPDATE kullanicilar
                    SET hesapDurumu = 'a'
                    WHERE firmaID = @firmaID
                    AND hesapFirmaYetkisi = 'a';`
            );

        // Güncelleme sonucunu kontrol et
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Firma bulunamadı." });
        }

        return res.json({ message: "Güncelleme başarılı." });
    } catch (error) {
        console.error('Güncelleme sırasında hata oluştu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postBasvuruRed = async (req, res) => {
    const {firmaID,redSebebi} = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("firmaID", firmaID)
            .input("redSebebi", redSebebi)
            .query(
                `   BEGIN
                        UPDATE firmalar
                        SET hesapDurumu = 'p'
                        WHERE firmaID = @firmaID;

                        INSERT INTO RedEdilenBaşvurularFirmalar (firmaID, kullaniciID, redNedeni, redTarihi)
                        VALUES (@firmaID, 1, @redSebebi, CAST(GETDATE() AS DATE));

                        UPDATE kullanicilar
                        SET hesapDurumu = 'p'
                        WHERE firmaID = @firmaID;
                    END;`
            );

        // Güncelleme sonucunu kontrol et
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Firma bulunamadı." });
        }

        return res.json({ message: "Güncelleme başarılı." });
    } catch (error) {
        console.error('Güncelleme sırasında hata oluştu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getYemBasvurular = async (req, res) => {
    try {
        const pool = await poolPromise;
    
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
        WHERE ym.durum = 'b';
        `;
    
        const request = pool.request();   // önce request’i oluştur
    
        const result = await request.query(query);
    
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
    
        return res.json(result.recordset);
      } catch (error) {
        console.error('Genel bilgiler alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
}

exports.postYemRedleri = async (req, res) => {
    const {yemID} = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("yemID", yemID)
            .query(
                `   SELECT 
                        r.redEdilenBaşvurularID AS redID,
                        r.redNedeni AS RededilmeNedeni,
                        CONVERT(varchar(10), r.redTarihi, 120) AS RededilmeTarihi,
                        CONCAT(k.isim, ' ', k.soyisim) AS ReddedenKullanıcı
                    FROM 
                        RedEdilenBaşvurularYem r
                    INNER JOIN 
                        kullanicilar k ON r.kullaniciID = k.kullaniciID
                    WHERE 
                        r.yemID = @yemID;`
            );

        if (result.recordset.length === 0) {
            return res.status(404).json(null);
        }

        return res.json(result.recordset);
    } catch (error) {
        console.error('Genel bilgiler alınamadı:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
exports.postYemKabul = async (req, res) => {
    const {yemID} = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("yemID", yemID)
            .query(
                `   UPDATE YemMaddeleri
                    SET durum = 'a'
                    WHERE yemID = @yemID;`
            );

        // Güncelleme sonucunu kontrol et
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Yem bulunamadı." });
        }

        return res.json({ message: "Güncelleme başarılı." });
    } catch (error) {
        console.error('Güncelleme sırasında hata oluştu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.postYemRed = async (req, res) => {
    const {yemID,redNedeni,kullaniciID} = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("yemID", yemID)
            .input("redNedeni", redNedeni)
            .input("kullaniciID", kullaniciID)
            .query(
                `   BEGIN
                        UPDATE YemMaddeleri
                        SET durum = 'p'
                        WHERE yemID = @yemID;

                        INSERT INTO RedEdilenBaşvurularYem (yemID, kullaniciID, redNedeni, redTarihi)
                        VALUES (@yemID, @kullaniciID, @redNedeni, CAST(GETDATE() AS DATE));
                    END;`
            );

        // Güncelleme sonucunu kontrol et
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Yem bulunamadı." });
        }

        return res.json({ message: "Güncelleme başarılı." });
    } catch (error) {
        console.error('Güncelleme sırasında hata oluştu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

