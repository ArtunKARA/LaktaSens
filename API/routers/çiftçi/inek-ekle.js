const express = require("express");
const router = express.Router();

const {
    postGebeTarih,
    postSonDogumTarih,
    postBilinmeyenTarih,
    postYavru
} = require("../../controllers/çiftçi/inek-ekle-controller.js");
router.post("/postGebeTarih",postGebeTarih);
router.post("/postSonDogumTarih",postSonDogumTarih);
router.post("/postBilinmeyenTarih",postBilinmeyenTarih);
router.post("/postYavru",postYavru)

module.exports = router;    