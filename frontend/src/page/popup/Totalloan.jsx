// src/page/popup/approvedloan.jsx
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import MemberDetails from "../popup/adminmember.jsx";

export default function Duedate({ onBack, onView }) {
  const [loanRecords, setLoanRecords] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNextDue, setLoadingNextDue] = useState(true);
  const [error, setError] = useState(null);

  // modal state for MemberDetails
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [memberForDetails, setMemberForDetails] = useState(null);

  const formatCurrency = (num) =>
    typeof num === "number"
      ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : num
      ? Number(num).toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : "₱0.00";

  // detect 1-month method
  const isOneMonthMethod = (pm) => {
    if (!pm) return false;
    const s = String(pm).toLowerCase();
    return (
      s.includes("1month") ||
      s.includes("1 month") ||
      s.includes("one month") ||
      s.includes("month to pay") ||
      s.includes("share-deduction") ||
      s.includes("share")
    );
  };

  // LOAN schedule builder
  const buildSchedule = (loan, paymentsSum = 0) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration, 10) || 0;
    const monthlyRate = 0.02;

    const scheduleData = [];
    let remainingBalance = principal;
    const approvalDate = loan.approvalDate ? new Date(loan.approvalDate) : new Date(loan.createdAt || Date.now());
    const monthlyPrincipal = months > 0 ? principal / months : principal;

    let paidSoFar = 0;
    for (let i = 1; i <= Math.max(1, months); i++) {
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPrincipal;
      let totalPayment = principalPayment + interestPayment;

      if (i === months) {
        totalPayment = remainingBalance + interestPayment;
        principalPayment = remainingBalance;
      }

      const status = paymentsSum >= paidSoFar + totalPayment ? "Paid" : "Unpaid";

      scheduleData.push({
        month: i,
        interestPayment: Number(interestPayment.toFixed(2)),
        totalPayment: Number(totalPayment.toFixed(2)),
        remainingBalance: Number(remainingBalance.toFixed(2)),
        dueDate: new Date(approvalDate.getFullYear(), approvalDate.getMonth() + i, approvalDate.getDate()),
        status,
      });

      remainingBalance -= principalPayment;
      paidSoFar += totalPayment;
    }

    return scheduleData;
  };

  const daysFromToday = (date) => {
    if (!date) return null;
    const today = new Date();
    const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const d = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((d - t) / (1000 * 60 * 60 * 24));
  };

  const findNextDueFromSchedule = (sched) => {
    if (!sched || sched.length === 0) return null;
    return sched.find((s) => s.status !== "Paid") || null;
  };

  useEffect(() => {
    let mounted = true;

    const fetchApprovedLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token")?.trim() || "";

        // 1) fetch approved loans
        let approved = [];
        try {
          const res = await axios.get("http://localhost:8000/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approved = Array.isArray(res.data) ? res.data : [];
        } catch {
          approved = [];
        }

        // 2) fetch purchases
        let purchases = [];
        try {
          const res = await axios.get("http://localhost:8000/api/purchases/all", {
            headers: { Authorization: `Bearer ${token}` },
          });
          purchases = Array.isArray(res.data) ? res.data : res.data?.purchases ?? [];
        } catch {
          purchases = [];
        }

        // Normalize purchases
        const normalizedPurchases = (purchases || [])
          .map((p) => {
            const status =
              p.status ||
              p.paymentStatus ||
              p.payment_status ||
              "unpaid";

            const isPaid = ["paid", "completed", "done", "fully paid"].includes(
              String(status).toLowerCase().trim()
            );

            // Remove paid purchases
            if (isPaid) return null;

            const pm = p.paymentMethod ?? p.payment_method ?? p.method ?? null;
            const oneMonth = isOneMonthMethod(pm);

            let due =
              p.due_date ||
              p.dueDate ||
              p.paymentDue ||
              p.payment_due ||
              null;

            if (due) {
              due = new Date(due);
            } else if (oneMonth) {
              const created = new Date(p.createdAt || p.date || Date.now());
              due = new Date(created);
              due.setMonth(due.getMonth() + 1);
            }

            return {
              id: p.id || p._id || p.purchaseId,
              memberId: p.memberId ?? p.userId ?? p.customerId ?? p.customer?.id ?? p.member?.id ?? null,
              memberName:
                p.memberName ||
                p.customerName ||
                p.name ||
                p.firstName ||
                p.customer?.name ||
                p.member?.name ||
                "Unknown",
              type: "Purchase",
              total: Number(p.total || p.amount || 0),
              payAmount: Number(p.total || p.amount || 0),
              nextDueDate: due || null,
              daysRemaining: due ? daysFromToday(due) : null,
              isOneMonth: oneMonth,
              _raw: p,
            };
          })
          .filter(Boolean); // remove paid ones

        // 3) Enhance loans
        const enhancedLoans = await Promise.all(
          approved.map(async (loan) => {
            let payments = [];
            try {
              const res = await axios.get(`http://localhost:8000/api/loans/${loan.id}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              payments = res.data || [];
            } catch {
              payments = [];
            }

            const paymentsSum = payments.reduce(
              (acc, p) => acc + (parseFloat(p.amountPaid || p.amount || 0) || 0),
              0
            );

            const schedule = buildSchedule(loan, paymentsSum);
            const next = findNextDueFromSchedule(schedule);
            const nextDue = next ? next.dueDate : null;

            return {
              ...loan,
              type: "Loan",
              payAmount: schedule[0]?.totalPayment || loan.loanAmount,
              nextDueDate: nextDue,
              daysRemaining: nextDue ? daysFromToday(nextDue) : null,
              _schedule: schedule,
            };
          })
        );

        const merged = [...enhancedLoans, ...normalizedPurchases];

        // Sort by nearest due
        merged.sort((a, b) => {
          const da = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Infinity;
          const db = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Infinity;
          return da - db;
        });

        if (!mounted) return;
        setLoanRecords(merged);
      } catch (err) {
        if (mounted) setError("Failed to load approved loans.");
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingNextDue(false);
        }
      }
    };

    fetchApprovedLoans();
    return () => (mounted = false);
  }, []);

  // Resolve member object - prefer exact member by id, fallback to name search
  const resolveMemberFromRecord = async (record) => {
    if (!record) return null;

    const possibleId =
      record.memberId ??
      record.userId ??
      record.customerId ??
      record.customer?.id ??
      record.member?.id ??
      record.user?._id ??
      record.member?._id ??
      null;

    const token = localStorage.getItem("token")?.trim();

    // If we have an id, fetch exact member
    if (possibleId) {
      try {
        const res = await axios.get(`/api/members/${encodeURIComponent(possibleId)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        if (res.status < 400 && res.data) {
          // normalize common fields into the member object expected by MemberDetails
          return {
            id: res.data.id ?? res.data._id ?? res.data.memberId ?? possibleId,
            ...res.data,
          };
        }
      } catch (err) {
        console.warn("Failed to fetch member by id:", err);
      }
    }

    // If no id or lookup failed, try name search
    const name = record.memberName ?? record.customerName ?? record.name ?? null;
    if (name) {
      try {
        const res = await axios.get(`/api/members?search=${encodeURIComponent(name)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.members ?? [];
        if (rows && rows.length > 0) {
          return {
            id: rows[0].id ?? rows[0]._id ?? rows[0].memberId ?? null,
            ...rows[0],
          };
        }
      } catch (err) {
        console.warn("Member name search failed:", err);
      }
    }

    // fallback minimal member-like object
    return { id: null, memberName: name ?? record.memberName ?? "Unknown" };
  };

  const openMemberDetailsForRecord = async (record) => {
    const member = await resolveMemberFromRecord(record);
    const memberWithContext = {
      ...(member || {}),
      // include the full raw record so MemberDetails can highlight which purchase/loan triggered this
      _triggeredBy: record,
    };
    setMemberForDetails(memberWithContext);
    setShowMemberDetails(true);
  };

  const computeSchedule = async (loan) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration, 10) || 0;
    const monthlyRate = 0.02;

    let payments = [];
    try {
      const token = localStorage.getItem("token")?.trim() || "";
      const res = await axios.get(`http://localhost:8000/api/loans/${loan.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      payments = res.data || [];
    } catch {}

    const paymentsSum = payments.reduce(
      (a, p) => a + (parseFloat(p.amountPaid || p.amount || 0) || 0),
      0
    );

    const scheduleData = buildSchedule(loan, paymentsSum);
    setSchedule(scheduleData);
    setSelectedLoan(loan);
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg p-3 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#7e9b6c] transition text-2xl"
      >
        <FaArrowLeft />
      </button>

      <div className="max-w-auto p-6">
        <h2 className="text-4xl font-bold text-center text-[#5a7350] mb-4">Duedates</h2>

        {loading ? (
          <p className="text-center text-gray-600 mt-6">Loading Duedate loans...</p>
        ) : error ? (
          <p className="text-center text-red-600 mt-6">{error}</p>
        ) : loanRecords.length === 0 ? (
          <p className="text-center border-t border-gray-300 pt-4 text-gray-600 mt-6">No Duedate loans found.</p>
        ) : (
          <div className="border-t border-gray-300 pt-4">
            <table className="w-full shadow-lg border border-gray-300 rounded-lg overflow-hidden text-sm">
              <thead className="bg-[#7e9e6c] text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Member</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Pay Amount</th>
                  <th className="py-3 px-4 text-left">Next Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loanRecords.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}  hover:bg-[#e4f2e7] transition`}
                  >
                    <td className="py-3 px-4 border-t  border-gray-200">
                      {record.memberName}
                    </td>

                    <td className="py-3 px-4 border-t border-gray-200 font-semibold">
                      {record.type}
                      <div className="text-xs text-gray-600 mt-1">
                        {record.type === "Purchase"
                          ? `Total: ${formatCurrency(record.total)}`
                          : `Loan: ${formatCurrency(record.loanAmount)}`}
                      </div>
                    </td>

                    <td className="py-3 px-4 border-t border-gray-200">
                      {formatCurrency(record.payAmount)}
                    </td>

                    <td className="py-3 px-4 border-t border-gray-200">
                      {loadingNextDue ? (
                        <span className="text-gray-500">calculating…</span>
                      ) : record.nextDueDate ? (
                        <>
                          <div>{new Date(record.nextDueDate).toLocaleDateString("en-PH")}</div>
                          <div className="text-xs text-gray-500">
                            {record.daysRemaining < 0
                              ? `${Math.abs(record.daysRemaining)} day(s) overdue`
                              : `${record.daysRemaining} day(s)`}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 border-t border-gray-200 text-center">
                      <button
                        onClick={async () => {
                          // prefer parent onView if it exists (parent may do its own navigation)
                          if (typeof onView === "function") {
                            onView(record);
                            return;
                          }
                          // otherwise resolve a specific member and open MemberDetails
                          await openMemberDetailsForRecord(record);
                        }}
                        className="bg-[#7e9e6c] text-white px-3 py-1 rounded hover:bg-[#6a8b5a]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MemberDetails modal shown when View clicked (only if parent didn't handle onView) */}
      {showMemberDetails && memberForDetails && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMemberDetails(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
            <button onClick={() => setShowMemberDetails(false)} className="mb-4 px-3 py-1 bg-gray-200 rounded">
              Close
            </button>

            {/* MemberDetails will fetch its own data using member.id if present */}
            <MemberDetails member={memberForDetails} onBack={() => setShowMemberDetails(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
