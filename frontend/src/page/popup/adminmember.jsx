import React, { useState, useEffect } from "react";
import PaidLoanPopup from "./adminmem/paidloan.jsx";
import AddSharesPopup from "../popup/AddSharesPopup.jsx";
import AddPurchasePopup from "../popup/AddPurchasePopup.jsx"; // <- new
import AddBillPaymentPopup from "../popup/AddBillPaymentPopup.jsx";
import LoanApplication from "../popup/Loanappli.jsx";
import Sharehistory from "../popup/Sharehistory.jsx"; // <- import share history modal
import axios from "axios";

export default function MemberDetails({ member, onBack }) {
  const [isPaidPopupOpen, setIsPaidPopupOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false); // <- new
  const [isLoanAppOpen, setIsLoanAppOpen] = useState(false); // show LoanApplication modal
  const [isShareHistoryOpen, setIsShareHistoryOpen] = useState(false); // NEW: share history modal
  const [loanHistory, setLoanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLoans, setTotalLoans] = useState(0);

  // authoritative shares loaded from DB (sum of all member shares rows)
  const [memberShares, setMemberShares] = useState(0);
  const [loadingShares, setLoadingShares] = useState(true);
  const [shareRows, setShareRows] = useState([]); // store full rows for modal

  const loan = loanHistory[0];
  // prefer name passed via member (may include firstName/lastName or loanRecord from parent)
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

  // fetch all shares rows for this member and compute sum
  const fetchMemberSharesTotal = async () => {
    setLoadingShares(true);
    try {
      const token = localStorage.getItem("token");
      // this expects your server route: GET /api/shares/member/:id
      const res = await axios.get(`/api/shares/member/${member.id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const rows = res.data ?? [];
      // each row from your model has 'shareamount' per your controller
      const sum = rows.reduce((acc, r) => {
        const v = Number(r.shareamount ?? r.shareAmount ?? r.amount ?? 0);
        return acc + (Number.isNaN(v) ? 0 : v);
      }, 0);

      setShareRows(Array.isArray(rows) ? rows : []); // store raw rows for modal
      setMemberShares(sum);
    } catch (err) {
      console.error("Failed to fetch member shares:", err?.response?.data || err);
      setMemberShares(Number(member.shares) || 0);
      setShareRows([]);
    } finally {
      setLoadingShares(false);
    }
  };

  // handle add shares: post with userId, shareamount and paymentMethod then refresh authoritative shares total
  const handleAddSharesConfirm = async (shareamount, paymentMethod = "Cash") => {
    const amt = Number(shareamount);
    if (!amt || amt <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        userId: member.id, // matches your controller's expected key
        shareamount: amt, // matches controller
        date: new Date().toISOString(),
        paymentMethod, // <<-- include payment method
      };

      console.log("Sending add-shares payload:", payload);

      const res = await axios.post("/api/shares/add", payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("Add shares success", res.data);
      alert(res.data.message || "Shares added!");

      // after successful creation, re-fetch all shares and update shown total
      await fetchMemberSharesTotal();
      // close the popup
      setIsSharePopupOpen(false);
    } catch (err) {
      console.error("Add shares error:", err.response?.status, err.response?.data || err);
      alert("Failed to add shares: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  // handle purchase saved (called by popup after successful save)
  const handlePurchaseSaved = async (purchase) => {
    // purchase is the saved purchase object returned from API (if you return it)
    console.log("Purchase saved:", purchase);
    // Optionally: refresh any lists (purchases, member summary, etc.)
    alert("Purchase recorded.");
    setIsPurchaseOpen(false);
  };

  // fetch loans + counts and member shares on mount / when member.id changes
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/loans/member/${member.id}`, {
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
        const res = await axios.get(`/api/loans/member/${member.id}/loan-count`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  // loan balance calc (unchanged)
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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">{name}</h1>
        <button
          onClick={onBack}
          className="text-lg bg-[#7e9e6c] text-white px-4 py-2 rounded hover:bg-[#6a865a]"
        >
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
          <strong>Total Shares:</strong>{" "}
          <span>{loadingShares ? "Loading..." : formatPeso(memberShares)}</span>

          {/* SMALL VIEW BUTTON beside Total Shares */}
          <button
            onClick={() => setIsShareHistoryOpen(true)}
            title="View share history"
            className="ml-2 px-3 py-1 text-sm bg-[#7e9e6c] text-white rounded hover:bg-[#6a865a]"
          >
            View
          </button>
        </p>

         <p className="text-lg flex items-center gap-3">
          <strong>Total Loans:</strong>{" "}
          <span>{totalLoans}</span>

          {/* SMALL VIEW BUTTON beside Total Loans */}
          <button
            onClick={() => setIsLoanAppOpen(true)}
            title="View loans"
            className="ml-2 px-3 py-1 text-sm bg-[#7e9e6c] text-white rounded hover:bg-[#6a865a]"
          >
            View
          </button>
        </p>
        {/* Loan History (unchanged) */}
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
                      <td className="p-2 border">
                        {l.loanAmount ? parseFloat(l.loanAmount).toFixed(2) : "0.00"}
                      </td>
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

          <button
            onClick={() => setIsPurchaseOpen(true)} // <- open purchase popup
            className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition"
          >
            Purchase
          </button>

          <button
            onClick={() => setIsSharePopupOpen(true)}
            className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition"
          >
            Add Shares
          </button>
          <button
            onClick={() => setIsBillOpen(true)}
            className="bg-[#7e9e6c] text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition"
          >
            Pay Bills
          </button>
        </div>
      </div>

      <AddSharesPopup
        isOpen={isSharePopupOpen}
        onClose={() => setIsSharePopupOpen(false)}
        onConfirm={(amount, paymentMethod) => handleAddSharesConfirm(amount, paymentMethod)}
        memberName={name}
        date={new Date()}
      />

      {/* NEW: Purchase popup */}
      <AddPurchasePopup
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        memberId={member.id}
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

      {/* LoanApplication modal — opened when clicking the small View button beside Total Loans */}
      {isLoanAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLoanAppOpen(false)} />
          <div className="relative w-[90vw] max-w-4xl bg-white rounded-2xl shadow-2xl overflow-auto p-4 z-60">
            <button
              className="absolute right-4 top-4 text-xl"
              onClick={() => setIsLoanAppOpen(false)}
              aria-label="Close loan list"
            >
              &times;
            </button>

            <LoanApplication
              onBack={() => setIsLoanAppOpen(false)}
              memberId={member.id}
              memberName={name}
              onLoanUpdated={(updatedLoan) => {
                // optional: sync MemberDetails loanHistory when a loan is updated
                setLoanHistory((prev) => {
                  if (!prev || prev.length === 0) return prev;
                  return prev.map((l) => (l.id === updatedLoan.id ? { ...l, ...updatedLoan } : l));
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Sharehistory modal — opened when clicking the small View button beside Total Shares */}
      {isShareHistoryOpen && (
        <Sharehistory
          isOpen={isShareHistoryOpen}
          onClose={() => setIsShareHistoryOpen(false)}
          rows={shareRows}
          loading={loadingShares}
        />
      )}
    </div>
  );
}
