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
                        WHEN servisteInekler.dollenmeSayisi > 2 AND servisteInekler.kalanGun > 127 THEN 'Sürüden Çikarlmali'
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
                            AND (
                                (inek.sonDollenme < inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
                                OR (inek.sonDollenme > inek.sonDogurmaTarihi AND (inek.tuttuMu = 'H' OR inek.tuttuMu IS NULL))
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