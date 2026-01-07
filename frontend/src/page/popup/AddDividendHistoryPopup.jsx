import React from "react";

export default function AddDividendHistoryPopup({ isOpen, onClose, rows = [], loading = false }) {
  if (!isOpen) return null;

  const sorted = Array.isArray(rows) ? [...rows].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) : [];
  const total = sorted.reduce((acc, r) => acc + (Number(r.amount ?? r.dividend ?? 0) || 0), 0);

  const fmt = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pb-12 px-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose()} />
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
        <div className="flex items-center  justify-between mb-4">
          <h3 className="text-2xl font-bold text-[#7e9e6c]">Dividend History</h3>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">Records: {sorted.length}</div>
          <div className="text-lg font-semibold">Total: <span className="text-[#7e9e6c]">{fmt(total)}</span></div>
        </div>

        <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-[#d6ead8]">
              <tr>
                <th className="text-left px-3 py-3">Date</th>
                <th className="text-left px-3 py-3">Amount</th>
                <th className="text-left px-3 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-600">Loading...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-600">No dividends found.</td></tr>
              ) : (
                sorted.map((r) => (
                  <tr key={r.id ?? r._id ?? `${r.memberId}-${r.date || r.createdAt}-${Math.random()}`} className="border-t border-gray-400">
                    <td className="px-3 py-3">{r.date ? new Date(r.date).toLocaleDateString("en-PH") : r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-PH") : "-"}</td>
                    <td className="px-3 py-3">{fmt(r.amount ?? r.dividend ?? 0)}</td>
                    <td className="px-3 py-3">{r.note ?? r.remarks ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onClose && onClose()} className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182]">Close</button>
        </div>
      </div>
    </div>
  );
}
