const express = require("express");
const router = express.Router();

const {
    postCikarilacaklar,
    postCikarilanInek
} = require("../../controllers/çiftçi/çıkarılacaklar-controller");
router.post("/postCikarilacaklar",postCikarilacaklar);
router.post("/postCikarilanInek",postCikarilanInek);


module.exports = router;    