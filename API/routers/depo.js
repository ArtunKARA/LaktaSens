const express = require("express");
const router = express.Router();

const {
    postIslemNedenleri,
    postStokListesi,
    postTuketimListesi,
    postTuketimZamanliGrafik,
    postTuketimToplamGrafik,

    postMalKabulListesi,
    postMalKabulZamanliGrafik,
    postMalKabulToplamGrafik,
} = require("../controllers/depo-controller.js");

router.post("/postIslemNedenleri", postIslemNedenleri);
router.post("/postStokListesi", postStokListesi);
router.post("/postTuketimListesi", postTuketimListesi);
router.post("/postTuketimZamanliGrafik", postTuketimZamanliGrafik);
router.post("/postTuketimToplamGrafik", postTuketimToplamGrafik);

router.post("/postMalKabulListesi", postMalKabulListesi);
router.post("/postMalKabulZamanliGrafik", postMalKabulZamanliGrafik);
router.post("/postMalKabulToplamGrafik", postMalKabulToplamGrafik);
module.exports = router;    