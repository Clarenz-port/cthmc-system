// controllers/purchasesController.js
const Purchase = require("../models/purchase");

// Helper to detect one-month payment method
function isOneMonthMethod(pm) {
  if (!pm) return false;
  const s = String(pm).toLowerCase();
  return s.includes("1month") || s.includes("1 month") || s.includes("month to pay") || s.includes("share-deduction") || s.includes("share");
}

exports.createPurchase = async (req, res) => {
  try {
    console.log("[createPurchase] req.user:", req.user);
    console.log("[createPurchase] req.body:", JSON.stringify(req.body));

    const { userId: bodyUserId, items, paymentMethod, notes, memberName, subtotal: bodySubtotal, surcharge: bodySurcharge, total: bodyTotal, dueDate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    // Decide memberId: prefer body.userId then req.user.id
    const requester = req.user ?? null;
    const memberId = bodyUserId ?? (requester && requester.id) ?? null;
    if (!memberId) {
      console.warn("[createPurchase] Missing member id");
      return res.status(400).json({ message: "Missing member id" });
    }

    // Normalize items and compute subtotal
    let computedSubtotal = 0;
    const normalizedItems = items.map((it) => {
      const qty = Number(it.qty) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      const lineTotal = Number((qty * unitPrice).toFixed(2));
      computedSubtotal += lineTotal;
      return {
        name: it.name ?? "Item",
        qty,
        unitPrice: Number(unitPrice.toFixed(2)),
        lineTotal,
      };
    });

    const validatedSubtotal = (typeof bodySubtotal === "number" && !Number.isNaN(bodySubtotal))
      ? Number(bodySubtotal.toFixed(2))
      : Number(computedSubtotal.toFixed(2));

    const oneMonth = isOneMonthMethod(paymentMethod);
    const validatedSurcharge = (typeof bodySurcharge === "number" && !Number.isNaN(bodySurcharge))
      ? Number(bodySurcharge.toFixed(2))
      : (oneMonth ? Number((validatedSubtotal * 0.01).toFixed(2)) : 0);

    const validatedTotal = (typeof bodyTotal === "number" && !Number.isNaN(bodyTotal))
      ? Number(bodyTotal.toFixed(2))
      : Number((validatedSubtotal + validatedSurcharge).toFixed(2));

    const status = oneMonth ? "not paid" : "paid";

    const purchase = await Purchase.create({
      userId: String(memberId),
      memberName: memberName ?? (requester ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim() : null),
      items: normalizedItems,
      subtotal: validatedSubtotal,
      surcharge: validatedSurcharge,
      total: validatedTotal,
      dueDate: dueDate ?? (oneMonth ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null),
      paymentMethod: paymentMethod ?? "cash",
      status,
      notes: notes ?? null,
    });

    console.log("[createPurchase] CREATED =>", { id: purchase.id, paymentMethod: purchase.paymentMethod, status: purchase.status, total: purchase.total, dueDate: purchase.dueDate });

    return res.status(201).json({ message: "Purchase recorded", purchase });
  } catch (err) {
    console.error("[createPurchase] ERROR:", err);
    return res.status(500).json({ message: "Error recording purchase" });
  }
};

exports.getMemberPurchases = async (req, res) => {
  try {
    const memberIdRaw = req.params.id;
    const memberId = memberIdRaw;
    if (!memberId) return res.status(400).json({ message: "Invalid member id" });

    const purchases = await Purchase.findAll({
      where: { userId: String(memberId) },
      order: [["createdAt", "DESC"]],
    });

    return res.json(purchases);
  } catch (err) {
    console.error("[getMemberPurchases] Error:", err);
    return res.status(500).json({ message: "Error fetching purchases" });
  }
};

exports.payPurchase = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing purchase id" });

    const purchase = await Purchase.findByPk(id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    purchase.status = "paid";
    await purchase.save();

    console.log(`[payPurchase] purchase ${id} marked paid`);
    return res.json({ message: "Purchase marked as paid", purchase });
  } catch (err) {
    console.error("[payPurchase] Error:", err);
    return res.status(500).json({ message: "Error marking purchase as paid" });
  }
};
