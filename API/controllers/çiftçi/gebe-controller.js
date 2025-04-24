const { poolPromise } = require("../../service/connection.js");

exports.postAllGebe = async (req, res) => {
    const {
        id
    } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ID", id)
            .query(
                `USE laktasens;
                SELECT 
                    inek.inekID,
                    inek.ad,
                    inek.irk,
                    280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) AS guncelGunSayisi,
                    CASE 
                        WHEN 280 - DATEDIFF(DAY, inek.sonDollenme, GETDATE()) < 0 
                        THEN 'Kontrol Edilmeli'
                        ELSE 'Gebe'
                    END AS durum
                FROM 
                    inek
                JOIN 
                    kullanicilar ON inek.firmaID = kullanicilar.firmaID
                WHERE 
                    kullanicilar.kullaniciID = @ID
                    AND inek.dollenmeSayisi > 0
                    AND (
                        (inek.sonDogurmaTarihi IS NULL AND inek.sonSutOlcumTarihi IS NULL AND inek.tuttuMu = 'E')
                        OR 
                        (NOT(inek.sonDogurmaTarihi IS NULL AND inek.sonDollenme IS NULL AND inek.sonKuruTarihi IS NULL) 
                        AND inek.sonDollenme > inek.sonDogurmaTarihi 
                        AND inek.tuttuMu = 'E')
                    );


`
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

exports.postYavruEkle = async (req, res) => {
    const {
        anneId,
        ad,
        irk,
        kilo,
        dogumTarih,
        firmaID
    } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("anneId", anneId)
            .input("ad", ad)
            .input("irk", irk)
            .input("kilo", kilo)
            .input("dogumTarih", dogumTarih)
            .input("firmaID", firmaID)
            .query(
                `INSERT INTO [laktasens].[dbo].[inek]
                ([inekQR], [ad], [irk], [kilo], [dogumTarihi], [sonDogurmaTarihi], [firmaID], [anneID], [sonDollenme], [dollenmeSayisi], [tuttuMu], [sonKuruTarihi], [sonSutOlcumTarihi])
            VALUES
                (
                    'QR-' +
                    RIGHT('000' + CAST(@firmaID AS NVARCHAR), 3) + '-' + -- Firma ID'si
                    CONVERT(NVARCHAR, @dogumTarih, 112) + '-' + -- Doğum Tarihi
                    RIGHT('0000' + CAST((SELECT ISNULL(MAX(inekID), 0) + 1 FROM [laktasens].[dbo].[inek]) AS NVARCHAR), 4), -- Benzersiz sıra numarası
                    @ad, --AD
                    @irk, --IRK
                    @kilo, --KİLO
                    @dogumTarih, --DOĞUM TARİHİ
                    NULL, --DOĞURMA TARİHİ
                    @firmaID, --FİRMA ID
                    @anneId, --ANNE ID
                    NULL, --SON DÖLLENME
                    1, -- DÖLLEME SAYISI
                    NULL, -- TUTUMU
                    NULL, --SON KURU
                    NULL --SONSÜTÖLÇÜM
                );
            UPDATE inek
            SET 
                tuttuMu = NULL,-- Yeni döllenme durumu ('E': Evet, 'H': Hayir)
                sonDogurmaTarihi = @dogumTarih,   -- Yeni döllenme tarihi
                dollenmeSayisi = 1   -- Yeni döllenme sayisi
            WHERE inekID = @anneId; 
`
            );
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Kayıt eklenemedi." });
        }
        return res.json({ message: "Kayıt başarıyla eklendi." });
    } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};