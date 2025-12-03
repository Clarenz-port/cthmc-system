import React from "react";

function fmtMoney(val) {
  const n = Number(val) || 0;
  return n.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Sharehistory({ isOpen, onClose, rows = [], loading = false }) {
  if (!isOpen) return null;

  // normalize rows to array
  const items = Array.isArray(rows) ? rows : [];

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50">
      <div className="bg-white border-10 border-[#b8d8ba] rounded-lg shadow-lg p-6 w-[700px] max-h-[80vh] overflow-auto relative">
        {/* Header */}
        <h2 className="text-3xl font-bold mb-4 text-center text-[#7e9e6c]">Shares History</h2>

        {/* Content */}
        <div className="border-t border-gray-300 pt-4">
          {loading ? (
            <p className="text-center py-6 text-gray-600">Loading shares...</p>
          ) : items.length === 0 ? (
            <p className="text-center py-6 text-gray-600">No share history available.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#b8d8ba] text-gray-800">
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Payment Method</th>
                  <th className="p-2 border">Amount (₱)</th>
                  <th className="p-2 border">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, idx) => {
                  // support various possible field names from backend
                  const rawDate = r.date ?? r.createdAt ?? r.created_at ?? r.transaction_date;
                  const paymentMethod = r.paymentMethod ?? r.method ?? r.mode ?? r.channel ?? "—";
                  const amt = r.shareamount ?? r.shareAmount ?? r.amount ?? r.value ?? 0;
                  const notes = r.notes ?? r.note ?? r.remarks ?? "";

                  return (
                    <tr key={r.id ?? idx} className="border-b hover:bg-[#f7fbf7]">
                      <td className="p-2 border align-top">{fmtDate(rawDate)}</td>
                      <td className="p-2 border align-top">{String(paymentMethod)}</td>
                      <td className="p-2 border align-top">{fmtMoney(amt)}</td>
                      <td className="p-2 border align-top">{notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Close */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
