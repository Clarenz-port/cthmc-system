import React from "react";
import { FaArrowLeft } from "react-icons/fa";

export default function BillsHistory({
  onBack,
  rows = null, // pass bills via props (array)
  loading = false, // pass loading state if available
}) {
 
  const data = Array.isArray(rows) ? rows : sampleRecords;

  // helper to normalize a single bill record to expected shape
  const normalize = (b) => {
    if (!b) return null;
    const date =
      b.date ||
      b.paidAt ||
      b.createdAt ||
      b.created_at ||
      (typeof b === "string" ? b : null);
    const receipt = b.receipt || b.receiptNo || b.receipt_no || b.reference || b.ref || "";
    const billName = b.billName || b.name || b.bill || b.description || b.title || "Bill";
    const amount = Number(b.amount ?? b.total ?? b.paymentAmount ?? b.payment_amount ?? 0) || 0;
    const paymentMethod = b.paymentMethod || b.method || b.mode || b.channel || "Unknown";
    return { date, receipt, billName, amount, paymentMethod };
  };

  const normalizedData = data.map(normalize).filter(Boolean);

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("en-PH");
    } catch {
      return String(d);
    }
  };

  const formatPeso = (n) =>
    Number(n || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 });

  return (
    <div className="flex-1 bg-white border-10 border-[#b8d8ba] rounded-lg shadow p-6 relative">
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#3d523a] transition"
        aria-label="Back"
      >
        <FaArrowLeft size={24} />
      </button>

      <h2 className="text-3xl md:text-4xl font-bold text-center text-[#5a7350] mb-6">🧾 Bills History</h2>

      <div className="border-t border-gray-300 pt-4">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading bills...</div>
        ) : normalizedData.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No bills found for this member.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-[#7e9e6c] text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Bill name</th>
                  <th className="py-3 px-4 text-right">Amount (₱)</th>
                  <th className="py-3 px-4 text-left">Payment Method</th>
                </tr>
              </thead>

              <tbody>
                {normalizedData.map((record, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-[#e4f2e7] transition`}
                  >
                    <td className="py-3 px-4 border-t border-gray-200">{formatDate(record.date)}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{record.billName}</td>
                    <td className="py-3 px-4 border-t border-gray-200 text-right">{formatPeso(record.amount)}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{record.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
