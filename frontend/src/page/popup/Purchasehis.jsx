import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

export default function PurchaseHistory({ onBack, rows = [], loading = false }) {
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const data = Array.isArray(rows) ? rows : [];

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("en-PH");
  };

  const fmtMoney = (val) =>
    Number(val || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });

  const itemsSummary = (items) => {
    if (!items) return "-";

    if (Array.isArray(items)) {
      return items
        .map((it) =>
          it && (it.name || it.item)
            ? `${it.name || it.item} x${it.qty ?? 1}`
            : String(it)
        )
        .join(", ");
    }

    if (typeof items === "string") {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed
            .map((it) =>
              it.name ? `${it.name} x${it.qty ?? 1}` : String(it)
            )
            .join(", ");
        }
      } catch {}
      return items;
    }

    if (typeof items === "object") {
      const vals = Object.values(items).filter(Boolean);
      if (vals.length === 0) return "-";
      return vals
        .map((it) =>
          it && it.name ? `${it.name} x${it.qty ?? 1}` : String(it)
        )
        .join(", ");
    }

    return "-";
  };

  return (
    <div className="flex-1 bg-white border-10 border-[#b8d8ba] rounded-lg shadow p-10 relative">
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#3d523a] transition"
      >
        <FaArrowLeft size={28} />
      </button>

      <h2 className="text-4xl font-bold text-center text-[#5a7350] mb-8">
        🛒 Purchase History
      </h2>

      <div className="border-t border-gray-300 pt-4">
        {loading ? (
          <div className="py-8 text-center text-gray-600">
            Loading purchases...
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-gray-600">
            No purchases found for this member.
          </div>
        ) : (
          <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-[#d6ead8]">
                <tr>
                  <th className="text-left px-3 py-3">Date</th>
                  <th className="text-left px-3 py-3">Items</th>
                  <th className="text-right px-3 py-3">Total</th>
                  <th className="text-right px-3 py-3">Due Date</th>
                  <th className="text-center px-3 py-3">Status</th>
                  <th className="text-center px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => {
                  const pid = p.id || p._id || p.purchaseId || i;
                  return (
                    <tr key={pid} className="border-t border-gray-400">
                      <td className="px-3 py-3">
                        {formatDate(p.createdAt || p.created_at || p.date)}
                      </td>
                      <td className="px-3 py-3">{itemsSummary(p.items)}</td>
                      <td className="px-3 py-3 text-right">
                        {fmtMoney(
                          p.total ?? p.totalAmount ?? p.amount ?? p.price ?? 0
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {p.dueDate ? formatDate(p.dueDate) : "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {String(p.status ?? p.paymentStatus ?? "unknown")
                          .charAt(0)
                          .toUpperCase() +
                          String(p.status ?? p.paymentStatus ?? "unknown").slice(
                            1
                          )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => setSelectedPurchase(p)}
                          className="px-3 py-1 border border-gray-400 rounded shadow-sm hover:bg-gray-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-auto p-6">
            <h3 className="text-xl font-bold mb-4">Purchase Details</h3>

            {/* DETAIL TABLE */}
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
                {(selectedPurchase.items ?? []).map((it, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2">{it.name || it.item}</td>
                    <td className="px-3 py-2 text-right">{it.qty ?? 1}</td>
                    <td className="px-3 py-2 text-right">
                      {fmtMoney(it.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}
                    </td>
                  </tr>
                ))}

                <tr className="border-t">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {fmtMoney(selectedPurchase.total)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-right mt-4 text-sm text-gray-600">
              Due date:{" "}
              <span className="font-medium">
                {selectedPurchase.dueDate
                  ? formatDate(selectedPurchase.dueDate)
                  : "-"}
              </span>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
