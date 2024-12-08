const express = require("express");
const router = express.Router();

const {
    postYeniDoganlar
} = require("../../controllers/çiftçi/yeni-dogan-controller");
router.post("/postYeniDoganlar",postYeniDoganlar);

module.exports = router;    