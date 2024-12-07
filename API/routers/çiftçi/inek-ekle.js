const express = require("express");
const router = express.Router();

const {
    postGebeTarih,
    postSonDogumTarih,
    postBilinmeyenTarih
} = require("../../controllers/çiftçi/inek-ekle-controller.js");
router.post("/postGebeTarih",postGebeTarih);
router.post("/postSonDogumTarih",postSonDogumTarih);
router.post("/postBilinmeyenTarih",postBilinmeyenTarih);

module.exports = router;    