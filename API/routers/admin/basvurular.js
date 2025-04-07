const express = require("express");
const router = express.Router();

const {
    getCifciBasvurular,
    getTedarikciBasvurular,
    postBasvuruKabul,
    postBasvuruRed
} = require("../../controllers/admin/basvurular-controler");

router.get("/getCifciBasvurular",getCifciBasvurular);
router.get("/getTedarikciBasvurular",getTedarikciBasvurular);
router.post("/postBasvuruKabul",postBasvuruKabul);
router.post("/postBasvuruRed",postBasvuruRed);



module.exports = router;    