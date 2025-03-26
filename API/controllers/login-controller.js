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