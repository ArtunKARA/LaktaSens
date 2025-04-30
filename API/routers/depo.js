const express = require("express");
const router = express.Router();

const {
    postIslemNedenleri,
    postStokListesi,
    postTuketimListesi,
    postTuketimZamanliGrafik,
    postTuketimToplamGrafik
} = require("../controllers/depo-controller.js");

router.post("/postIslemNedenleri", postIslemNedenleri);
router.post("/postStokListesi", postStokListesi);
router.post("/postTuketimListesi", postTuketimListesi);
router.post("/postTuketimZamanliGrafik", postTuketimZamanliGrafik);
router.post("/postTuketimToplamGrafik", postTuketimToplamGrafik);

module.exports = router;    