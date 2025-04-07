const express = require("express");
const router = express.Router();

const {
    getAktifCiflikler,
    getPasifCiflikler,
    getAktifTedarikciler,
    getPasifTedarikciler,
    postFirmaRedBilgileri
} = require("../../controllers/admin/adminFirmalar-controler");

router.get("/getAktifCiflikler",getAktifCiflikler);
router.get("/getPasifCiflikler",getPasifCiflikler);
router.get("/getAktifTedarikciler",getAktifTedarikciler);
router.get("/getPasifTedarikciler",getPasifTedarikciler);
router.post("/postFirmaRedBilgileri",postFirmaRedBilgileri);


module.exports = router;    