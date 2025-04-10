const express = require("express");
const router = express.Router();

const {

} = require("../../../controllers/admin/tanımlamalar/yemTanimlari-controler");

router.get("/getOlcu",getOlcu);
router.post("/postOlcuEkle",postOlcuEkle);
router.post("/postOlcuGuncele",postOlcuGuncele);
router.post("/postOlcuSil",postOlcuSil);

router.get("/getBesinTipleri", getBesinTipleri);
router.post("/postBesinTipiEkle", postBesinTipiEkle);
router.post("/postBesinTipiGuncelle", postBesinTipiGuncelle);
router.post("/postBesinTipiSil", postBesinTipiSil);



module.exports = router;    