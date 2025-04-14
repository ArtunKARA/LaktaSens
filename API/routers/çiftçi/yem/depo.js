const express = require("express");
const router = express.Router();

const {
    postStoklar,
    postYemIslem,
    postYemLogs
} = require("../../../controllers/çiftçi/yem/depo-controller");

router.post("/postStoklar",postStoklar);
router.post("/postYemIslem",postYemIslem);
router.post("/postYemLogs",postYemLogs);




module.exports = router;    