const sql = require("mssql");

const config = {
  user: "laktasensAPI", //Kullanıcı adı
  password: "laktasensAPI", //Şifre
  server: "localhost", //Sunucu adı veya IP adresi
  database: "laktasens", //Database
  options: {
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("MSSQL veritabanına başarıyla bağlanıldı.");
    return pool;
  })
  .catch((err) => {
    console.error("MSSQL veritabanına bağlanırken bir hata oluştu:", err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};