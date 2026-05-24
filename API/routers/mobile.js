const express = require("express");
const {
  adminApplicationAction,
  adminApplications,
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
  supplierOfferAction,
  supplierOffers,
  supplierOrderAction,
  supplierOrders,
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
router.get("/admin/applications", authRequired, adminApplications);
router.post("/admin/applications/:type/:id/action", authRequired, adminApplicationAction);
router.get("/supplier/orders", authRequired, supplierOrders);
router.post("/supplier/orders/:orderId/action", authRequired, supplierOrderAction);
router.get("/supplier/offers", authRequired, supplierOffers);
router.post("/supplier/offers/:offerId/action", authRequired, supplierOfferAction);

module.exports = router;
