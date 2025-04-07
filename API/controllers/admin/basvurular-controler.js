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