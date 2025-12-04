const BillPayment = require("../models/BillPayment");

exports.addBillPayment = async (req, res) => {
  try {
    const { memberId, billName, amount, date, paymentMethod } = req.body;

    const bill = await BillPayment.create({
      memberId,
      billName,
      amount: parseFloat(amount),
      date,
      paymentMethod: paymentMethod || "cash",
    });

    return res.json({
      message: "Bill payment recorded",
      bill
    });

  } catch (err) {
    console.error("Error saving bill payment:", err);
    return res.status(500).json({ message: "Error saving bill payment" });
  }
};

exports.getMemberBills = async (req, res) => {
  try {
    const { memberId } = req.params;

    const bills = await BillPayment.findAll({
      where: { memberId },
      order: [["date", "DESC"]],
    });

    return res.json(bills);

  } catch (err) {
    console.error("Error fetching bills:", err);
    return res.status(500).json({ message: "Error fetching bills" });
  }
};
