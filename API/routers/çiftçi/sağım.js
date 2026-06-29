const express = require("express");
const router = express.Router();

const {
    postSagim,
    postSagimAksiyon,
    postSutTakip
} = require("../../controllers/çiftçi/sağım-controller.js");
router.post("/postSagim",postSagim);
router.post("/postSagimAksiyon",postSagimAksiyon);
router.post("/postSutTakip",postSutTakip);
module.exports = router;
