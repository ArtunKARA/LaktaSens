const { poolPromise } = require("../../service/connection.js");

exports.getCifciDagilimAnaliz = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT
                SUM(CASE 
                        -- aktif
                        WHEN 
                            (firmaTur = 'c'
                                AND hesapDurumu = 'a') 
                        THEN 1 
                        ELSE 0 
                    END) AS aktif_cifci,
                SUM(CASE 
                        -- pasif
                        WHEN 
                            (firmaTur = 'c'
                                AND hesapDurumu = 'p') 
                        THEN 1 
                        ELSE 0 
                    END) AS pasif_cifci,
                SUM(CASE 
                        -- beklemede
                        WHEN 
                            (firmaTur = 'c'
                                AND hesapDurumu = 'b') 
                        THEN 1 
                        ELSE 0 
                    END) AS beklemede_cifci
            FROM 
                firmalar`
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

exports.getTedarikçiDagilimAnaliz = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT
                SUM(CASE 
                        -- aktif
                        WHEN 
                            (firmaTur = 't'
                                AND hesapDurumu = 'a') 
                        THEN 1 
                        ELSE 0 
                    END) AS aktif_tedarikci,
                SUM(CASE 
                        -- pasif
                        WHEN 
                            (firmaTur = 't'
                                AND hesapDurumu = 'p') 
                        THEN 1 
                        ELSE 0 
                    END) AS pasif_tedarikci,
                SUM(CASE 
                        -- beklemede
                        WHEN 
                            (firmaTur = 't'
                                AND hesapDurumu = 'b') 
                        THEN 1 
                        ELSE 0 
                    END) AS beklemede_tedarikci
            FROM 
                firmalar`
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

exports.getFirmaDagilimAnaliz = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .query(
            `SELECT
                SUM(CASE 
                        -- tedarikçi
                        WHEN 
                            (firmaTur = 't') 
                        THEN 1 
                        ELSE 0 
                    END) AS supplier,
                SUM(CASE 
                        -- çiflik
                        WHEN 
                            (firmaTur = 'c') 
                        THEN 1 
                        ELSE 0 
                    END) AS farm
            FROM 
                firmalar`
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