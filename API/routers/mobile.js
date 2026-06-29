const express = require("express");
const {
  adminApplicationAction,
  adminApplications,
  authRequired,
  aiSuggestions,
  cancelMilkingJob,
  cowDetail,
  cows,
  createSensor,
  createMilkingJob,
  dashboard,
  feedStocks,
  finishMilkingJob,
  health,
  login,
  me,
  milkingJob,
  milkHistory,
  milkValues,
  scanQr,
  sensorActiveJob,
  sensorMeasurement,
  sensorOnline,
  sensors,
  shipmentDetail,
  shipments,
  supplierOfferAction,
  supplierOffers,
  supplierOrderAction,
  supplierOrders,
  submitMilkingJob,
} = require("../controllers/mobile-controller.js");

const router = express.Router();

router.get("/health", health);
router.post("/login", login);
router.get("/me", authRequired, me);
router.get("/dashboard", authRequired, dashboard);
router.get("/cows", authRequired, cows);
router.get("/cows/:cowId", authRequired, cowDetail);
router.post("/qr/scan", authRequired, scanQr);
router.get("/sensors", authRequired, sensors);
router.post("/sensors", authRequired, createSensor);
router.post("/milking-jobs", authRequired, createMilkingJob);
router.get("/milking-jobs/:jobId", authRequired, milkingJob);
router.post("/milking-jobs/:jobId/finish", authRequired, finishMilkingJob);
router.post("/milking-jobs/:jobId/submit", authRequired, submitMilkingJob);
router.post("/milking-jobs/:jobId/cancel", authRequired, cancelMilkingJob);
router.get("/cows/:cowId/milk-values", authRequired, milkValues);
router.get("/cows/:cowId/milk-history", authRequired, milkHistory);
router.get("/cows/:cowId/ai-suggestions", authRequired, aiSuggestions);
router.post("/sensor/online", sensorOnline);
router.get("/sensor/jobs/active", sensorActiveJob);
router.post("/sensor/jobs/active", sensorActiveJob);
router.post("/sensor/measurements", sensorMeasurement);
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
