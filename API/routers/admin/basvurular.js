const express = require("express");
const router = express.Router();

const {
    getCifciBasvurular,
    getTedarikciBasvurular,
    postBasvuruKabul,
    postBasvuruRed,
    getYemBasvurular,
} = require("../../controllers/admin/basvurular-controler");

router.get("/getCifciBasvurular",getCifciBasvurular);
router.get("/getTedarikciBasvurular",getTedarikciBasvurular);
router.post("/postBasvuruKabul",postBasvuruKabul);
router.post("/postBasvuruRed",postBasvuruRed);

router.get("/yem/getYemBasvurular",getYemBasvurular);


module.exports = router;    