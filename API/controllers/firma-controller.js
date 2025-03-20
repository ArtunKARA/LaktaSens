const { poolPromise } = require("../service/connection.js");

exports.postFirmaBilgileriGetir = async (req, res) => {
    const {
        firmaID
    } = req.body;
    try{
        const pool = await poolPromise;
        const result = await pool.request()
            .input("firmaID",firmaID)
            .query(                
                `SELECT [firmaID]
                    ,[firmaAdi]
                    ,[telefonNo]
                    ,[firmaAdresi]
                    ,[sehirID]
                    ,[ilceID]
                    ,[bolge]
                    ,[hesapDurumu]
                    ,[firmaTur]
                    ,[firmaMail]
                FROM [laktasens].[dbo].[firmalar]
                WHERE firmaID = @firmaID	
            `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: "Firma not found." });
            }else{
                return res.json(result.recordset[0]);
            }
    }catch(error){
        console.error('Firma could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.postFirmaKullanicilarGetir = async (req, res) => {
    const {
        firmaID
    } = req.body;
    try{
        const pool = await poolPromise;
        const result = await pool.request()
            .input("firmaID",firmaID)
            .query(                
                `SELECT K.[kullaniciID]
                    ,K.[tcNo]
                    ,K.[eposta]
                    ,K.[kullaniciTuru]
                    ,K.[isim]
                    ,K.[soyisim]
                    ,K.[telefonNo]
                    ,K.[hesapFirmaYetkisi]
                    ,K.[hesapDurumu]
                    ,K.[firmaID]
                FROM kullanicilar as K
                INNER JOIN firmalar AS F ON F.firmaID = K.firmaID
                WHERE
                F.firmaID = @firmaID
            `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: "Firma not found." });
            }else{
                return res.json(result.recordset);
            }
    }catch(error){
        console.error('Firma could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}