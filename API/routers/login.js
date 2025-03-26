const express = require("express");
const router = express.Router();

const {
    postGiris,
    postKayit
} = require("../controllers/login-controller.js");

router.post("/giris", postGiris); //post login control
router.post("/postKayit", postKayit); 

module.exports = router;    