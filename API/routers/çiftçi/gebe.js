const express = require("express");
const router = express.Router();

const {
    postAllGebe,
    postYavruEkle
} = require("../../controllers/çiftçi/gebe-controller.js");
router.post("/postAllGebe",postAllGebe);
router.post("/postYavruEkle",postYavruEkle);

module.exports = router;    