const express = require("express");
const router = express.Router();

const {
    postSutDongusuAnaliz,
    postYavruDonguAnaliz,
    postDongudekiIneklerAnaliz,
    postCiflikYemDepoTumUrunlerGecmisiAnaliz
} = require("../../controllers/çiftçi/analiz-cifci-controller");
router.post("/postSutDongusuAnaliz",postSutDongusuAnaliz);
router.post("/postYavruDonguAnaliz",postYavruDonguAnaliz);
router.post("/postDongudekiIneklerAnaliz",postDongudekiIneklerAnaliz);
router.post("/postCiflikYemDepoTumUrunlerGecmisiAnaliz", postCiflikYemDepoTumUrunlerGecmisiAnaliz);
module.exports = router;    