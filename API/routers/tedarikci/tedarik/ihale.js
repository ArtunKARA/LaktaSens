const express = require("express");
const router = express.Router();

const {
getYemTanimlari, // bunlar örenek kalkıcak bunlar
postYemTanimlariDetay,
postAcikIhaleList,
postTeklifOlustur,
postTeklifCek,
postTeklifList,
postIhalelerimList,
postTeklifGuncelle
} = require("../../../controllers/tedarikci/tedarik/ihale-controller.js");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);
router.post("/postAcikIhaleList", postAcikIhaleList);
router.post("/postTeklifOlustur", postTeklifOlustur);
router.post("/postTeklifCek", postTeklifCek);
router.post("/postTeklifList", postTeklifList);
router.post("/postIhalelerimList", postIhalelerimList);
router.post("/postTeklifGuncelle", postTeklifGuncelle);


module.exports = router;    
