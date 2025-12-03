// src/page/popup/ReportModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaTimes, FaFilePdf } from "react-icons/fa";
import axios from "axios";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function ReportModal({ isOpen, onClose, endpoints = {} }) {
  // hooks (stable order)
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState([]);
  const [shares, setShares] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [bills, setBills] = useState([]);
  const [error, setError] = useState(null);

  const [scope, setScope] = useState("all"); // all | monthly | yearly
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) arr.push(currentYear + 1 - i);
    return arr;
  }, [currentYear]);

  // Helpers
  function parseDateFromRow(row) {
    if (!row) return null;
    const candidates = [row.date, row.createdAt, row.created_at, row.transaction_date, row.paymentDate, row.paidAt];
    for (const d of candidates) {
      if (!d) continue;
      const dt = d instanceof Date ? d : new Date(d);
      if (!isNaN(dt.getTime())) return dt;
    }
    return null;
  }

  function filterByScope(rows) {
    if (!Array.isArray(rows)) return [];
    if (scope === "all") return rows;
    return rows.filter((r) => {
      const dt = parseDateFromRow(r);
      if (!dt) return false;
      const rMonth = dt.getMonth() + 1;
      const rYear = dt.getFullYear();
      if (scope === "monthly") return rMonth === Number(month) && rYear === Number(year);
      if (scope === "yearly") return rYear === Number(year);
      return true;
    });
  }

  // Fetch data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const tryGet = async (candidates) => {
      for (const url of (candidates || [])) {
        if (!url) continue;
        try {
          const res = await axios.get(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (res && res.status >= 200 && res.status < 300) return res.data;
        } catch (e) {
          // try next
        }
      }
      return null;
    };

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const loansData = (await tryGet([endpoints.loans, "/api/loans", "http://localhost:8000/api/loans"])) || [];
        const sharesData = (await tryGet([endpoints.shares, "/api/shares", "http://localhost:8000/api/shares"])) || [];
        const purchasesData = (await tryGet([endpoints.purchases, "/api/purchases", "http://localhost:8000/api/purchases"])) || [];
        const billsData = (await tryGet([endpoints.bills, "/api/bills", "http://localhost:8000/api/bills"])) || [];

        if (cancelled) return;

        const normalize = (d) => {
          if (!d) return [];
          if (Array.isArray(d)) return d;
          if (Array.isArray(d.rows)) return d.rows;
          if (Array.isArray(d.data)) return d.data;
          return [];
        };

        setLoans(normalize(loansData));
        setShares(normalize(sharesData));
        setPurchases(normalize(purchasesData));
        setBills(normalize(billsData));
      } catch (err) {
        console.error("Report modal fetch error:", err);
        if (!cancelled) setError("Failed to load report data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => (cancelled = true);
  }, [isOpen, endpoints, token]);

  // reset selectors when opened
  useEffect(() => {
    if (isOpen) {
      setScope("all");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
    }
  }, [isOpen]);

  // filtered lists
  const filteredLoans = useMemo(() => filterByScope(loans), [loans, scope, month, year]);
  const filteredShares = useMemo(() => filterByScope(shares), [shares, scope, month, year]);
  const filteredPurchases = useMemo(() => filterByScope(purchases), [purchases, scope, month, year]);
  const filteredBills = useMemo(() => filterByScope(bills), [bills, scope, month, year]);

  // ledger rows
  const ledgerRows = useMemo(() => {
    const rows = [];

    filteredShares.forEach((s) => {
      const dt = parseDateFromRow(s);
      rows.push({
        date: dt ? dt.toISOString().slice(0, 10) : (s.date || s.createdAt || ""),
        description: s.memberName || s.name || s.user?.name || "Share Contribution",
        income: Number(s.shareamount ?? s.shareAmount ?? s.amount ?? s.value ?? 0) || 0,
        expense: 0,
      });
    });

    filteredLoans.forEach((l) => {
      const dt = parseDateFromRow(l);
      const amt = Number(l.loanAmount ?? l.amount ?? l.principal ?? l.total ?? 0) || 0;
      const status = (l.status || l.loanStatus || "").toString().toLowerCase();
      const isRepayment = ["paid", "completed", "closed", "settled"].includes(status);
      rows.push({
        date: dt ? dt.toISOString().slice(0, 10) : (l.date || l.createdAt || ""),
        description: l.memberName || l.name || l.firstName || (isRepayment ? "Loan Repayment" : "Loan Disbursement"),
        income: isRepayment ? amt : 0,
        expense: isRepayment ? 0 : amt,
      });
    });

    filteredPurchases.forEach((p) => {
      const dt = parseDateFromRow(p);
      const total = Number(p.total ?? p.amount ?? 0) || (Array.isArray(p.items) ? p.items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.unitPrice || 0)), 0) : 0);
      rows.push({
        date: dt ? dt.toISOString().slice(0, 10) : (p.date || p.createdAt || ""),
        description: p.memberName || p.userName || p.name || "Purchase",
        income: 0,
        expense: total,
      });
    });

    filteredBills.forEach((b) => {
      const dt = parseDateFromRow(b);
      rows.push({
        date: dt ? dt.toISOString().slice(0, 10) : (b.date || b.createdAt || ""),
        description: b.billName || b.description || "Bill Payment",
        income: 0,
        expense: Number(b.amount ?? b.value ?? 0) || 0,
      });
    });

    rows.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 1e18;
      const db = b.date ? new Date(b.date).getTime() : 1e18;
      return da - db;
    });

    return rows;
  }, [filteredShares, filteredLoans, filteredPurchases, filteredBills]);

  const totals = useMemo(() => {
    const income = ledgerRows.reduce((s, r) => s + Number(r.income || 0), 0);
    const expense = ledgerRows.reduce((s, r) => s + Number(r.expense || 0), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [ledgerRows]);

  // PDF helpers (dynamic import of jspdf & autotable)
  async function generateLedgerPdf() {
    if (!ledgerRows || ledgerRows.length === 0) {
      alert("No ledger rows for selected scope.");
      return;
    }

    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header (green)
      const headerHeight = 60;
      doc.setFillColor(46, 116, 81);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("Accounting Ledger", 40, 36);
      doc.setFontSize(10);
      doc.text(scope === "monthly" ? `${MONTH_NAMES[month - 1]} ${year}` : (scope === "yearly" ? `${year}` : "All records"), pageWidth - 40, 36, { align: "right" });

      const head = [["NO", "DATE", "DESCRIPTION", "INCOME (₱)", "EXPENSE (₱)"]];
      const body = ledgerRows.map((r, i) => [
        i + 1,
        r.date ? (new Date(r.date)).toLocaleDateString('en-PH') : "—",
        r.description || "—",
        r.income ? Number(r.income).toFixed(2) : "",
        r.expense ? Number(r.expense).toFixed(2) : ""
      ]);

      autoTable(doc, {
        startY: headerHeight + 12,
        head,
        body,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [46, 116, 81], textColor: 255, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 250 },
          3: { cellWidth: 100, halign: 'right' },
          4: { cellWidth: 100, halign: 'right' }
        },
        margin: { left: 40, right: 40 }
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : headerHeight + 12 + body.length * 12;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("TOTALS:", 40, finalY + 18);
      doc.text(`Income: ₱${Number(totals.income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 140, finalY + 18);
      doc.text(`Expense: ₱${Number(totals.expense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 300, finalY + 18);

      // Balance box (simple rectangle)
      doc.setFillColor(233, 245, 232);
      doc.rect(pageWidth - 220, finalY + 6, 170, 28, "F");
      doc.setTextColor(27, 68, 36);
      doc.setFontSize(12);
      doc.text(`BALANCE: ₱${Number(totals.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 210, finalY + 26);

      const fileNameParts = ["Ledger_Report"];
      if (scope === "monthly") fileNameParts.push(`${MONTH_NAMES[month - 1]}_${year}`);
      if (scope === "yearly") fileNameParts.push(`${year}`);
      doc.save(fileNameParts.join("_") + ".pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Ensure jspdf and jspdf-autotable are installed.");
    }
  }

  // generic small report pdf builder
  async function generatePdfSimple(title, columns, rows) {
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default || autoTableModule;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(46, 116, 81);
      doc.rect(0, 0, pageWidth, 56, "F");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(title, 40, 34);

      const head = [columns.map((c) => c.label)];
      const body = rows.map((r) => columns.map((c) => String(r[c.key] ?? "")));

      autoTable(doc, {
        startY: 70,
        head,
        body,
        margin: { left: 40, right: 40 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [46, 116, 81], textColor: 255 }
      });

      doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Install jspdf & jspdf-autotable.");
    }
  }

  async function downloadLoansPdf() {
    const rows = filteredLoans.map((l) => ({
      date: parseDateFromRow(l) ? parseDateFromRow(l).toLocaleDateString() : (l.date || l.createdAt || ""),
      member: l.memberName || l.name || l.firstName || "Member",
      amount: Number(l.loanAmount ?? l.amount ?? l.principal ?? 0).toFixed(2),
      status: l.status ?? l.loanStatus ?? ""
    }));
    await generatePdfSimple("Loan Report", [{ key: "date", label: "Date" }, { key: "member", label: "Member" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }], rows);
  }

  async function downloadSharesPdf() {
    const rows = filteredShares.map((s) => ({
      date: parseDateFromRow(s) ? parseDateFromRow(s).toLocaleDateString() : (s.date || s.createdAt || ""),
      member: s.memberName || s.name || s.user?.name || "Member",
      amount: Number(s.shareamount ?? s.shareAmount ?? s.amount ?? s.value ?? 0).toFixed(2),
      method: s.paymentMethod ?? s.method ?? ""
    }));
    await generatePdfSimple("Shares Report", [{ key: "date", label: "Date" }, { key: "member", label: "Member" }, { key: "amount", label: "Amount" }, { key: "Payment method", label: "Method" }], rows);
  }

  async function downloadPurchasesPdf() {
    const rows = filteredPurchases.map((p) => ({
      date: parseDateFromRow(p) ? parseDateFromRow(p).toLocaleDateString() : (p.date || p.createdAt || ""),
      member: p.memberName || p.userName || p.name || "Member",
      items: Array.isArray(p.items) ? p.items.map((i) => `${i.name}(${i.qty})`).join(", ") : JSON.stringify(p.items || ""),
      total: Number(p.total ?? p.amount ?? 0).toFixed(2)
    }));
    await generatePdfSimple("Purchases Report", [{ key: "date", label: "Date" }, { key: "member", label: "Member" }, { key: "items", label: "Items" }, { key: "total", label: "Total" }], rows);
  }

  async function downloadBillsPdf() {
    const rows = filteredBills.map((b) => ({
      date: parseDateFromRow(b) ? parseDateFromRow(b).toLocaleDateString() : (b.date || b.createdAt || ""),
      member: b.memberName || b.userName || b.name || "Member",
      bill: b.billName || b.description || "",
      amount: Number(b.amount ?? b.value ?? 0).toFixed(2)
    }));
    await generatePdfSimple("Bills Report", [{ key: "date", label: "Date" }, { key: "member", label: "Member" }, { key: "bill", label: "Bill" }, { key: "amount", label: "Amount" }], rows);
  }

  function shortPreview(arr = [], limit = 6) {
    if (!Array.isArray(arr) || arr.length === 0) return <div className="text-sm text-gray-500">No records</div>;
    return (
      <div className="text-xs">
        {arr.slice(0, limit).map((r, i) => (
          <div key={i} className="p-2 rounded bg-white border mb-1 text-sm">
            <div className="flex justify-between">
              <div className="font-semibold">{(parseDateFromRow(r) ? parseDateFromRow(r).toLocaleDateString() : r.date ?? r.createdAt ?? "—")}</div>
              <div className="text-right">{(r.shareamount ?? r.amount ?? r.total ?? "") ? `₱${Number(r.shareamount ?? r.amount ?? r.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}</div>
            </div>
            <div className="text-gray-600 truncate">{r.memberName ?? r.name ?? r.billName ?? r.description ?? ''}</div>
          </div>
        ))}
        {arr.length > limit && <div className="text-xs text-gray-500 mt-1">+ {arr.length - limit} more</div>}
      </div>
    );
  }

  // UI
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Reports</h3>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            {scope === "monthly" && (
              <>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded px-2 py-1">
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded px-2 py-1">
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            )}

            {scope === "yearly" && (
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded px-2 py-1">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}

          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">Preview filtered records below. Click the PDF button to download.</p>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Loan Report</h4>
                <div className="text-xs text-gray-500">Records: {filteredLoans.length}</div>
              </div>
              <button onClick={downloadLoansPdf} className="px-3 py-1 bg-red-600 text-white rounded text-sm flex items-center gap-2"><FaFilePdf/> PDF</button>
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Shares Report</h4>
                <div className="text-xs text-gray-500">Records: {filteredShares.length}</div>
              </div>
              <button onClick={downloadSharesPdf} className="px-3 py-1 bg-red-600 text-white rounded text-sm flex items-center gap-2"><FaFilePdf/> PDF</button>
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Purchases</h4>
                <div className="text-xs text-gray-500">Records: {filteredPurchases.length}</div>
              </div>
              <button onClick={downloadPurchasesPdf} className="px-3 py-1 bg-red-600 text-white rounded text-sm flex items-center gap-2"><FaFilePdf/> PDF</button>
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Bills</h4>
                <div className="text-xs text-gray-500">Records: {filteredBills.length}</div>
              </div>
              <button onClick={downloadBillsPdf} className="px-3 py-1 bg-red-600 text-white rounded text-sm flex items-center gap-2"><FaFilePdf/> PDF</button>
            </div>
          </div>

        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded border">Close</button>
        </div>
      </div>
    </div>
  );
}
