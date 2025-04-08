const express = require("express");
const router = express.Router();

const {
    postGiris,
    postKayit,
    postBasvuruBilgileri,
    postYenidenBasvuru,
} = require("../controllers/login-controller.js");

router.post("/giris", postGiris); //post login control
router.post("/postKayit", postKayit); 
router.post("/postBasvuruBilgileri", postBasvuruBilgileri); 
router.post("/postYenidenBasvuru", postYenidenBasvuru); 


module.exports = router;    