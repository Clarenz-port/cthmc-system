import React from "react";
import { FaArrowLeft } from "react-icons/fa";

export default function LoanHistory({ onBack }) {
  const purchaseRecords = [
    {
      date: "2025-10-15",
      amount: "15,000",
      repayment: "6 months",
      status: "Ongoing",
    },
    {
      date: "2025-10-22",
      amount: "10,000",
      repayment: "3 months",
      status: "Completed",
    },
    {
      date: "2025-09-10",
      amount: "5,000",
      repayment: "3 months",
      status: "Completed",
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
        🛒 Loan History
      </h2>

      <div className="border-t border-gray-300 pt-4">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-[#7e9e6c] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Loan amount (₱)</th>
              <th className="py-3 px-4 text-left">Repayment</th>
              <th className="py-3 px-4 text-left">Status</th>
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
                  ₱{record.amount}
                </td>
                <td className="py-3 px-4 border-t border-gray-200">
                  {record.repayment}
                </td>
                <td className="py-3 px-4 border-t border-gray-200">
                  {record.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
