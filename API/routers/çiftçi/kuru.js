const express = require("express");
const router = express.Router();

const {
    postKuru
} = require("../../controllers/çiftçi/kuru-controller.js");
router.post("/postKuru",postKuru);

module.exports = router;    