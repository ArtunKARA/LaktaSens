const express = require("express");
const router = express.Router();

const {
    postServis,
    postServisEkle
} = require("../../controllers/çiftçi/servis-controller.js");
router.post("/postServis",postServis);
router.post("/postServisEkle",postServisEkle);

module.exports = router;