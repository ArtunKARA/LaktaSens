const express = require("express");
const router = express.Router();

const {
    getYemTanimlari,
    postYemTanimlariDetay,
    getRasyonDonguler,
    postRasyonDongulerIhtiyac
} = require("../../../controllers/admin/tanımlamalar/yemTanimlari-controler");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);

router.get("/getRasyonDonguler",getRasyonDonguler);
router.post("/postRasyonDongulerIhtiyac",postRasyonDongulerIhtiyac);



module.exports = router;    