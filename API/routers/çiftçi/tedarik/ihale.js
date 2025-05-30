const express = require("express");
const router = express.Router();

const {
getYemTanimlari, // bunlar örenek kalkıcak bunlar
postYemTanimlariDetay
} = require("../../../controllers/çiftçi/tedarik/ihale-controller.js");

router.get("/getYemTanimlari",getYemTanimlari);
router.post("/postYemTanimlariDetay",postYemTanimlariDetay);


module.exports = router;    