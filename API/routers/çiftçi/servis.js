const express = require("express");
const router = express.Router();

const {
    postServis
} = require("../../controllers/çiftçi/servis-controller.js");
router.post("/postServis",postServis);


module.exports = router;