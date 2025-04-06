const express = require("express");
const router = express.Router();

const {
    getCifciDagilimAnaliz,
    getTedarikçiDagilimAnaliz,
    getFirmaDagilimAnaliz,
} = require("../../controllers/admin/analiz-controler");

router.get("/getCifciDagilimAnaliz",getCifciDagilimAnaliz);
router.get("/getTedarikciDagilimAnaliz",getTedarikçiDagilimAnaliz);
router.get("/getFirmaDagilimAnaliz",getFirmaDagilimAnaliz);



module.exports = router;    