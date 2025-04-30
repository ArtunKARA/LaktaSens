const express = require("express");
const router = express.Router();

const {
    postStokListesi,
} = require("../../../controllers/çiftçi/yem/yem-hesaplama-controller");

router.post("/postStokListesi",postStokListesi);




module.exports = router;    