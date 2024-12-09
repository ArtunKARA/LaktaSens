const { poolPromise } = require("../../service/connection.js");

exports.postServis = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `USE laktasens;

   SELECT 
                    servisteInekler.inekID,
                    servisteInekler.ad,
                    servisteInekler.kalanGun AS guncelGunSayisi,
                    servisteInekler.dollenmeSayisi,
                    servisteInekler.irk,
                    CASE 
                        WHEN servisteInekler.dollenmeSayisi > 2 OR servisteInekler.kalanGun < -127 THEN 'Sürüden Çikarlmali'
                        WHEN servisteInekler.kalanGun < 0 THEN 'Döllenmeli'
                        ELSE 'Serviste'
                    END AS durum
                FROM 
                    (
                        SELECT 
                            inek.inekID,
                            inek.ad,
                            inek.dollenmeSayisi,
                            inek.irk,
                            CASE 
                                WHEN inek.tuttuMu IS NULL THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                                WHEN inek.dollenmeSayisi = 1 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) -- 106
                                WHEN inek.dollenmeSayisi = 2 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) -- 127
                                ELSE -DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                            END AS kalanGun
                        FROM 
                            inek
                        JOIN 
                            kullanicilar ON inek.firmaID = kullanicilar.firmaID
                        WHERE 
                            kullanicilar.kullaniciID = @ID
                            AND inek.dollenmeSayisi > 0
                            AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
                            AND (
                                (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
                                OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
                                OR (inek.sonDogurmaTarihi IS NULL AND inek.sonKuruTarihi IS NULL AND inek.sonSutOlcumTarihi IS NULL AND inek.tuttuMu != 'E')
                                OR (inek.sonKuruTarihi IS NULL AND inek.tuttuMu IS NULL)
                            )
                    ) AS servisteInekler;`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json(null);
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postServisEkle = async (req, res) => {
    const { ID, Tarih, dollenmeSayisi, tuttuMu} = req.body;

    try {
        // Tarih formatını doğrula
        const parsedDate = new Date(Tarih);
        if (isNaN(parsedDate)) {
            return res.status(400).json({ error: "Geçerli bir tarih formatı gönderin (YYYY-MM-DD)." });
        }

        // Tarihi sadece YYYY-MM-DD formatına dönüştür
        const formattedDate = parsedDate.toISOString().split('T')[0];

        const pool = await poolPromise;
        const result = await pool.request()
            .input("ID", ID)
            .input("Tarih", formattedDate)
            .input("dollenmeSayisi", dollenmeSayisi)
            .input("tuttuMu", tuttuMu)
            .query(
                `UPDATE [laktasens].[dbo].[inek]
                 SET 
                    tuttuMu = @tuttuMu, -- Yeni döllenme durumu ('E': Evet, 'H': Hayır)
                    sonDollenme = @Tarih, -- Yeni döllenme tarihi
                    dollenmeSayisi = @dollenmeSayisi + 1  -- Yeni döllenme sayısı
                WHERE inekID = @ID;`
            );

        // Güncelleme sonucunu kontrol et
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "İnek bulunamadı." });
        }

        return res.json({ message: "Güncelleme başarılı." });
    } catch (error) {
        console.error('Güncelleme sırasında hata oluştu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};