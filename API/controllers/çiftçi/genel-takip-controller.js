const { poolPromise } = require("../../service/connection.js");

exports.postGenelTakip = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `SELECT 
              inek.inekID AS "İnekID",
              inek.ad AS "İnekAdı",
              inek.irk AS "Irkı",
              DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) AS "Yaşı",  -- Yaş hesaplama
              inek.kilo AS "Kilosu",
              
              -- Süt döngüsünün durumu
              CASE 
                  WHEN  inek.dollenmeSayisi > 0
						AND((inek.sonDogurmaTarihi IS NOT NULL AND inek.sonDollenme IS NOT NULL AND inek.sonKuruTarihi IS NULL)
						OR 
						(NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
						AND sonDogurmaTarihi > sonKuruTarihi))  THEN 'Sağımda'
                  WHEN  inek.dollenmeSayisi > 0
						AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
						AND inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 'Kuruda'
                  ELSE 'Bilinmiyor'
              END AS "SütDöngüsüDurumu",
              
              -- Süt döngüsünde kalan gün sayısı ve durumu
              CASE 
                  WHEN inek.dollenmeSayisi > 0
						AND((inek.sonDogurmaTarihi IS NOT NULL AND inek.sonDollenme IS NOT NULL AND inek.sonKuruTarihi IS NULL)
						OR 
						(NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
						AND sonDogurmaTarihi > sonKuruTarihi)) THEN 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                  WHEN  inek.dollenmeSayisi > 0
						AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
						AND inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE())
                  ELSE NULL
              END AS "SütKalanGünSayısı",
              
              CASE 
                  WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi AND 305 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                  WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi AND 60 - DATEDIFF(DAY, inek.sonKuruTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                  ELSE 'Normal'
              END AS "SütKalanGünDurumu",

              -- Yavru döngüsünün durumu
              CASE 
                  WHEN inek.dollenmeSayisi > 0
						AND (
							(inek.sonDogurmaTarihi IS NULL AND inek.sonSutOlcumTarihi IS NULL AND inek.tuttuMu = 'E')
							OR 
							(NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
							AND inek.sonDollenme > inek.sonDogurmaTarihi 
							AND inek.tuttuMu = 'E')
						) THEN 'Gebe'
                  WHEN  inek.dollenmeSayisi > 0
                        AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
                        AND (
                            (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
                            OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
                            OR (inek.sonDogurmaTarihi IS NULL AND inek.sonKuruTarihi IS NULL AND inek.sonSutOlcumTarihi IS NULL AND inek.tuttuMu != 'E')
                            OR (inek.sonKuruTarihi IS NULL AND inek.tuttuMu IS NULL)
                        )THEN 'Serviste'
                  ELSE 'Çıkarılmalı'
              END AS "YavruDöngüsüDurumu",

              -- Yavru döngüsünde kalan gün sayısı ve durumu
              CASE 
                  WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE())
                  WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
                      OR NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
							AND (
								(inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
								OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
								OR (inek.sonDogurmaTarihi IS NULL AND inek.sonKuruTarihi IS NULL AND inek.sonSutOlcumTarihi IS NULL AND inek.tuttuMu != 'E')
								OR (inek.sonKuruTarihi IS NULL AND inek.tuttuMu IS NULL)
							) THEN
                      CASE 
						WHEN inek.tuttuMu IS NULL THEN 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
						WHEN inek.dollenmeSayisi = 1 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) -- 106
						WHEN inek.dollenmeSayisi = 2 THEN 21 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) -- 127
						ELSE -DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE())
                      END
                  ELSE NULL
              END AS "YavruKalanGünSayısı",

              CASE 
                  WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                  WHEN inek.tuttuMu = 'E' AND 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) >= 0 THEN 'Normal'
				  WHEN inek.tuttuMu IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) > 0 THEN 'Normal'
                  WHEN inek.tuttuMu IS NULL AND 85 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                  WHEN inek.dollenmeSayisi = 1 AND 106 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                  WHEN inek.dollenmeSayisi = 2 AND 127 - DATEDIFF(DAY, inek.sonDogurmaTarihi, GETDATE()) < 0 THEN 'Kontrol Edilmeli'
                  ELSE 'Çıkarılmalı'
              END AS "YavruKalanGünDurumu"

          FROM 
              inek
          JOIN 
              kullanicilar ON inek.firmaID = kullanicilar.firmaID
          WHERE 
              kullanicilar.kullaniciID = @ID
              AND NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL)
			  AND NOT(inek.dollenmeSayisi = 0);`
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

exports.postGenelTakipDetay = async (req, res) => {
    const {
        ID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ID",ID)
        .query(
            `SELECT 
                inek.inekID AS "İnekID",
                inek.ad AS "İnekAdı",
                inek.irk AS "Irkı",
                DATEDIFF(YEAR, inek.dogumTarihi, GETDATE()) AS "Yaşı",  -- Yaş hesaplama
                inek.kilo AS "Kilosu",
                
                -- Süt döngüsünün durumu
                CASE 
                    WHEN inek.sonDogurmaTarihi > inek.sonKuruTarihi THEN 'Sağımda'
                    WHEN inek.sonKuruTarihi > inek.sonDogurmaTarihi THEN 'Kuruda'
                    ELSE 'Bilinmiyor'
                END AS "SütDöngüsüDurumu",

                -- Yavru döngüsünün durumu
                CASE 
                    WHEN inek.sonDollenme > inek.sonDogurmaTarihi AND inek.tuttuMu = 'E' THEN 'Gebe'
                    WHEN (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) 
                        OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL)) THEN 'Serviste'
                    ELSE 'Çıkarılmalı'
                END AS "YavruDöngüsüDurumu",

                -- Yaşam Payı Enerji İhtiyacı
                0.086 * 0.75 * inek.kilo AS "YaşamPayıEnerjiİhtiyacı"
            FROM 
                inek
            WHERE 
                inek.inekID = @ID; -- Kullanıcı ID'si burada belirtiliyor`
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