// routes/purchasesRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware"); // keep auth if needed
const purchasesController = require("../controllers/purchaseController");

router.post("/add", verifyToken, purchasesController.createPurchase);
router.get("/member/:id", verifyToken, purchasesController.getMemberPurchases);

module.exports = router;
