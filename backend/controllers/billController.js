const BillPayment = require("../models/BillPayment");

exports.addBillPayment = async (req, res) => {
  try {
    const { memberId, billName, amount, date } = req.body;

    const bill = await BillPayment.create({
      memberId,
      billName,
      amount,
      date,
    });

    res.json({ message: "Bill payment recorded", bill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving bill payment" });
  }
};
