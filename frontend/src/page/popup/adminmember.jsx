import React, { useState, useEffect } from "react";
import PaidLoanPopup from "./adminmem/paidloan.jsx";
import AddSharesPopup from "../popup/AddSharesPopup.jsx";
import AddPurchasePopup from "../popup/AddPurchasePopup.jsx";
import AddBillPaymentPopup from "../popup/AddBillPaymentPopup.jsx";
import LoanApplication from "../popup/Loanappli.jsx";
import Sharehistory from "../popup/Sharehistory.jsx";
import axios from "axios";

export default function MemberDetails({ member, onBack }) {
  const [isPaidPopupOpen, setIsPaidPopupOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isLoanAppOpen, setIsLoanAppOpen] = useState(false);
  const [isShareHistoryOpen, setIsShareHistoryOpen] = useState(false);

  const [loanHistory, setLoanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLoans, setTotalLoans] = useState(0);

  // purchases for this member
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [processingPayId, setProcessingPayId] = useState(null);

  // shares
  const [memberShares, setMemberShares] = useState(0);
  const [loadingShares, setLoadingShares] = useState(true);
  const [shareRows, setShareRows] = useState([]);

  const loan = loanHistory[0];
  const name =
    `${member.firstName || ""} ${member.middleName || ""} ${member.lastName || ""}`.trim() ||
    member.memberName ||
    member.name ||
    "Member";
  const membership = member.membership || "Regular Member";

  const formatPeso = (value) => {
    const n = Number(value) || 0;
    return n.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    });
  };

  // ---------------- Shares fetch ----------------
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

  // ---------------- Purchases fetch & normalization ----------------
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
        // Normalize items: support Array, JSON string, object with numeric keys
        let rawItems = p.items ?? p.item ?? p.lines ?? [];
        if (typeof rawItems === "string") {
          try {
            const parsed = JSON.parse(rawItems);
            rawItems = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn("Failed to parse purchase.items JSON:", e, rawItems);
            rawItems = [];
          }
        }
        if (!Array.isArray(rawItems) && rawItems && typeof rawItems === "object") {
          // convert numeric-keyed object to array or extract values
          const maybeArray = Object.keys(rawItems)
            .sort() // optional: sort by key if numeric keys
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

  // ---------------- Other fetches ----------------
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/loans/member/${encodeURIComponent(member.id)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const loanData = res.data.loan;
        setLoanHistory(loanData ? [loanData] : []);
      } catch (err) {
        console.error("❌ Error fetching loan history:", err);
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
        });
        setTotalLoans(res.data.totalLoans || 0);
      } catch (err) {
        console.error("❌ Error fetching total loans:", err);
      }
    };

    fetchLoans();
    fetchTotalLoans();
    fetchMemberSharesTotal();
    fetchMemberPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  // ---------------- loan balance calc ----------------
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

  // ---------------- helper UI functions ----------------
  const fmtMoney = (val) =>
    Number(val || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

  // defensive items summary (won't throw if items is not an array)
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
        return values
          .map((it) => (it && it.name ? `${it.name} x${it.qty ?? 1}` : String(it)))
          .join(", ");
      } else {
        return "-";
      }
    }
    if (items.length === 0) return "-";
    return items.map((it) => `${it.name} x${it.qty ?? 1}`).join(", ");
  };

  // ---------------- actions ----------------
  const handleAddSharesConfirm = async (shareamount, paymentMethod = "Cash") => {
    const amt = Number(shareamount);
    if (!amt || amt <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        userId: member.id,
        shareamount: amt,
        date: new Date().toISOString(),
        paymentMethod,
      };
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
    console.log("Purchase saved:", purchase);
    alert("Purchase recorded.");
    setIsPurchaseOpen(false);
    await fetchMemberPurchases();
  };

  const payPurchase = async (purchaseId) => {
    if (!window.confirm("Mark this purchase as paid?")) return;
    setProcessingPayId(purchaseId);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/purchases/${purchaseId}/pay`,
        {},
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      alert(res.data?.message || "Purchase marked as paid");
      await fetchMemberPurchases();
      setSelectedPurchase(null);
    } catch (err) {
      console.error("Failed to pay purchase:", err?.response?.data || err);
      alert(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setProcessingPayId(null);
    }
  };

  // ---------------- UI ----------------
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">{name}</h1>
        <button onClick={onBack} className="text-lg bg-[#7e9e6c] text-white px-4 py-2 rounded hover:bg-[#6a865a]">
          ← Back to Dashboard
        </button>
      </div>

      {/* Member Details */}
      <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-[#7e9e6c]">Details</h2>

        <p className="text-lg">
          <strong>Membership:</strong> {membership}
        </p>

        <p className="text-lg flex items-center gap-3">
          <strong>Total Shares:</strong> <span>{loadingShares ? "Loading..." : formatPeso(memberShares)}</span>
          <button onClick={() => setIsShareHistoryOpen(true)} title="View share history" className="ml-2 px-3 py-1 text-sm bg-[#7e9e6c] text-white rounded hover:bg-[#6a865a]">
            View
          </button>
        </p>

        <p className="text-lg flex items-center gap-3">
          <strong>Total Loans:</strong> <span>{totalLoans}</span>
          <button onClick={() => setIsLoanAppOpen(true)} title="View loans" className="ml-2 px-3 py-1 text-sm bg-[#7e9e6c] text-white rounded hover:bg-[#6a865a]">
            View
          </button>
        </p>

        {/* Loan History */}
        <h2 className="text-2xl font-bold mt-6 mb-3 text-[#7e9e6c]">Loan History</h2>
        {loading ? (
          <p className="text-gray-600 text-lg mb-6">Loading loan history...</p>
        ) : loanHistory.length > 0 ? (
          parseFloat(loanHistory[0]?.remainbalance || 0) <= 0 ? (
            <p className="text-gray-600 text-lg mb-6">No active loan.</p>
          ) : (
            <table className="w-full border border-gray-300 text-left text-lg mb-6">
              <thead className="bg-[#d6ead8]">
                <tr>
                  <th className="p-2 border">Purpose</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">months</th>
                  <th className="p-2 border">Paid(count)</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Balance</th>
                </tr>
              </thead>
              <tbody>
                {loanHistory
                  .filter((l) => l)
                  .map((l) => (
                    <tr key={l.id || Math.random()} className="hover:bg-[#f3f9f3]">
                      <td className="p-2 border">{l.purpose || "N/A"}</td>
                      <td className="p-2 border">{l.loanAmount ? parseFloat(l.loanAmount).toFixed(2) : "0.00"}</td>
                      <td className="p-2 border">{l.duration ? l.duration : "0"}</td>
                      <td className="p-2 border">{l.paymentsMade ? l.paymentsMade : "0"}</td>
                      <td className="p-2 border">{l.status || "N/A"}</td>
                      <td className="p-2 border">{newbal}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )
        ) : (
          <p className="text-gray-600 text-lg mb-6">No loan history available.</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <button
            onClick={() => {
              if (!loan) {
                alert("No active loan found.");
                return;
              }
              const remainBalance = parseFloat(loan.remainbalance) || 0;
              if (remainBalance <= 0) {
                alert("No active loan — this member has fully paid the loan.");
                return;
              }
              setIsPaidPopupOpen(true);
            }}
            className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition"
          >
            Paid Loan
          </button>

          <button onClick={() => setIsPurchaseOpen(true)} className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">
            Purchase
          </button>

          <button onClick={() => setIsSharePopupOpen(true)} className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">
            Add Shares
          </button>

          <button onClick={() => setIsBillOpen(true)} className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">
            Pay Bills
          </button>
        </div>

        {/* ---------- Purchases table ---------- */}
        {loadingPurchases ? (
  <div className="mt-8 text-sm text-gray-600">Loading purchases...</div>
) : (
  (() => {
    // show only purchases that are not paid (status === 'not paid')
    const unpaid = purchases.filter((p) => String(p.status).toLowerCase() === "not paid");
    if (unpaid.length === 0) return null;

    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-semibold text-[#7e9e6c]">Pending Purchases (1 month to pay)</h3>
          <div className="text-sm text-gray-600">{`${unpaid.length} item(s)`}</div>
        </div>

        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Items</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-left px-3 py-2">Due Date</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {unpaid.map((p) => {
                const pid = p.id ?? p._id ?? p.purchaseId;
                return (
                  <tr key={pid} className="border-t">
                    <td className="px-3 py-2">{pid}</td>
                    <td className="px-3 py-2">{itemsSummary(p.items)}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(p.total)}</td>
                    <td className="px-3 py-2">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPurchase(p)} className="px-2 py-1 border rounded text-sm">
                          View
                        </button>
                        <button
                          onClick={() => payPurchase(pid)}
                          disabled={processingPayId === pid}
                          className="px-3 py-1 bg-[#7e9e6c] text-white rounded text-sm disabled:opacity-50"
                        >
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
  })()
)}

        {/* Purchase Detail modal */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[900] p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold">Purchase Details</h4>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPurchase(null)} className="px-3 py-1 border rounded">
                    Close
                  </button>
                  <button
                    onClick={() => payPurchase(selectedPurchase.id ?? selectedPurchase._id ?? selectedPurchase.purchaseId)}
                    className="px-3 py-1 bg-[#7e9e6c] text-white rounded"
                  >
                    Pay
                  </button>
                </div>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                Purchase ID: <span className="font-medium">{selectedPurchase.id ?? selectedPurchase._id ?? selectedPurchase.purchaseId}</span>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Unit Price</th>
                      <th className="text-right px-3 py-2">Line Total</th>
                    </tr>
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

                    <tr className="border-t">
                      <td colSpan={3} className="px-3 py-2 text-right font-semibold">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-bold">{fmtMoney(selectedPurchase.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Due date: <span className="font-medium">{selectedPurchase.dueDate ? new Date(selectedPurchase.dueDate).toLocaleDateString() : "-"}</span>
              </div>
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
        memberName={name}                // pass memberName so backend can record
        onSaved={handlePurchaseSaved}
      />

      <AddBillPaymentPopup
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        memberId={member.id}
        onSaved={() => {
          alert("Bill payment recorded!");
          setIsBillOpen(false);
        }}
      />

      {isPaidPopupOpen && (
        <PaidLoanPopup
          isOpen={isPaidPopupOpen}
          onClose={() => setIsPaidPopupOpen(false)}
          member={{ ...member, loan: loanHistory[0] }}
          onUpdateLoan={(updatedLoan) => {
            setLoanHistory([updatedLoan]);
            setIsPaidPopupOpen(false);
          }}
        />
      )}

      {isLoanAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLoanAppOpen(false)} />
          <div className="relative w-[90vw] max-w-4xl bg-white rounded-2xl shadow-2xl overflow-auto p-4 z-60">
            <button className="absolute right-4 top-4 text-xl" onClick={() => setIsLoanAppOpen(false)} aria-label="Close loan list">
              &times;
            </button>

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
    </div>
  );
}
