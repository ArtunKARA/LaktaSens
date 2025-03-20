const express = require("express");
const router = express.Router();

const {
    postFirmaBilgileriGetir,
    postFirmaKullanicilarGetir
} = require("../controllers/firma-controller.js");

router.post("/postFirmaBilgileriGetir",postFirmaBilgileriGetir)
router.post("/postFirmaKullanicilarGetir",postFirmaKullanicilarGetir)

module.exports = router;    