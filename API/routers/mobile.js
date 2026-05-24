const express = require("express");
const {
  authRequired,
  aiSuggestions,
  cowDetail,
  cows,
  dashboard,
  feedStocks,
  health,
  login,
  me,
  milkHistory,
  milkValues,
  scanQr,
  shipmentDetail,
  shipments,
} = require("../controllers/mobile-controller.js");

const router = express.Router();

router.get("/health", health);
router.post("/login", login);
router.get("/me", authRequired, me);
router.get("/dashboard", authRequired, dashboard);
router.get("/cows", authRequired, cows);
router.get("/cows/:cowId", authRequired, cowDetail);
router.post("/qr/scan", authRequired, scanQr);
router.get("/cows/:cowId/milk-values", authRequired, milkValues);
router.get("/cows/:cowId/milk-history", authRequired, milkHistory);
router.get("/cows/:cowId/ai-suggestions", authRequired, aiSuggestions);
router.get("/feed-stocks", authRequired, feedStocks);
router.get("/shipments", authRequired, shipments);
router.get("/shipments/:shipmentId", authRequired, shipmentDetail);

module.exports = router;
