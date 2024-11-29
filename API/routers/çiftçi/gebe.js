const express = require("express");
const router = express.Router();

const {
    postAllGebe,
} = require("../../controllers/çiftçi/gebe-controller.js");
router.post("/postAllGebe",postAllGebe);


module.exports = router;    