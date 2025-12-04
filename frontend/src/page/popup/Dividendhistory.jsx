// src/page/popup/Dividendhistory.jsx
import React from "react";

export default function Dividendhistory({ isOpen, onClose, rows = [], loading = false }) {
  if (!isOpen) return null;

  const fmtAmount = (v) => {
    // show integer, no peso sign, no commas, show 0 for falsy
    const n = Number(v) || 0;
    return String(Math.round(n));
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50 px-4">
      <div className="bg-white border-10 border-[#b8d8ba] rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-3xl"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Popup Header */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-[#7e9e6c]">
          Dividend History
        </h2>

        {/* Table area */}
        <div className="border-t border-gray-300 pt-4">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading dividends...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No dividend records for this member.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#b8d8ba] text-gray-800">
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Amount</th>
                    <th className="p-2 border">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id ?? idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-2 border align-top">{idx + 1}</td>
                      <td className="p-2 border align-top">
                        {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2 border align-top">{fmtAmount(r.amount ?? r.dividend ?? r.value)}</td>
                      
                      <td className="p-2 border align-top">{r.note ?? r.remarks ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Close Button */}
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
