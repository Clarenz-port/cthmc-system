// routes/purchasesRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const purchasesController = require("../controllers/purchaseController");

// Create purchase
router.post("/add", verifyToken, purchasesController.createPurchase);

// Get member purchases
router.get("/member/:id", verifyToken, purchasesController.getMemberPurchases);

// Pay purchase (mark as paid)
router.post("/:id/pay", verifyToken, purchasesController.payPurchase);

module.exports = router;
