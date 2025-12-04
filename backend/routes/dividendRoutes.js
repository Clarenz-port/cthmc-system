// routes/dividendRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const dividendController = require("../controllers/dividendController");

// Create dividend (protected)
router.post("/add", verifyToken, dividendController.createDividend);

// Get dividends for a member (protected)
router.get("/member/:id", verifyToken, dividendController.getMemberDividends);

module.exports = router;
