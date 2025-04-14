const express = require("express");
const router = express.Router();

const {
    getYemTanimlari,
    postYemTanimlariDetay
} = require("../../controllers/tedarikci/yemYonetim-controller");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);

module.exports = router;    