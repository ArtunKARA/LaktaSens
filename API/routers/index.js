const express = require("express");
const options = require("./options.js");
const login = require("./login.js");
const genelTakip = require("./genel-takip.js");


const router = express.Router();

router.get("/", (req, res) => {
    res.send("Working API");
});

// Router definition
router.use("/api/options", options);
router.use("/api/login", login);
router.use("/api/genelTakip",genelTakip)

module.exports = router;
