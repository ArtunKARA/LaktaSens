require("dotenv").config();

const cors = require("cors");
const express = require("express");
const api = require("./routers/index.js");
const { poolPromise } = require("./service/connection.js");

const app = express();
const port = Number(process.env.PORT || 3030);

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);

app.use("/", api);

poolPromise
  .then(() => {
    app.listen(port, () => {
      console.log(`App started running on ${port}`);
    });
  })
  .catch((err) => {
    console.error("MSSQL baglantisi baslatilamadi:", err);
    process.exit(1);
  });

process.on("SIGINT", () => {
  poolPromise
    .then((pool) => {
      pool.close();
      console.log("\nBaglantilar sonlandiriliyor...");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Baglantilar kapatilirken bir hata olustu:", err);
      process.exit(1);
    });
});
