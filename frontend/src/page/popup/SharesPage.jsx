import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";

export default function SharesPage({ onBack, members = [] }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Formatters
  const fmtMoney = (v) => {
    const n = Number(v || 0);
    return n.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Find member name
  const findMemberName = (row) => {
    const id =
      row.userId ??
      row.memberId ??
      row.user_id ??
      row.member_id ??
      row.user?.id ??
      null;

    if (id) {
      const m = members.find(
        (mm) =>
          String(mm.id) === String(id) || String(mm.userId) === String(id)
      );
      if (m)
        return `${m.firstName || ""} ${m.lastName || ""}`.trim() ||
          m.name ||
          "Member";
    }

    return (
      row.memberName ||
      row.name ||
      row.member ||
      row.userName ||
      "Member"
    );
  };

  // Fetch shares
  useEffect(() => {
    let cancelled = false;

    const fetchShares = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token") || "";
        const endpoints = [
          "/api/shares",
          "/api/shares/all",
          "http://localhost:8000/api/shares",
        ];

        let res = null;

        for (const ep of endpoints) {
          try {
            res = await axios.get(ep, {
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
            });
            if (res?.status >= 200 && res?.status < 300) break;
          } catch (e) {}
        }

        const rows = res?.data ?? [];
        if (!cancelled)
          setShares(Array.isArray(rows) ? rows : rows.rows ?? []);
      } catch (err) {
        if (!cancelled) setError("Failed to load shares.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShares();
    return () => (cancelled = true);
  }, [members]);

  // Compute TOTAL SHARES AMOUNT
  const totalSharesAmount = shares.reduce((sum, r) => {
    const amt =
      r.shareamount ??
      r.shareAmount ??
      r.amount ??
      r.value ??
      0;
    return sum + Number(amt || 0);
  }, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">

      {/* HEADER */}
      <div className="relative flex flex-col md:flex-row items-center p-2 md:items-start justify-center md:justify-between mb-6 gap-3">
        {/* Back Button (top-left) */}
        <button
          onClick={onBack}
          className="absolute left-0 top-0 md:static text-[#5a7350] hover:text-[#7e9e6c] transition text-2xl p-1"
          aria-label="Back"
        >
          <FaArrowLeft />
        </button>

        {/* Title centered on all sizes */}
        
        <h2 className="text-2xl md:text-4xl ml-23 font-bold text-[#5a7350] text-center">
          Shares
        </h2>

        {/* Total Shares placed on right for md+, below title for small */}
        <div className="absolute right-0 top-0 md:static md:ml-4">
          <div className="bg-[#eaf6ea] text-[#2f6e3f] font-semibold px-4 py-2 rounded-md shadow-sm text-sm md:text-base">
            {loading ? "Loading..." : `Total Shares: ${fmtMoney(totalSharesAmount)}`}
          </div>
        </div>
      </div>
      {/* Content */}
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-gray-600">Loading shares...</p>
      ) : shares.length === 0 ? (
        <p className="text-gray-600 border-t border-gray-300 pt-4">No shares found.</p>
      ) : (
        <div className="border-t border-gray-300 pt-4 p-4">
          <table className="w-full shadow-lg border border-gray-300 rounded-lg overflow-hidden text-left text-sm">
            <thead className="bg-[#7e9e6c] text-white">
              <tr>
                <th className="py-4 px-4 text-left">Date</th>
                <th className="py-4 px-4 text-left">Member</th>
                <th className="py-4 px-4 text-left">Amount</th>
                <th className="py-4 px-4 text-left">Payment Method</th>
              </tr>
            </thead>

            <tbody>
              {shares.map((r, idx) => {
                const rawDate =
                  r.date ??
                  r.createdAt ??
                  r.created_at ??
                  r.transaction_date;

                const paymentMethod =
                  r.paymentMethod ??
                  r.method ??
                  r.mode ??
                  r.channel ??
                  "—";

                const amt =
                  r.shareamount ??
                  r.shareAmount ??
                  r.amount ??
                  r.value ??
                  0;

                const memberName = findMemberName(r);

                return (
                  <tr
                    key={r.id ?? idx}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } `}
                  >
                    <td className="py-4 px-4 border-t border-gray-200">
                      {fmtDate(rawDate)}
                    </td>
                    <td className="py-4 px-4 border-t border-gray-200">
                      {memberName}
                    </td>
                    <td className="py-4 px-4 border-t border-gray-200">
                      {fmtMoney(amt)}
                    </td>
                    <td className="py-4 px-4 border-t border-gray-200">
                      {String(paymentMethod)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
          </table>
        </div>
      )}
    </div>
  );
}
