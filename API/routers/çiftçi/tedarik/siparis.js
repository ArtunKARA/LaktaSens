const express = require("express");
const router = express.Router();

const {
getYemTanimlari, // bunlar örenek kalkıcak bunlar
postYemTanimlariDetay,
postSiparisList,
postSiparisIptal,
postSevkiyatList,
postKabulOlustur,
postDepoGirisPlanList
} = require("../../../controllers/çiftçi/tedarik/siparis-controller.js");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);
router.post("/postSiparisList", postSiparisList);
router.post("/postSiparisIptal", postSiparisIptal);
router.post("/postSevkiyatList", postSevkiyatList);
router.post("/postKabulOlustur", postKabulOlustur);
router.post("/postDepoGirisPlanList", postDepoGirisPlanList);


module.exports = router;    
