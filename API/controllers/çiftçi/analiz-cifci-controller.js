const { poolPromise } = require("../../service/connection.js");

exports.postSutDongusuAnaliz = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("id",ID)
        .query(
            `SELECT
                SUM(CASE 
                        -- Sağımda olanlar
                        WHEN 
                            ((inek.sonDogurmaTarihi IS NOT NULL AND inek.sonDollenme IS NOT NULL AND inek.sonKuruTarihi IS NULL) 
                            OR 
                            (NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
                            AND sonDogurmaTarihi > sonKuruTarihi 
                            AND DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) <= 305)) 
                        THEN 1 
                        ELSE 0 
                    END) AS sagimda_olanlar,
                SUM(CASE 
                        -- Kuruda olanlar
                        WHEN 
                            NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
                            AND inek.sonKuruTarihi > inek.sonDogurmaTarihi
                            AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) >= 0 
                        THEN 1 
                        ELSE 0 
                    END) AS kuruda_olanlar,
                SUM(CASE 
                        -- Çıkarılması gerekenler
                        WHEN 
                            ((
								NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
								AND inek.sonKuruTarihi > inek.sonDogurmaTarihi
								AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0
							)
                            OR
                            (	
								((inek.sonDogurmaTarihi IS NOT NULL AND inek.sonDollenme IS NOT NULL AND inek.sonKuruTarihi IS NULL)
								OR 
								(NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
								AND sonDogurmaTarihi > sonKuruTarihi ))
								AND DATEDIFF(DAY, sonDogurmaTarihi, GETDATE()) > 305 
                            ))
                        THEN 1 
                        ELSE 0 
                    END) AS cikarilmasi_gerekenler
            FROM 
                inek
            JOIN 
                kullanicilar ON inek.firmaID = kullanicilar.firmaID
            WHERE 
                kullanicilar.kullaniciID = @ID
                AND inek.dollenmeSayisi > 0;`
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

exports.postYavruDonguAnaliz = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("id",ID)
        .query(
            `USE laktasens;

            SELECT
                SUM(CASE 
                        -- Gebe olanlar: Tuttu mu 'E' ve son döllenme tarihi mevcut
                        WHEN 
                            (servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonSutOlcumTarihi IS NULL AND servisteInekler.tuttuMu = 'E')
                                    OR 
                                    (NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL) 
                                    AND servisteInekler.sonDollenme > servisteInekler.sonDogurmaTarihi 
                                    AND servisteInekler.tuttuMu = 'E'
                                    AND 280 - DATEDIFF(DAY, servisteInekler.sonDollenme, GETDATE()) > 0 )
                        THEN 1 
                        ELSE 0 
                    END) AS gebe_olanlar,
                SUM(CASE 
                        -- Serviste olanlar: Tuttu mu 'H', döllenme sayısı 2 veya daha az, süre uygun
                        WHEN ( servisteInekler.dollenmeSayisi > 0
                                AND NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL)
                                            AND (
                                                (servisteInekler.sonDollenme < servisteInekler.sonDogurmaTarihi AND (servisteInekler.tuttuMu = 'H' OR servisteInekler.tuttuMu IS NULL))
                                                OR (servisteInekler.sonDollenme > servisteInekler.sonDogurmaTarihi AND (servisteInekler.tuttuMu = 'H' OR servisteInekler.tuttuMu IS NULL))
                                                OR (servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonKuruTarihi IS NULL AND servisteInekler.sonSutOlcumTarihi IS NULL AND servisteInekler.tuttuMu != 'E')
                                                OR (servisteInekler.sonKuruTarihi IS NULL AND servisteInekler.tuttuMu IS NULL)
                                            )
                                AND NOT(
                                    servisteInekler.dollenmeSayisi > 2 OR servisteInekler.kalanGun < -127
                                    )
                            ) 
                        THEN 1 
                        ELSE 0 
                    END) AS serviste_olanlar,
                SUM(CASE 
                        -- Çıkarılması gerekenler: Süre dışı veya döllenme sayısı > 2
                        WHEN (servisteInekler.guncelGunSayisi < -127 
                            OR servisteInekler.dollenmeSayisi > 2
                            OR NOT(servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonDollenme IS NULL AND servisteInekler.sonKuruTarihi IS NULL)
                                        AND (
                                            (servisteInekler.sonDollenme < servisteInekler.sonDogurmaTarihi AND (servisteInekler.tuttuMu = 'H' OR servisteInekler.tuttuMu IS NULL))
                                            OR (servisteInekler.sonDollenme > servisteInekler.sonDogurmaTarihi AND (servisteInekler.tuttuMu = 'H' OR servisteInekler.tuttuMu IS NULL))
                                            OR (servisteInekler.sonDogurmaTarihi IS NULL AND servisteInekler.sonKuruTarihi IS NULL AND servisteInekler.sonSutOlcumTarihi IS NULL AND servisteInekler.tuttuMu != 'E')
                                            )
                            AND(
                                servisteInekler.kalanGun < 0
                                AND servisteInekler.dollenmeSayisi > 2 AND servisteInekler.kalanGun < -127
                                )
                            ) 
                        THEN 1 
                        ELSE 0 
                    END) AS cikarilmasi_gerekenler
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
                    JOIN 
                        kullanicilar ON inek.firmaID = kullanicilar.firmaID
                    WHERE 
                        kullanicilar.kullaniciID = @ID
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

exports.postDongudekiIneklerAnaliz = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("id",ID)
        .query(
            `USE laktasens;

            SELECT
                SUM(CASE 
                        -- Erişkin olanlar
                        WHEN 
                            NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL AND inek.dollenmeSayisi > 0) AND NOT inek.dollenmeSayisi = 0
                        THEN 1 
                        ELSE 0 
                    END) AS eriskin_olanlar,
                SUM(CASE 
                        -- Yavru olanlar
                        WHEN 
                           (inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL AND inek.dollenmeSayisi > 0 AND NOT inek.dollenmeSayisi = 0)
                        THEN 1 
                        ELSE 0 
                    END) AS yavru_olanlar
            FROM 
                inek
            JOIN 
                kullanicilar ON inek.firmaID = kullanicilar.firmaID
            WHERE 
                kullanicilar.kullaniciID = @ID;
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