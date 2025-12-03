// Approvedloan.jsx
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

export default function Duedate({ onBack, onView }) {
  const [loanRecords, setLoanRecords] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNextDue, setLoadingNextDue] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (num) =>
    typeof num === "number"
      ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : num
      ? Number(num).toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : "₱0.00";

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

  const findNextDueFromSchedule = (sched) => {
    if (!Array.isArray(sched) || sched.length === 0) return null;
    const next = sched.find((s) => s.status !== "Paid");
    return next ?? null;
  };

  const daysFromToday = (date) => {
    if (!date) return null;
    const today = new Date();
    const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const d = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((d - t) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    let mounted = true;
    const fetchApprovedLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = (localStorage.getItem("token") || "").trim();

        let approved = [];
        try {
          const res = await axios.get("http://localhost:8000/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approved = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          try {
            const resAll = await axios.get("http://localhost:8000/api/loans/members", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const allLoans = Array.isArray(resAll.data) ? resAll.data : resAll.data?.loans ?? [];
            approved = allLoans.filter((l) => ["approved", "paid"].includes(String(l.status).toLowerCase()));
          } catch (err2) {
            console.error("fetch fallback failed", err2);
            approved = [];
          }
        }

        if (!mounted) return;

        setLoanRecords(approved);
        setLoading(false);

        setLoadingNextDue(true);
        const enhanced = await Promise.all(
          approved.map(async (loan) => {
            try {
              const resPay = await axios.get(`http://localhost:8000/api/loans/${loan.id}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const payments = Array.isArray(resPay.data)
                ? resPay.data
                : Array.isArray(resPay.data?.payments)
                ? resPay.data.payments
                : [];
              const paymentsSum = payments.reduce((acc, p) => {
                const amt = parseFloat(p.amountPaid ?? p.amount ?? 0) || 0;
                return acc + amt;
              }, 0);

              const sched = buildSchedule(loan, paymentsSum);
              const next = findNextDueFromSchedule(sched);

              const nextDueDate = next ? next.dueDate : sched.length > 0 ? sched[0].dueDate : null;
              const days = nextDueDate ? daysFromToday(new Date(nextDueDate)) : null;

              return { ...loan, nextDueDate, daysRemaining: days };
            } catch (err) {
              try {
                const approvalDate = loan.approvalDate ? new Date(loan.approvalDate) : new Date(loan.createdAt || Date.now());
                const fallbackNext = new Date(approvalDate.getFullYear(), approvalDate.getMonth() + 1, approvalDate.getDate());
                const days = daysFromToday(fallbackNext);
                return { ...loan, nextDueDate: fallbackNext, daysRemaining: days };
              } catch (err2) {
                console.warn("failed to compute fallback next due", err2);
                return { ...loan, nextDueDate: null, daysRemaining: null };
              }
            }
          })
        );

        if (!mounted) return;
        setLoanRecords(enhanced);
      } catch (err) {
        console.error("❌ Error fetching approved loans:", err);
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

  // compute amortization schedule when user clicks View (kept in case you need it elsewhere)
  const computeSchedule = async (loan) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration, 10) || 0;
    const monthlyRate = 0.02;

    let payments = [];
    try {
      const token = (localStorage.getItem("token") || "").trim();
      const res = await axios.get(`http://localhost:8000/api/loans/${loan.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      payments = Array.isArray(res.data) ? res.data : res.data?.payments ?? [];
    } catch (err) {
      console.warn("Failed to fetch payments for schedule:", err?.message || err);
    }

    const paymentsSum = payments.reduce((a, p) => a + (parseFloat(p.amountPaid ?? p.amount ?? 0) || 0), 0);

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

    setSchedule(scheduleData);
    setSelectedLoan(loan);
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg p-3 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#7e9e6c] transition text-2xl"
        title="Back"
      >
        <FaArrowLeft />
      </button>

      <div className="max-w-auto p-6">
        <h2 className="text-4xl font-bold text-center text-[#5a7350] mb-4">Duedate Loans</h2>

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
                  <th className="py-3 px-4 text-left">Loan Amount</th>
                  <th className="py-3 px-4 text-left">Repayment</th>
                  <th className="py-3 px-4 text-left">Next Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loanRecords.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white "}  hover:bg-[#e4f2e7] transition`}
                  >
                    <td className="py-3 px-4 border-t  border-gray-200">
                      {record.memberName || record.name || record.firstName || "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-200">{formatCurrency(record.loanAmount)}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{record.duration ? `${record.duration} months` : "N/A"}</td>

                    <td className="py-3 px-4 border-t border-gray-200">
                      {loadingNextDue ? (
                        <span className="text-gray-500">calculating…</span>
                      ) : record.nextDueDate ? (
                        <>
                          <div>{new Date(record.nextDueDate).toLocaleDateString("en-PH")}</div>
                          <div className="text-xs text-gray-500">
                            {record.daysRemaining !== null && record.daysRemaining !== undefined
                              ? record.daysRemaining < 0
                                ? `${Math.abs(record.daysRemaining)} day(s) overdue`
                                : `${record.daysRemaining} day(s)`
                              : "—"}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 border-t border-gray-200 text-center">
                      {/* CALL onView when clicked so Admin can open MemberDetails */}
                      <button
                        onClick={() => {
                          if (typeof onView === "function") {
                            onView(record);
                          } else {
                            // fallback to old behavior: compute schedule modal (keeps compatibility)
                            computeSchedule(record);
                          }
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

      {/* Loan Details Modal (kept but only shown when selectedLoan is set and onView not used) */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl w-[700px] max-h-[85vh] overflow-y-auto shadow-2xl relative p-8">
            <button
              onClick={() => {
                setSelectedLoan(null);
                setSchedule([]);
              }}
              className="absolute top-3 right-5 text-gray-500 hover:text-black text-3xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold text-center text-[#7e9e6c] mb-4">Loan Details</h2>

            <div className="space-y-3 text-gray-700">
              <p><strong>Member:</strong> {selectedLoan.memberName || selectedLoan.name || "N/A"}</p>
              <p><strong>Purpose:</strong> {selectedLoan.purpose || "N/A"}</p>
              <p><strong>Loan Amount:</strong> {formatCurrency(selectedLoan.loanAmount)}</p>
              <p><strong>Duration:</strong> {selectedLoan.duration ? `${selectedLoan.duration} months` : "N/A"}</p>
              <p><strong>Start Month:</strong> {selectedLoan.startMonth || "N/A"}</p>
              <p><strong>End Month:</strong> {selectedLoan.endMonth || "N/A"}</p>
              <hr className="my-3" />

              <h3 className="text-xl font-bold text-[#56794a] mb-2">Amortization Schedule</h3>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f4f9f4] text-[#56794a] border-b">
                    <th className="py-2 px-2 text-left">Month</th>
                    <th className="py-2 px-2 text-right">Interest</th>
                    <th className="py-2 px-2 text-right">Balance</th>
                    <th className="py-2 px-2 text-right">Amortization</th>
                    <th className="py-2 px-2 text-center">Due Date</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.month} className="border-b hover:bg-[#f9fcf9]">
                      <td className="py-1 px-2">{row.month}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.interestPayment)}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.remainingBalance)}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.totalPayment)}</td>
                      <td className="py-1 px-2 text-center">
                        {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-PH") : "N/A"}
                      </td>
                      <td className="py-1 px-2 text-center">
                        {row.status === "Paid" ? (
                          <span className="text-blue-600 font-semibold">{row.status}</span>
                        ) : (
                          <span className="text-red-600">{row.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
