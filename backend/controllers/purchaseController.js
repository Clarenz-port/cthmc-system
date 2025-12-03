// controllers/purchasesController.js
const Purchase = require("../models/purchase");

exports.createPurchase = async (req, res) => {
  try {
    // body: { userId, items: [{ name, qty, unitPrice }], paymentMethod, notes }
    const { userId, items, paymentMethod, notes } = req.body;

    // Prefer authenticated user id when available:
    const memberId = req.user?.id || userId;
    if (!memberId) return res.status(400).json({ message: "Missing member id" });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    // compute totals and normalize lines
    let totalAmount = 0;
    const normalized = items.map((it) => {
      const qty = Number(it.qty) || 0;
      const unitPrice = parseFloat(it.unitPrice || 0);
      const lineTotal = parseFloat((qty * unitPrice).toFixed(2));
      totalAmount += lineTotal;
      return {
        name: it.name || "Item",
        qty,
        unitPrice: parseFloat(unitPrice.toFixed(2)),
        lineTotal
      };
    });

    const purchase = await Purchase.create({
      userId: memberId,
      totalAmount: totalAmount.toFixed(2),
      items: normalized,
      paymentMethod: paymentMethod || "cash",
      notes: notes || null
    });

    return res.status(201).json({ message: "Purchase recorded", purchase });
  } catch (err) {
    console.error("❌ Error creating purchase:", err);
    return res.status(500).json({ message: "Error recording purchase" });
  }
};

exports.getMemberPurchases = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (Number.isNaN(memberId)) return res.status(400).json({ message: "Invalid member id" });

    const purchases = await Purchase.findAll({
      where: { userId: memberId },
      order: [["createdAt", "DESC"]],
    });

    return res.json(purchases);
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    return res.status(500).json({ message: "Error fetching purchases" });
  }
};
