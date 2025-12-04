const express = require('express');
const router = express.Router();
const { addBillPayment, getMemberBills } = require('../controllers/billController');

// keep router paths small; mount in app with prefix like /api/bills
router.post('/add', addBillPayment);
router.get('/member/:memberId', getMemberBills);

module.exports = router;
