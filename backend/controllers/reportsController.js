const PDFDocument = require("pdfkit");
const { User, Loan, Shares, Purchase, Bill } = require("../models");

function getTextHeight(doc, text, width) {
  return doc.heightOfString(text, {
    width,
    align: "left",
  });
}

function formatPurchaseItems(items) {
  try {
    // If items is a JSON string, parse it
    if (typeof items === "string") {
      items = JSON.parse(items);
    }

    // If array of objects
    if (Array.isArray(items)) {
      return items
        .map(i => {
          const name = i.name || "item";
          const qty = i.qty || i.quantity || 1;
          return `${name} x${qty}`;
        })
        .join(", ");
    }

    // Fallback
    return String(items || "-");
  } catch (err) {
    return "-";
  }
}

exports.generateReport = async (req, res) => {
  try {
    const { reportType, mode } = req.body;

    const doc = new PDFDocument({ margin: 20, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("COOPERATIVE REPORT", { align: "center" });
    doc.moveDown();

if (mode === "summary") {

  /* =====================================================
     LOAN SUMMARY
  ===================================================== */
  if (reportType === "loans") {

  doc.fontSize(10).text("LOAN SUMMARY REPORT");
  doc.moveDown(1.5);

  const startY = doc.y;
  const rowHeight = 22;

  const col = {
    member: 20,
    count: 190,
    paid: 280,
    amount: 370,
    penalty: 490,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Member", col.member, startY, { width: 140 });
  doc.text("Loan Count", col.count, startY, { width: 70, align: "center", lineBreak: false });
  doc.text("Paid Loans", col.paid, startY, { width: 60, align: "center", lineBreak: false });
  doc.text("Total Amount", col.amount, startY, { width: 100});
  doc.text("Total Penalty", col.penalty, startY, { width: 90});

  doc.moveTo(20, startY + 15).lineTo(570, startY + 15).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(11);

  const members = await User.findAll();

  for (const m of members) {
    const loans = await Loan.findAll({
      where: { userId: m.id },
      order: [["createdAt", "ASC"]],
    });

    if (loans.length === 0) continue;

    const loanCount = loans.length;

    // ✅ COUNT PAID LOANS
    const paidLoanCount = loans.filter(
      (l) => String(l.status).toLowerCase() === "paid"
    ).length;

    const totalAmount = loans.reduce(
      (sum, l) => sum + Number(l.loanAmount || l.amount || 0),
      0
    );

    const totalPenalty = loans.reduce(
      (sum, l) => sum + Number(l.penalty || 0),
      0
    );

    doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 140 });
    doc.text(String(loanCount), col.count, y, { width: 60, align: "center" });
    doc.text(String(paidLoanCount), col.paid, y, { width: 60, align: "center" });

    doc.text(
      totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.amount,
      y,
      { width: 100}
    );

    doc.text(
      totalPenalty.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.penalty,
      y,
      { width: 90}
    );

    y += rowHeight;

    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }
}

/* =====================================================
   PURCHASE SUMMARY
===================================================== */
if (reportType === "purchases") {

  doc.fontSize(10).text("PURCHASE SUMMARY REPORT");
  doc.moveDown(1.5);

  const startY = doc.y;
  const rowHeight = 22;

  const col = {
    member: 20,
    count: 220,
    total: 350,
    paid: 430,
    interest: 520,
  };

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Member", col.member, startY, { width: 130 });
  doc.text("Purchase Count", col.count, startY, { width: 90});
  doc.text("Total Amount", col.total, startY, { width: 80, lineBreak: false });
  doc.text("Paid", col.paid, startY, { width: 60, align: "center", lineBreak: false });
  doc.text("Interest", col.interest, startY, { width: 70, lineBreak: false });

  doc.moveTo(20, startY + 15).lineTo(580, startY + 15).stroke();

  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(11);

  const members = await User.findAll();

  for (const m of members) {
    const purchases = await Purchase.findAll({
      where: { userId: m.id },
      order: [["createdAt", "ASC"]],
    });

    if (purchases.length === 0) continue;

    const purchaseCount = purchases.length;

    const totalAmount = purchases.reduce(
      (sum, p) => sum + Number(p.subtotal || 0),
      0
    );

    const paidCount = purchases.filter(
      (p) => String(p.status).toLowerCase() === "paid"
    ).length;

    const totalInterest = purchases.reduce(
      (sum, p) => sum + Number(p.surcharge || 0),
      0
    );

    doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 130 });
    doc.text(String(purchaseCount), col.count, y, { width: 70});

    doc.text(
      totalAmount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.total,
      y,
      { width: 80 }
    );

    doc.text(String(paidCount), col.paid, y, { width: 60, align: "center" });

    doc.text(
      totalInterest.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.interest,
      y,
      { width: 70 }
    );

    y += rowHeight;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }
}
/* =====================================================
   BILLS SUMMARY
===================================================== */
if (reportType === "bills") {

  doc.fontSize(10).text("BILLS SUMMARY REPORT");
  doc.moveDown(1.5);

  const startY = doc.y;
  const rowHeight = 22;

  const col = {
    member: 20,
    count: 250,
    total: 440,
  };

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Member", col.member, startY, { width: 160 });
  doc.text("Bill Count", col.count, startY, { width: 90, align: "center" });
  doc.text("Total Bills", col.total, startY, { width: 110 });

  doc.moveTo(20, startY + 15).lineTo(570, startY + 15).stroke();

  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(11);

  const members = await User.findAll();

  for (const m of members) {
    const bills = await Bill.findAll({
      where: { memberId: m.id }, // bills use memberId
      order: [["createdAt", "ASC"]],
    });

    if (bills.length === 0) continue;

    const billCount = bills.length;
    const totalBills = bills.reduce(
      (sum, b) => sum + Number(b.amount || 0),
      0
    );

    doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 160 });
    doc.text(String(billCount), col.count, y, { width: 90, align: "center" });

    doc.text(
      totalBills.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.total,
      y,
      { width: 110 }
    );

    y += rowHeight;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }
}

  /* =====================================================
     SHARES SUMMARY
  ===================================================== */
  if (reportType === "shares") {

    doc.fontSize(10).text("SHARES SUMMARY REPORT");
    doc.moveDown(1.5);

    const startY = doc.y;
    const rowHeight = 22;

    const col = {
      member: 20,
      count: 240,
      total: 460,
    };

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Member", col.member, startY, { width: 160 });
    doc.text("Shares Count", col.count, startY, { width: 90, align: "center" });
    doc.text("Total Shares", col.total, startY, { width: 110 });

    doc.moveTo(20, startY + 15).lineTo(570, startY + 15).stroke();

    let y = startY + rowHeight;
    doc.font("Helvetica").fontSize(11);

    const members = await User.findAll();

    for (const m of members) {
      const shares = await Shares.findAll({
        where: { userId: m.id },
        order: [["createdAt", "ASC"]],
      });

      if (shares.length === 0) continue;

      const shareCount = shares.length;
      const totalShares = shares.reduce(
        (sum, s) => sum + Number(s.shareamount || 0),
        0
      );

      const dateText = shares[0]?.createdAt
        ? new Date(shares[0].createdAt).toLocaleDateString("en-PH")
        : "-";

      doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 160 });
      doc.text(String(shareCount), col.count, y, { width: 90, align: "center" });
      doc.text(
        totalShares.toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
        }),
        col.total,
        y,
        { width: 110 }
      );

      y += rowHeight;
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 60;
      }
    }
  }
}

    /* ================= DETAILED MODE ================= */
    if (mode === "detailed") {

      /* -------- LOANS -------- */
      if (reportType === "loans" || reportType === "all") {

  doc.fontSize(14).text("LOANS").moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 80,
    amount: 190,
    duration: 270,
    net: 350,
    paid: 420,
    status: 470,
    check: 530,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 55, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 120, lineBreak: false });
  doc.text("Loan Amount", col.amount, startY, { width: 70});
  doc.text("Duration", col.duration, startY, { width: 55, align: "center", lineBreak: false });
  doc.text("Net Amount", col.net, startY, { width: 70});
  doc.text("Paid", col.paid, startY, { width: 55});
  doc.text("Status", col.status, startY, { width: 50, align: "center", lineBreak: false });
  doc.text("Check #", col.check, startY, { width: 60, lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(585, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const loans = await Loan.findAll({
    include: [{ model: User, attributes: ["firstName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const l of loans) {

    const dateText = l.createdAt
      ? new Date(l.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${l.User?.firstName || ""} ${l.User?.lastName || ""}`.trim();

    const loanAmount = Number(l.loanAmount || l.amount || 0);
    const netAmount = Number(l.netAmount || loanAmount);
    const paymentMade = Number(l.paymentMade || l.amountPaid || 0);

    doc.text(dateText, col.date, y, { width: 55 });
    doc.text(name, col.member, y, { width: 120 });

    doc.text(
      loanAmount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.amount,
      y,
      { width: 70}
    );

    doc.text(
      String(l.duration || l.months || "-"),
      col.duration,
      y,
      { width: 55, align: "center" }
    );

    doc.text(
      netAmount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.net,
      y,
      { width: 70}
    );

    doc.text(
      paymentMade.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.paid,
      y,
      { width: 55}
    );

    doc.text(String(l.status || "-"), col.status, y, {
      width: 50,
      align: "center",
    });

    doc.text(String(l.checkNumber || "-"), col.check, y, { width: 60 });

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}
/* -------- SHARES -------- */
if (reportType === "shares" || reportType === "all") {

  doc.fontSize(14).text("SHARES", { align: "left" }).moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 110,
    amount: 280,
    method: 450,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 60, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 180, lineBreak: false });
  doc.text("Share Amount", col.amount, startY, { width: 90 });
  doc.text("Payment Method", col.method, startY, { width: 100, align: "center", lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(570, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const shares = await Shares.findAll({
    include: [{ model: User, attributes: ["firstName", "middleName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const s of shares) {

    const dateText = s.createdAt
      ? new Date(s.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${s.User?.firstName || ""} ${s.User?.middleName || ""} ${s.User?.lastName || ""}`.trim();

    doc.text(dateText, col.date, y, { width: 60 });

    doc.text(name, col.member, y, { width: 180 });

    doc.text(
      Number(s.shareamount || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.amount,
      y,
      { width: 90}
    );

    doc.text(
      String(s.paymentMethod || "-"),
      col.method,
      y,
      { width: 100, align: "center" }
    );

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}
/* -------- PURCHASES -------- */
if (reportType === "purchases" || reportType === "all") {

  doc.fontSize(14).text("PURCHASES").moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 80,
    items: 200,
    total: 330,
    interest: 400,
    due: 470,
    status: 540,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 55, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 110, lineBreak: false });
  doc.text("Items", col.items, startY, { width: 110, lineBreak: false });
  doc.text("Total", col.total, startY, { width: 65, align: "right", lineBreak: false });
  doc.text("Interest", col.interest, startY, { width: 65, align: "right", lineBreak: false });
  doc.text("Due Date", col.due, startY, { width: 65, align: "center", lineBreak: false });
  doc.text("Status", col.status, startY, { width: 45, align: "center", lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(585, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const purchases = await Purchase.findAll({
    include: [{ model: User, attributes: ["firstName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const p of purchases) {

    const dateText = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${p.User?.firstName || ""} ${p.User?.lastName || ""}`.trim();

    // 🔹 Items (supports string / array / fallback)
   const itemsText = formatPurchaseItems(p.items || p.itemName);


    const totalAmount = Number(p.amount || p.total || 0);
    const interestAmount = Number(p.interest || 0);

    const dueDateText = p.due_date || p.dueDate
      ? new Date(p.due_date || p.dueDate).toLocaleDateString("en-PH")
      : "-";

    doc.text(dateText, col.date, y, { width: 55 });
    doc.text(name, col.member, y, { width: 110 });

    doc.text(itemsText, col.items, y, {
      width: 140,
      ellipsis: true, // prevents long text breaking layout
    });

    doc.text(
      totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.total,
      y,
      { width: 65, align: "right" }
    );

    doc.text(
      interestAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.interest,
      y,
      { width: 65}
    );

    doc.text(dueDateText, col.due, y, { width: 65, align: "center" });

    doc.text(String(p.status || "-"), col.status, y, {
      width: 45,
      align: "center",
    });

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}
/* -------- BILLS -------- */
if (reportType === "bills" || reportType === "all") {

  doc.fontSize(14).text("BILLS").moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 110,
    bill: 280,
    amount: 380,
    method: 470,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 60, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 150, lineBreak: false });
  doc.text("Bill Name", col.bill, startY, { width: 120, lineBreak: false });
  doc.text("Amount", col.amount, startY, { width: 70});
  doc.text("Payment Method", col.method, startY, { width: 90, align: "center", lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(570, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const bills = await Bill.findAll({
    include: [{ model: User, attributes: ["firstName", "middleName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const b of bills) {

    const dateText = b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${b.User?.firstName || ""} ${b.User?.middleName || ""} ${b.User?.lastName || ""}`.trim();

    const billName = b.billName || b.name || "-";
    const paymentMethod = b.paymentMethod || "-";

    doc.text(dateText, col.date, y, { width: 60 });

    doc.text(name, col.member, y, { width: 150 });

    doc.text(billName, col.bill, y, {
      width: 120,
      ellipsis: true, // prevents long bill names from breaking layout
    });

    doc.text(
      Number(b.amount || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.amount,
      y,
      { width: 70}
    );

    doc.text(paymentMethod, col.method, y, {
      width: 90,
      align: "center",
    });

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}

    }

    doc.end();
  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ message: "Report generation failed", error: err.message });
  }
};
