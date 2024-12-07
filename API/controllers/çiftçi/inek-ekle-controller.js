const { poolPromise } = require("../../service/connection.js");

exports.postGebeTarih = async (req, res) => {
    const {
        ad,
        irk,
        kilo,
        dogumTarih,
        sonDollenme,
        firmaID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ad",ad)
        .input("irk",irk)
        .input("kilo",kilo)
        .input("dogumTarih",dogumTarih)
        .input("sonDollenme",sonDollenme)
        .input("firmaID",firmaID)
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
                    DATEADD(DAY, -85, @sonDollenme), --DOĞURMA TARİHİ
                    @firmaID, --FİRMA ID
                    NULL, --ANNE ID
                    @sonDollenme, --SON DÖLLENME
                    1, -- DÖLLEME SAYISI
                    'E', -- TUTUMU
                    DATEADD(DAY, -145, @sonDollenme), --SON KURU
                    NULL --SONSÜTÖLÇÜM
                );
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

exports.postSonDogumTarih = async (req, res) => {
    const {
        ad,
        irk,
        kilo,
        dogumTarih,
        sonDogurmaTarihi,
        firmaID
      } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input("ad",ad)
        .input("irk",irk)
        .input("kilo",kilo)
        .input("dogumTarih",dogumTarih)
        .input("sonDogurmaTarihi",sonDogurmaTarihi)
        .input("firmaID",firmaID)
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
                    @sonDogurmaTarihi, --DOĞURMA TARİHİ
                    @firmaID, --FİRMA ID
                    NULL, --ANNE ID
                    DATEADD(DAY, -280, @sonDogurmaTarihi), --SON DÖLLENME
                    1, -- DÖLLEME SAYISI
                    NULL, -- TUTUMU
                    DATEADD(DAY, -60, @sonDogurmaTarihi), --SON KURU
                    NULL --SONSÜTÖLÇÜM
                );`
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

exports.postBilinmeyenTarih = async (req, res) => {
    const {
        ad,
        irk,
        kilo,
        dogumTarih,
        sutDongusu,
        yavrulamaDongusu,
        firmaID
      } = req.body;
    try {
        const pool = await poolPromise;
        if(sutDongusu == "sağımda" && yavrulamaDongusu == "serviste" ){
            const result = await pool.request()
            .input("ad",ad)
            .input("irk",irk)
            .input("kilo",kilo)
            .input("dogumTarih",dogumTarih)
            .input("firmaID",firmaID)
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
                        DATEADD(DAY, -10, GETDATE()), --DOĞURMA TARİHİ
                        @firmaID, --FİRMA ID
                        NULL, --ANNE ID
                        DATEADD(DAY, -290, GETDATE()), --SON DÖLLENME
                        1, -- DÖLLEME SAYISI
                        NULL, -- TUTUMU
                        DATEADD(DAY, -70, GETDATE()), --SON KURU
                        NULL --SONSÜTÖLÇÜM
                    );`
            );
        }else if(sutDongusu == "sağımda" && yavrulamaDongusu == "gebe" ){
            const result = await pool.request()
            .input("ad",ad)
            .input("irk",irk)
            .input("kilo",kilo)
            .input("dogumTarih",dogumTarih)
            .input("firmaID",firmaID)
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
                        DATEADD(DAY, -95, GETDATE()), --DOĞURMA TARİHİ
                        @firmaID, --FİRMA ID
                        NULL, --ANNE ID
                        DATEADD(DAY, -10, GETDATE()), --SON DÖLLENME
                        1, -- DÖLLEME SAYISI
                        'E', -- TUTUMU
                        DATEADD(DAY, -145, GETDATE()), --SON KURU
                        NULL --SONSÜTÖLÇÜM
                    );`
            );
        }else if(sutDongusu == "kuruda" && yavrulamaDongusu == "gebe" ){
            const result = await pool.request()
            .input("ad",ad)
            .input("irk",irk)
            .input("kilo",kilo)
            .input("dogumTarih",dogumTarih)
            .input("firmaID",firmaID)
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
                        DATEADD(DAY, -315, GETDATE()), --DOĞURMA TARİHİ
                        @firmaID, --FİRMA ID
                        NULL, --ANNE ID
                        DATEADD(DAY, -230, GETDATE()), --SON DÖLLENME
                        1, -- DÖLLEME SAYISI
                        'E', -- TUTUMU
                        DATEADD(DAY, -10, GETDATE()), --SON KURU
                        NULL --SONSÜTÖLÇÜM
                    );`
            );
        }else{
            return res.status(404).json({ message: "Kayıt eklenemedi." });
        }
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Kayıt eklenemedi." });
          }
          return res.json({ message: "Kayıt başarıyla eklendi." });
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};