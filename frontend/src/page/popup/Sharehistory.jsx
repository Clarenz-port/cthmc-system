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
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
        <div className="flex items-center  justify-between mb-4">
          <h3 className="text-2xl font-bold text-[#7e9e6c]">Shares History</h3>
        </div>

          {loading ? (
            <p className="text-center py-6 text-gray-600">Loading shares...</p>
          ) : items.length === 0 ? (
            <p className="text-center py-6 text-gray-600">No share history available.</p>
          ) : (
            
            <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-[#d6ead8]">
                <tr>
                  <th className="text-left px-3 py-3">Date</th>
                  <th className="text-left px-3 py-3">Payment Method</th>
                  <th className="text-left px-3 py-3">Amount (₱)</th>
                  <th className="text-left px-3 py-3">Notes</th>
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
                    <tr key={r.id ?? idx} className="border-t border-gray-400">
                      <td className="px-3 py-3">{fmtDate(rawDate)}</td>
                      <td className="px-3 py-3">{String(paymentMethod)}</td>
                      <td className="px-3 py-3">{fmtMoney(amt)}</td>
                      <td className="px-3 py-3">{notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        

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
