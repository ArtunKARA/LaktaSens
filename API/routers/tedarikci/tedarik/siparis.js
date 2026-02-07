const express = require("express");
const router = express.Router();

const {
getYemTanimlari, // bunlar örenek kalkıcak bunlar
postYemTanimlariDetay,
postSiparisList,
postSiparisOnay,
postSiparisRed,
postSevkiyatOlustur,
postSevkiyatList,
postSevkiyatDurumGuncelle,
postIadeList,
postIadeDurumGuncelle
} = require("../../../controllers/tedarikci/tedarik/siparis-controller.js");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);
router.post("/postSiparisList", postSiparisList);
router.post("/postSiparisOnay", postSiparisOnay);
router.post("/postSiparisRed", postSiparisRed);
router.post("/postSevkiyatOlustur", postSevkiyatOlustur);
router.post("/postSevkiyatList", postSevkiyatList);
router.post("/postSevkiyatDurumGuncelle", postSevkiyatDurumGuncelle);
router.post("/postIadeList", postIadeList);
router.post("/postIadeDurumGuncelle", postIadeDurumGuncelle);


module.exports = router;    
