const express = require("express");
const router = express.Router();

const {
    postCikarilacaklar,
    postCikarilanInek,
    postCikarilanlar
} = require("../../controllers/çiftçi/çıkarılacaklar-controller");
router.post("/postCikarilacaklar",postCikarilacaklar);
router.post("/postCikarilanInek",postCikarilanInek);
router.post("/postCikarilanlar",postCikarilanlar)


module.exports = router;    