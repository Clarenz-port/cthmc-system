const express = require("express");
const router = express.Router();
const { generateReport } = require("../controllers/reportsController");

router.post("/generate", generateReport);

module.exports = router;
