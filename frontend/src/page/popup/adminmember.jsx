import React, { useState, useEffect } from "react";
import PaidLoanPopup from "./adminmem/paidloan.jsx";
import AddSharesPopup from "../popup/AddSharesPopup.jsx";
import AddPurchasePopup from "../popup/AddPurchasePopup.jsx";
import AddBillPaymentPopup from "../popup/AddBillPaymentPopup.jsx";
import LoanApplication from "../popup/Loanappli.jsx";
import Sharehistory from "../popup/Sharehistory.jsx";
import AddDividendPopup from "../popup/AddDividendPopup.jsx";
import AddDividendHistoryPopup from "../popup/AddDividendHistoryPopup.jsx";
import axios from "axios";

export default function MemberDetails({ member, onBack }) {
  const [isPaidPopupOpen, setIsPaidPopupOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isBillHistoryOpen, setIsBillHistoryOpen] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isLoanAppOpen, setIsLoanAppOpen] = useState(false);
  const [isShareHistoryOpen, setIsShareHistoryOpen] = useState(false);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);

  const [loanHistory, setLoanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLoans, setTotalLoans] = useState(0);

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchase1, setSelectedPurchase1] = useState(null);
  const [processingPayId, setProcessingPayId] = useState(null);

  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);

  const [memberShares, setMemberShares] = useState(0);
  const [loadingShares, setLoadingShares] = useState(true);
  const [shareRows, setShareRows] = useState([]);

  // dividend states
  const [isDividendOpen, setIsDividendOpen] = useState(false);
  const [isDividendHistoryOpen, setIsDividendHistoryOpen] = useState(false);
  const [dividends, setDividends] = useState([]);
  const [loadingDividends, setLoadingDividends] = useState(true);

  const loan = loanHistory[0];
  const name =
    `${member.firstName || ""} ${member.middleName || ""} ${member.lastName || ""}`.trim() ||
    member.memberName ||
    member.name ||
    "Member";
  const membership = member.createdAt || "Regular Member";

  const formatPeso = (value) => {
    const n = Number(value) || 0;
    return n.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    });
  };

  // ---------- Shares ----------
  async function fetchMemberSharesTotal() {
    setLoadingShares(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/shares/member/${encodeURIComponent(member.id)}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const rows = res.data ?? [];
      const sum = rows.reduce((acc, r) => {
        const v = Number(r.shareamount ?? r.shareAmount ?? r.amount ?? 0);
        return acc + (Number.isNaN(v) ? 0 : v);
      }, 0);
      setShareRows(Array.isArray(rows) ? rows : []);
      setMemberShares(sum);
    } catch (err) {
      console.error("Failed to fetch member shares:", err?.response?.data || err);
      setMemberShares(Number(member.shares) || 0);
      setShareRows([]);
    } finally {
      setLoadingShares(false);
    }
  }

  // ---------- Purchases ----------
  async function fetchMemberPurchases() {
    setLoadingPurchases(true);
    try {
      const token = localStorage.getItem("token");
      const id = encodeURIComponent(member.id);
      const res = await axios.get(`/api/purchases/member/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      const raw = Array.isArray(res.data) ? res.data : res.data.purchases ?? [];

      const normalized = raw.map((p) => {
        let rawItems = p.items ?? p.item ?? p.lines ?? [];
        if (typeof rawItems === "string") {
          try {
            const parsed = JSON.parse(rawItems);
            rawItems = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            rawItems = [];
          }
        }
        if (!Array.isArray(rawItems) && rawItems && typeof rawItems === "object") {
          const maybeArray = Object.keys(rawItems)
            .sort()
            .map((k) => rawItems[k])
            .filter((v) => v != null);
          rawItems = Array.isArray(maybeArray) ? maybeArray : [];
        }
        if (!Array.isArray(rawItems)) rawItems = [];

        return {
          ...p,
          id: p.id ?? p._id ?? p.purchaseId,
          total: Number(p.total ?? p.totalAmount ?? p.totalComputed ?? 0),
          items: rawItems,
          dueDate: p.dueDate ?? null,
          createdAt: p.createdAt ?? p.created_at,
          status: p.status ?? p.paymentStatus ?? "unknown",
        };
      });

      setPurchases(normalized);
    } catch (err) {
      console.error("Failed to fetch purchases:", err?.response?.data || err);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  }

  // ---------- Bills ----------
  async function fetchMemberBills() {
    setLoadingBills(true);
    try {
      const token = localStorage.getItem("token");
      const id = encodeURIComponent(member.id);
      const res = await axios.get(`/api/bills/member/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });

      const raw = Array.isArray(res.data) ? res.data : res.data.bills ?? res.data.payments ?? [];

      const normalized = raw.map((b) => ({
        ...b,
        id: b.id ?? b._id ?? b.paymentId,
        date: b.date ?? b.paidAt ?? b.createdAt ?? b.created_at,
        billName: b.name ?? b.billName ?? b.description ?? b.bill ?? "Bill",
        amount: Number(b.amount ?? b.total ?? b.paymentAmount ?? 0),
        paymentMethod: b.paymentMethod ?? b.method ?? b.mode ?? "Unknown",
        status: b.status ?? b.paymentStatus ?? "unknown",
      }));

      setBills(Array.isArray(normalized) ? normalized : []);
    } catch (err) {
      console.error("Failed to fetch bills:", err?.response?.data || err);
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  }

  // ---------- Dividends ----------
  async function fetchMemberDividends() {
    setLoadingDividends(true);
    try {
      const token = localStorage.getItem("token");
      const id = encodeURIComponent(member.id);
      const res = await axios.get(`/api/dividends/member/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        validateStatus: null,
      });

      if (res.status === 204 || res.status === 404) {
        setDividends([]);
        return;
      }
      if (res.status >= 400) {
        console.warn("fetchMemberDividends returned", res.status, res.data);
        setDividends([]);
        return;
      }

      const raw = Array.isArray(res.data) ? res.data : res.data?.dividends ?? res.data?.rows ?? [];
      const normalized = (Array.isArray(raw) ? raw : []).map((d) => ({
        id: d.id ?? d._id ?? d.dividendId,
        memberId: d.memberId ?? d.userId ?? d.member,
        amount: Number(d.amount ?? d.dividend ?? 0),
        date: d.date ?? d.createdAt ?? d.created_at,
        note: d.note ?? d.remarks ?? "",
        raw: d,
      }));
      setDividends(normalized);
    } catch (err) {
      console.error("Failed to fetch dividends:", err?.response?.data || err);
      setDividends([]);
    } finally {
      setLoadingDividends(false);
    }
  }

  // ---------- Loans & other fetches ----------
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/loans/member/${encodeURIComponent(member.id)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });

        // handle different shapes & treat 204/404 as empty
        if (res.status === 204 || res.status === 404) {
          setLoanHistory([]);
        } else if (res.status >= 400) {
          setLoanHistory([]);
        } else {
          // support res.data.loan (single) or array shapes
          if (Array.isArray(res.data)) setLoanHistory(res.data);
          else if (res.data?.loan) setLoanHistory([res.data.loan]);
          else if (res.data?.loans) setLoanHistory(res.data.loans);
          else if (res.data && typeof res.data === "object" && (res.data.id || res.data.loanAmount)) setLoanHistory([res.data]);
          else setLoanHistory([]);
        }
      } catch (err) {
        setLoanHistory([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTotalLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/loans/member/${encodeURIComponent(member.id)}/loan-count`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        setTotalLoans((res.data && (res.data.totalLoans ?? res.data.total)) || 0);
      } catch (err) {
        console.error("❌ Error fetching total loans:", err);
        setTotalLoans(0);
      }
    };

    // run all
    fetchLoans();
    fetchTotalLoans();
    fetchMemberSharesTotal();
    fetchMemberPurchases();
    fetchMemberBills();
    fetchMemberDividends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  // ---------- loan balance calc ----------
  let newbal = 0;
  if (loan) {
    const monthlyRate = 0.02;
    const months = parseInt(loan.duration) || 1;
    const principal = parseFloat(loan.loanAmount) || 0;
    const bal1 = parseFloat(loan.remainbalance) || 0;
    const remainingPayments = months - (loan.paymentsMade || 0);
    const bal4 = principal * monthlyRate;
    const principal1 = principal + bal4;
    newbal = remainingPayments === months ? principal1 : bal1;
  }

  // ---------- helpers ----------
  const fmtMoney = (val) =>
    Number(val || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

  const itemsSummary = (items) => {
    if (!items) return "-";
    if (!Array.isArray(items)) {
      if (typeof items === "string") {
        try {
          const parsed = JSON.parse(items);
          if (Array.isArray(parsed)) items = parsed;
          else return "-";
        } catch {
          return "-";
        }
      } else if (typeof items === "object") {
        const values = Object.keys(items).map((k) => items[k]).filter(Boolean);
        if (values.length === 0) return "-";
        return values.map((it) => (it && it.name ? `${it.name} x${it.qty ?? 1}` : String(it))).join(", ");
      } else return "-";
    }
    if (items.length === 0) return "-";
    return items.map((it) => `${it.name} x${it.qty ?? 1}`).join(", ");
  };

  // ---------- actions ----------
  const handleAddSharesConfirm = async (shareamount, paymentMethod = "Cash") => {
    const amt = Number(shareamount);
    if (!amt || amt <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = { userId: member.id, shareamount: amt, date: new Date().toISOString(), paymentMethod };
      const res = await axios.post("/api/shares/add", payload, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      alert(res.data.message || "Shares added!");
      await fetchMemberSharesTotal();
      setIsSharePopupOpen(false);
    } catch (err) {
      console.error("Add shares error:", err?.response?.data || err);
      alert("Failed to add shares: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handlePurchaseSaved = async (purchase) => {
    alert("Purchase recorded.");
    setIsPurchaseOpen(false);
    await fetchMemberPurchases();
  };

  const payPurchase = async (purchaseId) => {
    if (!window.confirm("Mark this purchase as paid?")) return;
    setProcessingPayId(purchaseId);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`/api/purchases/${purchaseId}/pay`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      alert(res.data?.message || "Purchase marked as paid");
      await fetchMemberPurchases();
      setSelectedPurchase1(null);
    } catch (err) {
      console.error("Failed to pay purchase:", err?.response?.data || err);
      alert(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setProcessingPayId(null);
    }
  };

  const handleDividendSaved = async (payload, response) => {
    try {
      await fetchMemberDividends();
      // optional: refresh bills or other lists if dividends are shown there
      await fetchMemberBills();
    } catch (e) {
      // ignore
    }
  };

  // ---------- UI ----------
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-4xl font-extrabold">{name}</h1>
        <button onClick={onBack} className="text-lg bg-[#7e9e6c] text-white px-4 py-2 rounded hover:bg-[#6a865a]">
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-[#7e9e6c]">Details</h2>
        <p className="text-lg"><strong>Member since</strong> {membership}</p>

        <p className="text-lg flex items-center gap-3">
          <strong>Total Shares:</strong> <span>{loadingShares ? "Loading..." : formatPeso(memberShares)}</span>
          <button onClick={() => setIsShareHistoryOpen(true)} title="View share history" className="ml-2 px-3 text-sm text-[#7e9e6c] border border-2 font-bold bg-[white] rounded hover:bg-[#d6ead8]">View</button>
        </p>

        <p className="text-lg flex items-center gap-3">
          <strong>Total Loans:</strong> <span>{totalLoans}</span>
          <button onClick={() => setIsLoanAppOpen(true)} title="View loans" className="ml-2 px-3 text-sm text-[#7e9e6c] border border-2 font-bold bg-[white] rounded hover:bg-[#d6ead8]">View</button>
        </p>

        <p className="text-lg flex items-center gap-3">
          <strong>All Purchases:</strong> <span>{purchases.length}</span>
          <button onClick={() => setIsPurchaseHistoryOpen(true)} title="View purchases" className="ml-2 px-3 text-sm text-[#7e9e6c] border border-2 font-bold bg-[white] rounded hover:bg-[#d6ead8]">View</button>
        </p>

        <p className="text-lg flex items-center gap-3">
          <strong>Bill Payment:</strong> <span>{loadingBills ? "Loading..." : bills.length}</span>
          <button onClick={() => setIsBillHistoryOpen(true)} title="View Bill History" className="ml-2 px-3 text-sm text-[#7e9e6c] border border-2 font-bold bg-[white] rounded hover:bg-[#d6ead8]">View</button>
        </p>

        <p className="text-lg flex items-center gap-3">
          <strong>Total Dividend:</strong>
          <span>
  {loadingDividends
    ? "Loading..."
    : Number.isFinite(dividends.reduce((s, d) => s + (Number(d.amount) || 0), 0))
      ? (dividends.length === 0 ? "₱0" : (dividends.reduce((s, d) => s + (Number(d.amount) || 0), 0)).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 0 }))
      : "₱0"}
</span>
          <button onClick={() => setIsDividendHistoryOpen(true)} title="View dividends" className="ml-2 px-3 text-sm text-[#7e9e6c] border border-2 font-bold bg-[white] rounded hover:bg-[#d6ead8]">View</button>
        </p>

        <h2 className="text-2xl font-bold mt-6 mb-3 text-[#7e9e6c]">Loan History</h2>
        {loading ? (
          <p className="text-gray-600 text-lg mb-6">Loading loan history...</p>
        ) : loanHistory.length > 0 ? (
          parseFloat(loanHistory[0]?.remainbalance || 0) <= 0 ? (
            <p className="text-gray-600 text-lg mb-6">No active loan.</p>
          ) : (
            <div className="overflow-auto border-gray-400 border rounded-lg">
              <table className="w-full text-lg text-left">
                <thead className="bg-[#d6ead8]">
                  <tr>
                    <th className="px-3 py-4">Purpose</th>
                    <th className="px-3 py-4">Amount</th>
                    <th className="px-3 py-4">months</th>
                    <th className="px-3 py-4">Paid(count)</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {loanHistory.filter((l) => l).map((l) => (
                    <tr key={l.id || Math.random()} className="border-t border-gray-400">
                      <td className="px-3 py-4">{l.purpose || "N/A"}</td>
                      <td className="px-3 py-4">{l.loanAmount ? parseFloat(l.loanAmount).toFixed(2) : "0.00"}</td>
                      <td className="px-3 py-4">{l.duration ? l.duration : "0"}</td>
                      <td className="px-3 py-4">{l.paymentsMade ? l.paymentsMade : "0"}</td>
                      <td className="px-3 py-4">{l.status || "N/A"}</td>
                      <td className="px-3 py-4">{newbal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <p className="text-gray-600 text-lg mb-6">No loan history available.</p>
        )}

        {/* Pending purchases UI (same as previous) */}
        {loadingPurchases ? (
          <div className="mt-8 text-sm text-gray-600">Loading purchases...</div>
        ) : (() => {
          const unpaid = purchases.filter((p) => String(p.status).toLowerCase() === "not paid");
          if (unpaid.length === 0) return null;
          return (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-[#7e9e6c]">Pending Purchases (1 month to pay)</h3>
                <div className="text-sm text-gray-600">{`${unpaid.length} Purchase to pay`}</div>
              </div>

              <div className="overflow-auto border-gray-400 border rounded-lg">
                <table className="w-full text-lg">
                  <thead className="bg-[#d6ead8]">
                    <tr>
                      <th className="text-left px-3 py-4">Items</th>
                      <th className="text-right px-3 py-4">Total</th>
                      <th className="text-right px-3 py-4">Due Date</th>
                      <th className="text-center px-3 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {unpaid.map((p) => {
                      const pid = p.id ?? p._id ?? p.purchaseId;
                      return (
                        <tr key={pid} className="border-t border-gray-400">
                          <td className="px-3 py-4">{itemsSummary(p.items)}</td>
                          <td className="px-3 py-4 right-10px text-right">{fmtMoney(p.total)}</td>
                          <td className="px-3 py-4 text-right">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                          <td className="px-3 py-4 place-items-center">
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedPurchase(p)} className="px-2 py-1 border rounded text-sm">View</button>
                              <button onClick={() => payPurchase(pid)} disabled={processingPayId === pid} className="px-3 py-1 bg-[#7e9e6c] text-white rounded text-sm disabled:opacity-50">
                                {processingPayId === pid ? "Processing..." : "Pay"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <button onClick={() => {
            if (!loan) { alert("No active loan found."); return; }
            const remainBalance = parseFloat(loan.remainbalance) || 0;
            if (remainBalance <= 0) { alert("No active loan — this member has fully paid the loan."); return; }
            setIsPaidPopupOpen(true);
          }} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Paid Loan</button>

          <button onClick={() => setIsPurchaseOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Purchase</button>

          <button onClick={() => setIsSharePopupOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Add Shares</button>

          <button onClick={() => setIsBillOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Pay Bills</button>

          <button onClick={() => setIsDividendOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Add Dividend</button>
        </div>

        {/* Purchase detail modals */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[900] p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
              <div className="flex items-start justify-between mb-4"><h4 className="text-lg font-semibold">Purchase Details</h4></div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr><th className="text-left px-3 py-2">Item</th><th className="text-right px-3 py-2">Qty</th><th className="text-right px-3 py-2">Unit Price</th><th className="text-right px-3 py-2">Line Total</th></tr>
                  </thead>
                  <tbody>
                    {(selectedPurchase.items || []).map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2 text-right">{it.qty ?? 1}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(it.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}</td>
                      </tr>
                    ))}
                    <tr className="border-t"><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold">{fmtMoney(selectedPurchase.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-4 text-sm text-gray-600">
                Due date: <span className="font-medium">{selectedPurchase.dueDate ? new Date(selectedPurchase.dueDate).toLocaleDateString() : "-"}</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPurchase(null)} className="px-4 py-2 border rounded">Close</button>
                  <button onClick={() => payPurchase(selectedPurchase.id ?? selectedPurchase._id ?? selectedPurchase.purchaseId)} className="px-6 py-1 bg-[#7e9e6c] text-white rounded">Pay</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPurchase1 && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[900] p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
              <div className="flex items-start justify-between mb-4"><h4 className="text-lg font-semibold">Purchase Details</h4></div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr><th className="text-left px-3 py-2">Item</th><th className="text-right px-3 py-2">Qty</th><th className="text-right px-3 py-2">Unit Price</th><th className="text-right px-3 py-2">Line Total</th></tr>
                  </thead>
                  <tbody>
                    {(selectedPurchase1.items || []).map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2 text-right">{it.qty ?? 1}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(it.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}</td>
                      </tr>
                    ))}
                    <tr className="border-t"><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold">{fmtMoney(selectedPurchase1.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-4 text-sm text-gray-600">
                Due date: <span className="font-medium">{selectedPurchase1.dueDate ? new Date(selectedPurchase1.dueDate).toLocaleDateString() : "-"}</span>
                <div className="flex gap-2"><button onClick={() => setSelectedPurchase1(null)} className="px-4 py-2 border rounded">Close</button></div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase history modal */}
        {isPurchaseHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pt-12 px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsPurchaseHistoryOpen(false)} />
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
              <div className="flex items-center justify-between mb-4"><h3 className="text-2xl font-bold text-[#7e9e6c]">Purchase History</h3></div>
              <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#d6ead8]">
                    <tr><th className="text-left px-3 py-3">Date</th><th className="text-left px-3 py-3">Items</th><th className="text-right px-3 py-3">Total</th><th className="text-right px-3 py-3">Due Date</th><th className="text-center px-3 py-3">Status</th><th className="text-center px-3 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-600">No purchases found for this member.</td></tr>
                    ) : (
                      purchases.map((p) => {
                        const pid = p.id ?? p._id ?? p.purchaseId;
                        return (
                          <tr key={pid} className="border-t border-gray-400">
                            <td className="px-3 py-3">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                            <td className="px-3 py-3">{itemsSummary(p.items)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(p.total)}</td>
                            <td className="px-3 py-3 text-right">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                            <td className="px-3 py-3 text-center">{String(p.status).charAt(0).toUpperCase() + String(p.status).slice(1)}</td>
                            <td className="px-3 py-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => setSelectedPurchase1(p)} className="px-2 py-1 border-gray-400 shadow-lg border rounded text-sm">View</button></div></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div><button className="mt-4 px-4 py-2 border rounded" onClick={() => setIsPurchaseHistoryOpen(false)}>Close</button></div>
            </div>
          </div>
        )}

        {/* Bill history modal */}
        {isBillHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pt-12 px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsBillHistoryOpen(false)} />
            <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
              <div className="flex items-center justify-between mb-4"><h3 className="text-2xl font-bold text-[#7e9e6c]">Bill History</h3></div>
              <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#d6ead8]"><tr><th className="text-left px-3 py-3">Date</th><th className="text-left px-3 py-3">Bill</th><th className="text-right px-3 py-3">Amount</th><th className="text-center px-3 py-3">Method</th></tr></thead>
                  <tbody>
                    {bills.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-600">No bill payments found.</td></tr> : bills.map((b) => (
                      <tr key={b.id ?? b._id} className="border-t border-gray-400"><td className="px-3 py-3">{b.date ? new Date(b.date).toLocaleDateString() : "-"}</td><td className="px-3 py-3">{b.billName}</td><td className="px-3 py-3 text-right">{fmtMoney(b.amount)}</td><td className="px-3 py-3 text-center">{b.paymentMethod}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4"><button className="px-4 py-2 border rounded" onClick={() => setIsBillHistoryOpen(false)}>Close</button></div>
            </div>
          </div>
        )}
      </div>

      <AddSharesPopup
        isOpen={isSharePopupOpen}
        onClose={() => setIsSharePopupOpen(false)}
        onConfirm={(amount, paymentMethod) => handleAddSharesConfirm(amount, paymentMethod)}
        memberName={name}
        date={new Date()}
      />

      <AddPurchasePopup
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        memberId={member.id}
        memberName={name}
        onSaved={handlePurchaseSaved}
      />

      <AddBillPaymentPopup
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        memberId={member.id}
        onSaved={async () => { alert("Bill payment recorded!"); setIsBillOpen(false); await fetchMemberBills(); }}
      />

      {isPaidPopupOpen && (
        <PaidLoanPopup
          isOpen={isPaidPopupOpen}
          onClose={() => setIsPaidPopupOpen(false)}
          member={{ ...member, loan: loanHistory[0] }}
          onUpdateLoan={(updatedLoan) => { setLoanHistory([updatedLoan]); setIsPaidPopupOpen(false); }}
        />
      )}

      {isLoanAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLoanAppOpen(false)} />
          <div className="relative w-[90vw] max-w-4xl bg-white rounded-2xl shadow-2xl overflow-auto p-4 z-60">
            <button className="absolute right-4 top-4 text-xl" onClick={() => setIsLoanAppOpen(false)} aria-label="Close loan list">&times;</button>
            <LoanApplication
              onBack={() => setIsLoanAppOpen(false)}
              memberId={member.id}
              memberName={name}
              onLoanUpdated={(updatedLoan) => {
                setLoanHistory((prev) => {
                  if (!prev || prev.length === 0) return prev;
                  return prev.map((l) => (l.id === updatedLoan.id ? { ...l, ...updatedLoan } : l));
                });
              }}
            />
          </div>
        </div>
      )}

      {isShareHistoryOpen && <Sharehistory isOpen={isShareHistoryOpen} onClose={() => setIsShareHistoryOpen(false)} rows={shareRows} loading={loadingShares} />}

      {/* Dividend add modal */}
      <AddDividendPopup isOpen={isDividendOpen} onClose={() => setIsDividendOpen(false)} memberId={member.id} memberName={name} onSaved={handleDividendSaved} />

      {/* Dividend history modal */}
      <AddDividendHistoryPopup isOpen={isDividendHistoryOpen} onClose={() => setIsDividendHistoryOpen(false)} rows={dividends} loading={loadingDividends} />
    </div>
  );
}
