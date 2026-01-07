// SharesLineChart.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import axios from "axios";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SharesLineChart({ members = [], dataPoints = null }) {
  const currentYear = new Date().getFullYear();
  const [monthsToShow, setMonthsToShow] = useState(12);
  const [year, setYear] = useState(currentYear);
  const [apiMonthlyTotals, setApiMonthlyTotals] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const chartRef = useRef(null);

  const labels = MONTH_NAMES.slice(0, monthsToShow);

  useEffect(() => {
    // skip API if dataPoints supplied or members have shareHistory
    const hasShareHistory = Array.isArray(members) && members.some(m => Array.isArray(m.shareHistory) && m.shareHistory.length);
    if (Array.isArray(dataPoints) && dataPoints.length) { setApiMonthlyTotals(null); return; }
    if (hasShareHistory) { setApiMonthlyTotals(null); return; }

    let cancelled = false;
    (async () => {
      setLoadingApi(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const base = "http://localhost:8000";
        const url = `${base}/api/shares/by-year/${year}`;
        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });

        let monthly = Array(12).fill(0);
        if (res?.data?.monthly && Array.isArray(res.data.monthly)) {
          monthly = res.data.monthly.map(v => Number(v || 0));
        } else if (Array.isArray(res.data)) {
          res.data.forEach(r => {
            const m = Number(r.month);
            const t = Number(r.total) || 0;
            if (m >= 1 && m <= 12) monthly[m - 1] = Math.round(t);
          });
        } else if (res?.data?.rows && Array.isArray(res.data.rows)) {
          res.data.rows.forEach(r => {
            const m = Number(r.month);
            const t = Number(r.total) || 0;
            if (m >= 1 && m <= 12) monthly[m - 1] = Math.round(t);
          });
        }

        if (!cancelled) setApiMonthlyTotals(monthly);
      } catch (err) {
        console.error("[SharesLineChart] fetch error:", err);
        if (!cancelled) setApiMonthlyTotals(Array(12).fill(0));
      } finally {
        if (!cancelled) setLoadingApi(false);
      }
    })();

    return () => { cancelled = true; };
  }, [members, dataPoints, year]);

  // Build numeric values safely
  const values = useMemo(() => {
    if (Array.isArray(dataPoints) && dataPoints.length) {
      const v = dataPoints.slice(0, monthsToShow).map(d => Number(d.totalShares || 0));
      while (v.length < monthsToShow) v.push(0);
      return v;
    }

    const hasShareHistory = Array.isArray(members) && members.some(m => Array.isArray(m.shareHistory) && m.shareHistory.length);
    if (hasShareHistory) {
      const monthlyTotals = Array(monthsToShow).fill(0);
      members.forEach(m => {
        if (Array.isArray(m.shareHistory)) {
          m.shareHistory.forEach(entry => {
            const eYear = Number(entry.year);
            const eMonth = Number(entry.month);
            const eShares = Number(entry.shares) || 0;
            if (eYear === Number(year) && eMonth >= 1 && eMonth <= monthsToShow) {
              monthlyTotals[eMonth - 1] += eShares;
            }
          });
        } else {
          const total = Number(m.totalShares ?? m.shares ?? 0);
          if (total > 0) {
            const perMonth = total / 12;
            for (let i = 0; i < monthsToShow; i++) monthlyTotals[i] += perMonth;
          }
        }
      });
      return monthlyTotals.map(v => Math.round(v));
    }

    if (Array.isArray(apiMonthlyTotals)) {
      return apiMonthlyTotals.slice(0, monthsToShow).map(v => Math.round(v || 0));
    }

    return Array(monthsToShow).fill(0);
  }, [members, dataPoints, apiMonthlyTotals, monthsToShow, year]);

  const totalShares = values.reduce((a,b) => a + b, 0);

  // keep data/datasets defined to avoid react-chartjs-2 errors
  const data = {
    labels,
    datasets: [
      {
        label: "Total Shares",
        data: values,
        borderColor: "#19705A",
        backgroundColor: "rgba(25,112,90,0.12)",
        fill: true,
        tension: 0.28,
        pointRadius: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#19705A",
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: ctx => `${Number(ctx.parsed.y || 0).toLocaleString()} shares`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280" }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.06)", borderDash: [4,4] },
        ticks: {
          color: "#6b7280",
          callback: (v) => {
            if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
            if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
            return v;
          }
        }
      }
    },
  };

  // small header controls
  const yearOptions = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) yearOptions.push(y);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 h-[460px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-700">Shares Growth</h3>
          <p className="text-sm text-gray-500 mt-1">Showing year {year}  — total: <span className="font-semibold text-gray-800">{totalShares.toLocaleString()}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-[180px]">
        <Line ref={chartRef} data={data} options={options} />
      </div>

      {loadingApi && <p className="text-sm text-gray-500 mt-2">Loading share records for {year}...</p>}
    </div>
  );
}
