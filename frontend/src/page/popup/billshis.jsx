import React from "react";
import { FaArrowLeft } from "react-icons/fa";

export default function BillsHistory({ onBack }) {
  const purchaseRecords = [
    {
      date: "2025-10-15",
      receipt: "00001",
      bill: "Meralco",
      amount: "500",
      method: "Cash",
    },
    {
      date: "2025-10-22",
      receipt: "00002",
      bill: "water bill",
      amount: "300",
      method: "GCash",
    },
    {
      date: "2025-09-10",
      receipt: "00003",
      bill: "Water bill",
      amount: "300",
      method: "Bank Transfer",
    },
  ];

  return (
    <div className="flex-1 bg-white border-10 border-[#b8d8ba] rounded-lg shadow p-10 relative">
      {/* 🔙 Back button (top-left only icon) */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#3d523a] transition"
      >
        <FaArrowLeft size={28} />
      </button>

      <h2 className="text-4xl font-bold text-center text-[#5a7350] mb-8">
        🛒 Bills History
      </h2>

      <div className="border-t border-gray-300 pt-4">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-[#7e9e6c] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Reciept no.</th>
              <th className="py-3 px-4 text-left">Bill name</th>
              <th className="py-3 px-4 text-left">Amount (₱)</th>
              <th className="py-3 px-4 text-left">Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRecords.map((record, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-[#e4f2e7] transition`}
              >
                <td className="py-3 px-4 border-t border-gray-200">
                  {record.date}
                </td>
                <td className="py-3 px-4 border-t border-gray-200">
                  {record.receipt}
                </td>
                <td className="py-3 px-4 border-t border-gray-200">
                  {record.bill}
                </td>
                <td className="py-3 px-4 border-t border-gray-200">
                  ₱{record.amount}
                </td>
                <td className="py-3 px-4 border-t border-gray-200">
                  {record.method}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
