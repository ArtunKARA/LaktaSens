const express = require("express");
const router = express.Router();

const {
    postSutDongusuAnaliz,
    postYavruDonguAnaliz,
    postDongudekiIneklerAnaliz
} = require("../../controllers/çiftçi/analiz-cifci-controller");
router.post("/postSutDongusuAnaliz",postSutDongusuAnaliz);
router.post("/postYavruDonguAnaliz",postYavruDonguAnaliz)
router.post("/postDongudekiIneklerAnaliz",postDongudekiIneklerAnaliz)
module.exports = router;    