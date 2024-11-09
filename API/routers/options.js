const express = require("express");
const router = express.Router();

const {
    getCityList,
    getDistrictList
} = require("../controllers/options-controller.js");

router.get("/cityList", getCityList); //pull all city names
router.get("/districtList", getDistrictList); //pull all district names

module.exports = router;