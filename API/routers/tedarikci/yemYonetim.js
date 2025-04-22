const express = require("express");
const router = express.Router();

const {
    getYemTanimlari,
    postYemTanimlariDetay,
    postYemTanimlariSil,
    postYemTanimlariOlustur,
    postYemTanimlariGuncele,
    postYemTanimlariBesinDegerleriEkle,
    postYemTanimlariBesinDegerleriSil,
    postYemTanimlariBesinDegerleriGuncelle,
    postYemYenidenBasvurma,
} = require("../../controllers/tedarikci/yemYonetim-controller");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);
router.post("/postYemTanimlariSil",postYemTanimlariSil);
router.post("/postYemTanimlariOlustur",postYemTanimlariOlustur);
router.post("/postYemTanimlariGuncele",postYemTanimlariGuncele);
router.post("/postYemTanimlariBesinDegerleriEkle",postYemTanimlariBesinDegerleriEkle);
router.post("/postYemTanimlariBesinDegerleriSil",postYemTanimlariBesinDegerleriSil);
router.post("/postYemTanimlariBesinDegerleriGuncelle",postYemTanimlariBesinDegerleriGuncelle);
router.post("/postYemYenidenBasvurma",postYemYenidenBasvurma);

module.exports = router;    