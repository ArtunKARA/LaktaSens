const express = require("express");
const router = express.Router();

const {
    getYemTanimlari,
    postYemTanimlariDetay,
    getRasyonDonguler,
    postRasyonDongulerIhtiyac,
    postYemTanimlariSil,
    postYemTanimlariOlustur,
    postYemTanimlariGuncele,
    postYemTanimlariBesinDegerleriEkle,
    postYemTanimlariBesinDegerleriSil,
    postYemTanimlariBesinDegerleriGuncelle
} = require("../../../controllers/admin/tanımlamalar/yemTanimlari-controler");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);
router.post("/postYemTanimlariSil",postYemTanimlariSil);
router.post("/postYemTanimlariOlustur",postYemTanimlariOlustur);
router.post("/postYemTanimlariGuncele",postYemTanimlariGuncele);
router.post("/postYemTanimlariBesinDegerleriEkle",postYemTanimlariBesinDegerleriEkle);
router.post("/postYemTanimlariBesinDegerleriSil",postYemTanimlariBesinDegerleriSil);
router.post("/postYemTanimlariBesinDegerleriGuncelle",postYemTanimlariBesinDegerleriGuncelle);



router.get("/getRasyonDonguler",getRasyonDonguler);
router.post("/postRasyonDongulerIhtiyac",postRasyonDongulerIhtiyac);



module.exports = router;    