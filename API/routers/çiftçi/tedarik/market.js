const express = require("express");
const {
    postMarketList,
    postMarketDetay,
    postMarketSiparisOlustur
} = require("../../../controllers/çiftçi/tedarik/market-controller.js");

const router = express.Router();

router.post("/postMarketList", postMarketList);
router.post("/postMarketDetay", postMarketDetay);
router.post("/postMarketSiparisOlustur", postMarketSiparisOlustur);

module.exports = router;
