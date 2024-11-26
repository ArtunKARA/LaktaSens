const express = require("express");
const router = express.Router();

const {
    postGenelTakip
} = require("../../controllers/çiftçi/genel-takip-controller.js");

router.post("/genelTakip", postGenelTakip); //get login control

module.exports = router;    