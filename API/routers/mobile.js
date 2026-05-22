const express = require("express");
const {
  authRequired,
  aiSuggestions,
  dashboard,
  login,
  me,
  milkValues,
  scanQr,
} = require("../controllers/mobile-controller.js");

const router = express.Router();

router.post("/login", login);
router.get("/me", authRequired, me);
router.get("/dashboard", authRequired, dashboard);
router.post("/qr/scan", authRequired, scanQr);
router.get("/cows/:cowId/milk-values", authRequired, milkValues);
router.get("/cows/:cowId/ai-suggestions", authRequired, aiSuggestions);

module.exports = router;
