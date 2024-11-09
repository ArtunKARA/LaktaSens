const { poolPromise } = require("../service/connection.js");

exports.getCityList = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(
            `SELECT [ID]
                ,[SehirIlceMahalleAdi]
            FROM [laktasens].[dbo].[bolgeler]
            WHERE [UstID] = 0`
        );
        if (result.recordset.length === 0) {
          return res.status(404).json({ error: "Customer not found." });
        }
        return res.json(result.recordset);
      } catch (error) {
        console.error('Customer could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDistrictList = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", req.query.cityID)
            .query(
                `SELECT [ID]
                    ,[SehirIlceMahalleAdi]
                FROM [laktasens].[dbo].[bolgeler]
                WHERE [UstID] = @id`
            );
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "districtList not found." });
        }
        return res.json(result.recordset);
    } catch (error) {
        console.error('districtList could not be retrieved:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 

