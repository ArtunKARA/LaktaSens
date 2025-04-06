const express = require("express");
const options = require("./options.js");
const login = require("./login.js");
const genelTakip = require("./çiftçi/genel-takip.js");
const kullanıcı = require("./kullanıcı.js");
const sağım = require("./çiftçi/sağım.js");
const kuru = require("./çiftçi/kuru.js");
const gebe = require("./çiftçi/gebe.js");
const servis = require("./çiftçi/servis.js");
const çıkarılacaklar = require("./çiftçi/çıkarılacaklar.js");
const inekEkle = require("./çiftçi/inek-ekle.js");
const yeniDogan = require("./çiftçi/yeni-dogan.js");
const cifciAnaliz = require("./çiftçi/analiz-cifci.js");
const firma = require("./firma.js");
const adminAnaliz = require("./admin/analiz.js");


const router = express.Router();

router.get("/", (req, res) => {
    res.send("Working API");
});

// Router definition
router.use("/api/options", options);
router.use("/api/login", login);
router.use("/api/genelTakip",genelTakip);
router.use("/api/kullanıcı",kullanıcı);
router.use("/api/sagim",sağım);
router.use("/api/kuru",kuru);
router.use("/api/gebe",gebe);
router.use("/api/servis",servis);
router.use("/api/cikarilacaklar",çıkarılacaklar);
router.use("/api/inekEkle",inekEkle);
router.use("/api/yeniDogan",yeniDogan);
router.use("/api/cifciAnaliz",cifciAnaliz);
router.use("/api/firma",firma);
router.use("/api/adminAnaliz",adminAnaliz);

module.exports = router;
