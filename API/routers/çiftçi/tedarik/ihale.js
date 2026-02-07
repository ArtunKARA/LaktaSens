const express = require("express");
const router = express.Router();

const {
getYemTanimlari, // bunlar örenek kalkıcak bunlar
postYemTanimlariDetay,
postIhaleOlustur,
postIhaleList,
postIhaleDetay,
postIhaleDurumGuncelle,
postIhaleTeklifList,
postTeklifSec,
postTeklifReddet,
postIhaleDurumLogList,
postTeklifAksiyonLogList
} = require("../../../controllers/çiftçi/tedarik/ihale-controller.js");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);
router.post("/postIhaleOlustur", postIhaleOlustur);
router.post("/postIhaleList", postIhaleList);
router.post("/postIhaleDetay", postIhaleDetay);
router.post("/postIhaleDurumGuncelle", postIhaleDurumGuncelle);
router.post("/postIhaleTeklifList", postIhaleTeklifList);
router.post("/postTeklifSec", postTeklifSec);
router.post("/postTeklifReddet", postTeklifReddet);
router.post("/postIhaleDurumLogList", postIhaleDurumLogList);
router.post("/postTeklifAksiyonLogList", postTeklifAksiyonLogList);


module.exports = router;    
