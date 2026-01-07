import React, { useState } from "react";
import axios from "axios";

export default function ReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState("all");
  const [period, setPeriod] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [mode, setMode] = useState("summary");
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:8000/api/reports/generate",
        { reportType, period, year, month, mode },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      alert("Failed to generate report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl">
        <h2 className="text-xl font-bold mb-4">Generate Report</h2>

        <label className="block mb-2">Report Type</label>
        <select className="w-full border p-2 mb-3" onChange={e => setReportType(e.target.value)}>
          <option value="all">All</option>
          <option value="loans">Loans</option>
          <option value="shares">Shares</option>
          <option value="purchases">Purchases</option>
          <option value="bills">Bills</option>
        </select>

        <label className="block mb-2">Period</label>
        <select className="w-full border p-2 mb-3" onChange={e => setPeriod(e.target.value)}>
          <option value="all">All Time</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        {period !== "all" && (
          <>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full border p-2 mb-3"
              placeholder="Year"
            />

            {period === "monthly" && (
              <select
  value={month}
  onChange={e => setMonth(Number(e.target.value))}
  className="w-full border p-2 mb-3"
>
  <option value="">Select Month</option>
  {Array.from({ length: 12 }, (_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>

            )}
          </>
        )}

        <label className="block mb-2">Mode</label>
        <select className="w-full border p-2 mb-4" onChange={e => setMode(e.target.value)}>
          <option value="summary">Total per Member</option>
          <option value="detailed">Detailed</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={downloadReport}
            disabled={loading}
            className="px-4 py-2 bg-[#7e9e6c] text-white rounded"
          >
            {loading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
