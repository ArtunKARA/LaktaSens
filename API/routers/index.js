const express = require("express");
const options = require("./options.js");



const router = express.Router();

router.get("/", (req, res) => {
    res.send("Working API");
});

// Router definition
router.use("/api/options", options);

module.exports = router;
