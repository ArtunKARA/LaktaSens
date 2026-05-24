const sql = require("mssql");

function optionalNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function optionalBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

const config = {
  user: process.env.MSSQL_USER || process.env.DB_USER || "laktasensAPI",
  password: process.env.MSSQL_PASSWORD || process.env.DB_PASSWORD || "laktasensAPI",
  server: process.env.MSSQL_SERVER || process.env.DB_SERVER || "localhost",
  database: process.env.MSSQL_DATABASE || process.env.DB_DATABASE || "laktasens",
  options: {
    encrypt: optionalBoolean(process.env.MSSQL_ENCRYPT || process.env.DB_ENCRYPT, false),
    trustServerCertificate: optionalBoolean(
      process.env.MSSQL_TRUST_SERVER_CERTIFICATE || process.env.DB_TRUST_SERVER_CERTIFICATE,
      true,
    ),
  },
};

const port = optionalNumber(process.env.MSSQL_PORT || process.env.DB_PORT);

if (port) {
  config.port = port;
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("MSSQL veritabanina basariyla baglanildi.");
    return pool;
  })
  .catch((err) => {
    console.error("MSSQL veritabanina baglanirken bir hata olustu:", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
