const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const purchasesController = require("../controllers/purchaseController");

// NEW — only unpaid purchases
router.get("/pending", verifyToken, purchasesController.getPendingPurchases);

router.post("/add", verifyToken, purchasesController.createPurchase);

router.get("/member/:id", verifyToken, purchasesController.getMemberPurchases);

router.post("/:id/pay", verifyToken, purchasesController.payPurchase);

module.exports = router;
