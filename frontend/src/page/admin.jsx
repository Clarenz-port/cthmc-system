// src/page/Admin.jsx
import React, { useState, useEffect } from "react";
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaClock, 
  FaChartBar,
  FaUserClock,
  FaArrowLeft
} from "react-icons/fa";

import axios from "axios";
import Adminnavbar from "../comp/adminnavbar.jsx";
import Sidebar from "../comp/adminsidebar.jsx";
import AccountOnlyPopup from "./popup/accountpopup.jsx";
import MemberDetails from "../page/popup/adminmember.jsx";
import ManageNotice from "../page/popup/Managenotice.jsx";
import PendingLoanApplications from "../page/popup/pendingloanadmin.jsx";
import Approvedloan from "../page/popup/approvedloan.jsx";
import TotalLoan from "../page/popup/Totalloan.jsx";

import LoanStatusDonut from "../comp/charts/LoanStatusDonut.jsx";
import SharesLineChart from "../comp/charts/SharesLineChart.jsx";
import SharesPage from "../page/popup/SharesPage.jsx";

// Import the real ReportModal from the popup folder
import ReportModal from "./popup/ReportModal.jsx";

export default function Admin() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [loanCounts, setLoanCounts] = useState({ pending: 0, approvedOrPaid: 0, total: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  // TOTAL SHARES
  const [sharesTotal, setSharesTotal] = useState(0);
  const [loadingSharesTotal, setLoadingSharesTotal] = useState(false);

  // Report modal open state
  const [showReportModal, setShowReportModal] = useState(false);

  /* -------------------------------------------------------------------------
     REPORT BUTTON HANDLER
  ------------------------------------------------------------------------- */
  const handleReport = () => {
    setShowReportModal(true);
  };

  /* -------------------------------------------------------------------------
     FETCH MEMBERS
  ------------------------------------------------------------------------- */
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const res = await axios.get("http://localhost:8000/api/admin/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching members:", err);
        setMembers([]);
      }
    };
    fetchMembers();
  }, []);

  /* -------------------------------------------------------------------------
     FETCH LOAN COUNTS
  ------------------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      setLoadingCounts(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();

        let pendingCount = 0;
        let approvedOrPaidCount = 0;

        try {
          const resCounts = await axios.get("http://localhost:8000/api/loans/loan-counts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          pendingCount = resCounts.data.pending ?? 0;
          approvedOrPaidCount = resCounts.data.approvedOrPaid ?? 0;
        } catch (err) {
          console.warn("loan-counts endpoint failed:", err?.response?.status || err?.message);
        }

        let approvedLoans = [];
        try {
          const res = await axios.get("http://localhost:8000/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approvedLoans = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          try {
            const resAll = await axios.get("http://localhost:8000/api/loans/members", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const allLoans = Array.isArray(resAll.data) ? resAll.data : resAll.data?.loans ?? [];
            approvedLoans = allLoans.filter((l) => ["approved", "paid"].includes(String(l.status).toLowerCase()));
          } catch (err2) {
            console.error("Failed to fetch approved loans fallback:", err2);
            approvedLoans = [];
          }
        }

        if (!mounted) return;

        setLoanCounts({
          pending: pendingCount || 0,
          approvedOrPaid: approvedOrPaidCount || approvedLoans.length,
          total: approvedLoans.length,
        });
      } catch (err) {
        console.error("❌ Error fetching loan counts:", err);
        setLoanCounts({ pending: 0, approvedOrPaid: 0, total: 0 });
      } finally {
        if (mounted) setLoadingCounts(false);
      }
    };

    fetchCounts();
    return () => {
      mounted = false;
    };
  }, []);

  /* -------------------------------------------------------------------------
     FETCH TOTAL SHARES
  ------------------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    const quickSum = () => {
      if (!Array.isArray(members) || members.length === 0) return 0;
      return members.reduce((acc, m) => {
        const v = Number(m.totalShares ?? m.shares ?? m.shareTotal ?? 0) || 0;
        return acc + v;
      }, 0);
    };

    setSharesTotal(quickSum());

    const fetchSharesTotal = async () => {
      setLoadingSharesTotal(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const endpoints = [
          "/api/shares",
          "/api/shares/all",
          "http://localhost:8000/api/shares"
        ];

        let res = null;
        for (const ep of endpoints) {
          try {
            res = await axios.get(ep, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (res?.status >= 200 && res?.status < 300) break;
          } catch (e) {}
        }

        if (cancelled) return;

        const rows = res?.data ?? [];
        const arr = Array.isArray(rows) ? rows : rows.rows ?? [];

        const sum = arr.reduce((acc, r) => {
          const amt = r.shareamount ?? r.shareAmount ?? r.amount ?? r.value ?? 0;
          return acc + Number(amt || 0);
        }, 0);

        setSharesTotal(sum);
      } catch (err) {
        console.warn("Failed to fetch shares total:", err?.message || err);
      } finally {
        if (!cancelled) setLoadingSharesTotal(false);
      }
    };

    fetchSharesTotal();
    return () => (cancelled = true);
  }, [members]);

  /* -------------------------------------------------------------------------
     HANDLERS
  ------------------------------------------------------------------------- */
  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setActiveSection("memberDetails");
  };

  const handleNavigate = (section) => {
    setSelectedMember(null);
    setActiveSection(section);
  };

  /* -------------------------------------------------------------------------
     UI COMPONENT: Users -> Members
  ------------------------------------------------------------------------- */
  const UsersMembersView = () => (
    <div className="bg-white shadow-lg p-4 rounded-lg">
      <div className="flex items-center mt-4 relative">
        <button
          onClick={() => {
            setActiveSection("dashboard");
          }}
          className="absolute left-0 text-[#5a7350] hover:text-[#7e9e6c] transition text-2xl"
        >
          <FaArrowLeft />
        </button>
      </div>

      <div className="flex-1 text-center">
        <h2 className="text-4xl text-[#5a7350] font-bold">Members</h2>
        <p className="text-md text-gray-500 mb-4 mt-1">{members.length} members</p>
      </div>

      <div className="grid border-t border-gray-300 pt-4 grid-cols-2 gap-4">
        {members.length === 0 ? (
          <div className="text-gray-500 italic">No members found</div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="bg-gray-50 p-4 rounded shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              onClick={() => handleSelectMember(m)}
            >
              <p className="font-semibold">
                {m.firstName} {m.middleName || ""} {m.lastName}
              </p>
              <p className="text-sm text-gray-500">{m.email || "—"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const UsersActivityView = () => (
    <div>
      <h2 className="text-2xl font-bold mb-3">Activity Logs</h2>
      <div className="bg-white p-6 rounded shadow">Activity logs go here.</div>
    </div>
  );

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  /* -------------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans flex flex-col">
      <Adminnavbar onManageNotice={() => setActiveSection("notice")} />

      <Sidebar
        members={members}
        onSelectMember={handleSelectMember}
        selectedMember={selectedMember}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 p-6 overflow-auto ml-64 mt-24">
        {activeSection === "notice" ? (
          <ManageNotice onBack={() => setActiveSection("dashboard")} />
        ) : activeSection === "pendingLoans" ? (
          <PendingLoanApplications onBack={() => setActiveSection("dashboard")} />
        ) : activeSection === "approvedLoan" ? (
          <Approvedloan onBack={() => setActiveSection("dashboard")} />
        ) : activeSection === "totalloan" ? (
          <TotalLoan
            onBack={() => setActiveSection("dashboard")}
            onView={(loanRecord) => {
              const memberId = loanRecord?.userId ?? loanRecord?.memberId ?? loanRecord?.member_id ?? null;
              if (memberId) {
                const nameParts = (loanRecord.memberName || "").split(" ");
                setSelectedMember({
                  id: memberId,
                  firstName: nameParts[0],
                  lastName: nameParts.slice(1).join(" "),
                  loanId: loanRecord.id,
                  loanRecord,
                });
              } else {
                setSelectedMember({
                  id: loanRecord.id,
                  firstName: loanRecord.memberName ?? "Member",
                  loanId: loanRecord.id,
                  loanRecord,
                });
              }
              setActiveSection("memberDetails");
            }}
          />
        ) : activeSection === "memberDetails" && selectedMember ? (
          <MemberDetails
            member={selectedMember}
            onBack={() => {
              setSelectedMember(null);
              setActiveSection("dashboard");
            }}
          />
        ) : activeSection === "shares" ? (
          <SharesPage onBack={() => setActiveSection("dashboard")} members={members} />
        ) : activeSection === "users:members" ? (
          <UsersMembersView />
        ) : activeSection === "users:admins" ? (
          <AccountOnlyPopup inline={true} onClose={() => setActiveSection("dashboard")} />
        ) : activeSection === "users:activity" ? (
          <UsersActivityView />
        ) : (
          <>
            {/* ------------------------------------------------------------------
                DASHBOARD HEADER (Updated with Report Button)
            ------------------------------------------------------------------ */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-extrabold">Dashboard</h1>
              </div>

              <button
                onClick={handleReport}
                className="px-12 py-2 rounded-lg bg-[#7e9e6c] text-lg text-white font-bold hover:bg-[#6a8b5a] shadow-lg"
              >
                Reports
              </button>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-5 gap-4 mb-5">
              {/* Pending */}
              <div
                onClick={() => setActiveSection("pendingLoans")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaClipboardList />
                </div>
                <p className="text-lg font-bold">Pending Loan Applications</p>
                <p className="text-5xl font-bold">{loadingCounts ? "..." : loanCounts.pending}</p>
              </div>

              {/* Approved */}
              <div
                onClick={() => setActiveSection("approvedLoan")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaCheckCircle />
                </div>
                <p className="text-lg font-bold">Approved Loans</p>
                <p className="text-5xl font-bold">{loadingCounts ? "..." : loanCounts.approvedOrPaid}</p>
              </div>

              {/* Duedate */}
              <div
                onClick={() => setActiveSection("totalloan")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaClock />
                </div>
                <p className="text-lg font-bold">Duedate</p>
                <p className="text-5xl font-bold">{loadingCounts ? "..." : loanCounts.total}</p>
              </div>

              {/* Total Shares */}
              <div
                onClick={() => setActiveSection("shares")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaChartBar />
                </div>
                <p className="text-lg font-bold">Total Shares</p>
                <p className="text-4xl font-bold">
                  {loadingSharesTotal ? "..." : formatCurrency(sharesTotal)}
                </p>
              </div>

              {/* Pending Member */}
              <div className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]">
                <div className="text-5xl text-gray-700 mb-3">
                  <FaUserClock />
                </div>
                <p className="text-lg font-bold">Pending Member</p>
                <p className="text-5xl font-bold">0</p>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-2 gap-8 mb-5">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex justify-center">
                <LoanStatusDonut
                  pending={loanCounts.pending}
                  active={loanCounts.approvedOrPaid}
                  duedate={loanCounts.total}
                />
              </div>

              <SharesLineChart members={members} />
            </div>
          </>
        )}
        {/* REPORT MODAL */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          endpoints={{
            loans: "/api/loans",
            shares: "/api/shares",
            purchases: "/api/purchases",
            bills: "/api/bills",
          }}
        />
      </main>
    </div>
  );
}
