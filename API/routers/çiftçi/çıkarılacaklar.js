const express = require("express");
const router = express.Router();

const {
    postCikarilacaklar,
} = require("../../controllers/çiftçi/çıkarılacaklar-controller");
router.post("/postCikarilacaklar",postCikarilacaklar);


module.exports = router;    