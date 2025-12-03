import React from "react";

export default function Dividendhistory({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50">
      <div className="bg-white border-10 border-[#b8d8ba] rounded-lg shadow-lg p-6 w-[800px] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-4 text-gray-500 hover:text-black text-4xl"
        >
          &times;
        </button>

        {/* Popup Header */}
        <h2 className="text-3xl font-bold mb-4 text-center text-[#7e9e6c]">
          Dividend History
        </h2>

        {/* Popup Table */}
        <div className="border-t border-gray-300 pt-4">
          <table className="w-full border-[#dbe8ba] text-left border-collapse">
            <thead>
              <tr className="bg-[#b8d8ba] text-gray-800">
                <th className="p-2 border">Year</th>
                <th className="p-2 border">Dividend Rate (%)</th>
                <th className="p-2 border">Share Capital</th>
                <th className="p-2 border">Total Dividend (₱)</th>
                <th className="p-2 border">Date Released</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 border">2023</td>
                <td className="p-2 border">5%</td>
                <td className="p-2 border">₱20,000.00</td>
                <td className="p-2 border">₱2,000.00</td>
                <td className="p-2 border">2024-01-15</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 border">2023</td>
                <td className="p-2 border">5%</td>
                <td className="p-2 border">₱20,000.00</td>
                <td className="p-2 border">₱2,000.00</td>
                <td className="p-2 border">2024-01-15</td>
              </tr>
              <tr>
                <td className="p-2 border">2023</td>
                <td className="p-2 border">5%</td>
                <td className="p-2 border">₱20,000.00</td>
                <td className="p-2 border">₱2,000.00</td>
                <td className="p-2 border">2024-01-15</td>
              </tr>
            </tbody>
          </table>
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