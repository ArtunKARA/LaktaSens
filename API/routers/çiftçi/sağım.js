const express = require("express");
const router = express.Router();

const {
    postSagim,
    postSagimAksiyon
} = require("../../controllers/çiftçi/sağım-controller.js");
router.post("/postSagim",postSagim);
router.post("/postSagimAksiyon",postSagimAksiyon);
module.exports = router;