const express = require("express");
const router = express.Router();

const {
    // Firma Basvurları
    getCifciBasvurular,
    getTedarikciBasvurular,
    postBasvuruKabul,
    postBasvuruRed,
    // Yem Basvurları
    getYemBasvurular,
    postYemRedleri,
    postYemKabul,
    postYemRed,
} = require("../../controllers/admin/basvurular-controler");

router.get("/getCifciBasvurular",getCifciBasvurular);
router.get("/getTedarikciBasvurular",getTedarikciBasvurular);
router.post("/postBasvuruKabul",postBasvuruKabul);
router.post("/postBasvuruRed",postBasvuruRed);

router.get("/yem/getYemBasvurular",getYemBasvurular);
router.post("/yem/postYemRedleri",postYemRedleri);
router.post("/yem/postYemKabul",postYemKabul);
router.post("/yem/postYemRed",postYemRed);


module.exports = router;    