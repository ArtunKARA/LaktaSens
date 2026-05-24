const sql = require("mssql");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

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

function requiredConfigValue(...names) {
  for (const name of names) {
    const value = process.env[name];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  throw new Error(`Eksik veritabani env degiskeni: ${names.join(" veya ")}`);
}

const config = {
  user: requiredConfigValue("MSSQL_USER", "DB_USER"),
  password: requiredConfigValue("MSSQL_PASSWORD", "DB_PASSWORD"),
  server: requiredConfigValue("MSSQL_SERVER", "DB_SERVER"),
  database: requiredConfigValue("MSSQL_DATABASE", "DB_DATABASE"),
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
