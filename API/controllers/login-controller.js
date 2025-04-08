const { poolPromise , sql } = require("../service/connection.js");

exports.postGiris = async (req, res) => {
    const {
        email,
        şifre
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("eposta",email)
        .input("sifre",şifre)
        .query(
            `SELECT
                  K.kullaniciID,
                  K.kullaniciTuru,
                  K.hesapDurumu,
                  K.hesapFirmaYetkisi,
                  K.eposta,
                  K.isim,
                  K.soyisim,
                  K.telefonNo,
                  K.tcNo,
                  K.firmaID,
                  F.hesapDurumu AS firmaHesapDurumu
                  FROM 
                  kullanicilar AS K
                inner join firmalar AS F ON K.firmaID = F.firmaID
                WHERE
                K.eposta = @eposta
                AND K.parola = @sifre`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
        return res.json(result.recordset[0]);
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postKayit = async (req, res) => {
  const {
      city,
      district,
      firmaAdi,
      firmaAdresi,
      firmaEmail,
      firmaTelefonNo,
      firmaTipi,

      firstname,
      lastname,
      email,
      password,
      tcNumber,
      telefonNo,
    
    } = req.body;

  //const hashedPassword = await bcrypt.hash(password, 10);
  try {
      const pool = await poolPromise;
       // 1. Firma Ekle
       const insertFirma = await pool.request()
       .input('firmaAdi', sql.NVarChar, firmaAdi)
       .input('telefonNo', sql.NVarChar, firmaTelefonNo)
       .input('firmaAdresi', sql.NVarChar, firmaAdresi)
       .input('sehirID', sql.Int, city)
       .input('ilceID', sql.Int, district)
       .input('bolge', sql.NVarChar, 'a')
       .input('hesapDurumu', sql.NVarChar, 'b')
       .input('firmaTur', sql.NVarChar, firmaTipi)
       .input('firmaMail', sql.NVarChar, firmaEmail)
       .query(`
           INSERT INTO firmalar (firmaAdi, telefonNo, firmaAdresi, sehirID, ilceID, bolge, hesapDurumu, firmaTur, firmaMail)
           VALUES (@firmaAdi, @telefonNo, @firmaAdresi, @sehirID, @ilceID, @bolge, @hesapDurumu, @firmaTur, @firmaMail);
           SELECT SCOPE_IDENTITY() AS firmaID;
       `);

        const firmaID = insertFirma.recordset[0].firmaID;

        // 2. Kullanıcı Ekle
        await pool.request()
            .input('tcNo', sql.NVarChar, tcNumber)
            .input('eposta', sql.NVarChar, email)
            .input('parola', sql.NVarChar, password)
            .input('kullaniciTuru', sql.NVarChar, firmaTipi)
            .input('isim', sql.NVarChar, firstname)
            .input('soyisim', sql.NVarChar, lastname)
            .input('telefonNo', sql.NVarChar, telefonNo)
            .input('hesapFirmaYetkisi', sql.NVarChar,'a')
            .input('hesapDurumu', sql.NVarChar, 'b')
            .input('firmaID', sql.Int, firmaID)
            .query(`
                INSERT INTO kullanicilar (tcNo, eposta, parola, kullaniciTuru, isim, soyisim, telefonNo, hesapFirmaYetkisi, hesapDurumu, firmaID)
                VALUES (@tcNo, @eposta, @parola, @kullaniciTuru, @isim, @soyisim, @telefonNo, @hesapFirmaYetkisi, @hesapDurumu, @firmaID)
            `);

        res.status(201).json({ message: 'Başvuru başarıyla alındı' });
    } catch (error) {
      console.error('Customer could not be retrieved:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postBasvuruBilgileri = async (req, res) => {
  const {firmaID} = req.body;

  try {
      const pool = await poolPromise;
      const result = await pool.request()
      .input("firmaID",firmaID)
      .query(
          `SELECT 
              f.firmaID AS CompanyID,
              f.firmaAdi AS CompanyName,
              f.firmaTur AS FirmaTipi,
              f.telefonNo AS FirmaTelefonNo,
              f.firmaAdresi,
              f.firmaMail AS FirmaEmail,
              f.sehirID,
              f.ilceID,

              k.kullaniciID,
              k.isim AS Firstname,
              k.soyisim AS Lastname,
              k.tcNo AS TCNumber,
              k.eposta AS Email,
              k.telefonNo AS TelefonNo,

              CONVERT(varchar(10), MAX(r.redTarihi), 120) AS RededilmeTarihi,
              COUNT(r.redEdilenBaşvurularID) AS CompanyRejectedBefore,

              (
                  SELECT TOP 1 redNedeni 
                  FROM RedEdilenBaşvurularFirmalar r2 
                  WHERE r2.firmaID = f.firmaID 
                  ORDER BY r2.redTarihi DESC
              ) AS CompanyRejectedReason

          FROM 
              RedEdilenBaşvurularFirmalar r
		  INNER JOIN 
              firmalar f ON r.firmaID = f.firmaID
          INNER JOIN 
              kullanicilar k ON f.firmaID = k.firmaID
          WHERE 
              r.firmaID = @firmaID
          GROUP BY 
              f.firmaID, f.firmaAdi, f.firmaTur, f.telefonNo, f.firmaAdresi, f.firmaMail, f.sehirID, f.ilceID,
              k.kullaniciID, k.isim, k.soyisim, k.tcNo, k.eposta, k.telefonNo
          `
      );
      if (result.recordset.length === 0) {
        return res.status(404).json(null);
      }
      return res.json(result.recordset[0]);
    } catch (error) {
      console.error('Data could not be retrieved:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.postYenidenBasvuru = async (req, res) => {
  const {
    firmaID,
    city,
    district,
    firmaAdi,
    firmaAdresi,
    firmaEmail,
    firmaTelefonNo,
    firmaTipi,

    firstname,
    lastname,
    email,
    password,
    tcNumber,
    telefonNo,
  } = req.body;

  try {
    const pool = await poolPromise;

    // 1. Firma Güncelle
    await pool.request()
      .input('firmaID', sql.Int, firmaID)
      .input('firmaAdi', sql.NVarChar, firmaAdi)
      .input('telefonNo', sql.NVarChar, firmaTelefonNo)
      .input('firmaAdresi', sql.NVarChar, firmaAdresi)
      .input('sehirID', sql.Int, city)
      .input('ilceID', sql.Int, district)
      .input('firmaMail', sql.NVarChar, firmaEmail)
      .input('firmaTur', sql.NVarChar, firmaTipi)
      .query(`
        UPDATE firmalar
        SET
          firmaAdi = @firmaAdi,
          telefonNo = @telefonNo,
          firmaAdresi = @firmaAdresi,
          sehirID = @sehirID,
          ilceID = @ilceID,
          firmaMail = @firmaMail,
          firmaTur = @firmaTur,
          hesapDurumu = 'b'
        WHERE firmaID = @firmaID
      `);

    // 2. Kullanıcı (Admin) Güncelle
    await pool.request()
      .input('firmaID', sql.Int, firmaID)
      .input('tcNo', sql.NVarChar, tcNumber)
      .input('eposta', sql.NVarChar, email)
      .input('parola', sql.NVarChar, password)
      .input('isim', sql.NVarChar, firstname)
      .input('soyisim', sql.NVarChar, lastname)
      .input('telefonNo', sql.NVarChar, telefonNo)
      .query(`
        UPDATE kullanicilar
        SET
          tcNo = @tcNo,
          eposta = @eposta,
          parola = @parola,
          isim = @isim,
          soyisim = @soyisim,
          telefonNo = @telefonNo,
          hesapDurumu = 'b'
        WHERE firmaID = @firmaID AND hesapFirmaYetkisi = 'a'
      `);

    res.status(200).json({ message: 'Firma ve admin kullanıcısı güncellendi' });

  } catch (error) {
    console.error('Güncelleme sırasında hata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};