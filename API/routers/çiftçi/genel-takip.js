const express = require("express");
const router = express.Router();

const {
    postGenelTakip,
    postGenelTakipDetay
} = require("../../controllers/çiftçi/genel-takip-controller.js");

router.post("/genelTakip", postGenelTakip); //get login control
router.post("/postGenelTakipDetay", postGenelTakipDetay);

module.exports = router;    