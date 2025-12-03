const express = require("express");
const router = express.Router();
const { addBillPayment } = require("../controllers/billController");

router.post("/add", addBillPayment);

module.exports = router;
