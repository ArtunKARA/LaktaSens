const express = require("express");
const router = express.Router();

const {
    getOlcu,
    postOlcuEkle,
    postOlcuGuncele,
    postOlcuSil,

    getBesinTipleri,
    postBesinTipiEkle,
    postBesinTipiGuncelle,
    postBesinTipiSil,
} = require("../../../controllers/admin/tanımlamalar/birimler-controler");

router.get("/getOlcu",getOlcu);
router.post("/postOlcuEkle",postOlcuEkle);
router.post("/postOlcuGuncele",postOlcuGuncele);
router.post("/postOlcuSil",postOlcuSil);

router.get("/getBesinTipleri", getBesinTipleri);
router.post("/postBesinTipiEkle", postBesinTipiEkle);
router.post("/postBesinTipiGuncelle", postBesinTipiGuncelle);
router.post("/postBesinTipiSil", postBesinTipiSil);



module.exports = router;    