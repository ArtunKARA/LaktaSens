const express = require("express");
const router = express.Router();

const {
    postSagim
} = require("../../controllers/çiftçi/sağım-controller.js");
router.post("/postSagim",postSagim);

module.exports = router;