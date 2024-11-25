const express = require("express");
const router = express.Router();

const {
    postGiris
} = require("../controllers/genel-takip-controller.js");

router.post("/genelTakip", postGenelTakip); //get login control

module.exports = router;    