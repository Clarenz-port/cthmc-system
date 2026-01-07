import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaHome,
  FaBullhorn,
  FaHandHoldingUsd,
  FaChartPie,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Sidebar({ onNavigate = () => {} }) {
  const [role, setRole] = useState("");
  const [showConfirm, setShowConfirm] = useState(false); // ← NEW
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) setRole(storedRole.toLowerCase().trim());
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  // CLICKABLE MENU ITEM
  const navItem = (label, value, Icon = null) => (
    <div
      className="flex items-center gap-4 px-3 py-3 rounded hover:bg-[#d6ead8] text-lg cursor-pointer font-extrabold"
      onClick={() => onNavigate(value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onNavigate(value)
      }
    >
      {Icon}
      <span>{label}</span>
    </div>
  );

  const headerItem = (label, Icon = null) => (
    <div className="flex items-center gap-4 px-3 py-3 rounded text-lg font-extrabold text-gray-700 select-none">
      {Icon}
      <span>{label}</span>
    </div>
  );

  const subItem = (label, value) => (
    <div
      className="px-3 py-2 pl-10 rounded hover:bg-[#eaf7ea] cursor-pointer text-md"
      onClick={() => onNavigate(value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onNavigate(value)
      }
    >
      {label}
    </div>
  );

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      <aside
        className="fixed left-0 top-24 w-67 h-[calc(100vh-6rem)] bg-white border-r border-gray-200 p-4 overflow-auto z-20 flex flex-col justify-between"
        aria-label="Sidebar"
      >
        <div>
          <div className="mb-6 px-2">
            <p className="text-2xl font-semibold text-gray-700">Welcome,</p>
            <p className="text-2xl font-extrabold text-gray-700">
              {role === "superadmin" ? "Super Admin" : "Admin"}
            </p>
          </div>

          <hr className="my-3" />

          <nav className="mb-4">
            {navItem("Dashboard", "dashboard", <FaHome />)}

            {headerItem("Loans", <FaHandHoldingUsd />)}
            <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">
              {subItem("Pending Loans", "pendingLoans")}
              {subItem("Approved Loans", "approvedLoan")}
              {subItem("Duedates", "totalloan")}
            </div>

            {navItem("Shares", "shares", <FaChartPie />)}

            {headerItem("Users", <FaUsers />)}
            <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">
              {subItem("Member", "users:members")}
              {role === "superadmin" && subItem("Admin", "users:admins")}
              {subItem("Activity Logs", "users:activity")}
            </div>

            {navItem("Manage Notice", "notice", <FaBullhorn />)}
          </nav>

          <hr className="my-3" />
        </div>

        {/* LOGOUT BUTTON — triggers modal */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center w-full gap-3 bg-gray-400 hover:bg-gray-300 text-white px-4 py-3 rounded-lg font-semibold text-lg"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= CONFIRMATION MODAL ================= */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to log out?
            </p>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="w-1/2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
