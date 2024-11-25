const express = require("express");
const router = express.Router();

const {
    postGiris
} = require("../controllers/login-controller.js");

router.post("/giris", postGiris); //get login control

module.exports = router;    