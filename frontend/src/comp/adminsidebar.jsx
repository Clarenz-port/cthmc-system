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

export default function Sidebar({
  onNavigate = () => {},
}) {
  const [role, setRole] = useState("");
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
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNavigate(value)}
    >
      {Icon}
      <span>{label}</span>
    </div>
  );

  // NON-clickable section title
  const headerItem = (label, Icon = null) => (
    <div className="flex items-center gap-4 px-3 py-3 rounded text-lg font-extrabold text-gray-700 select-none">
      {Icon}
      <span>{label}</span>
    </div>
  );

  // SUB ITEM
  const subItem = (label, value) => (
    <div
      className="px-3 py-2 pl-10 rounded hover:bg-[#eaf7ea] cursor-pointer text-md"
      onClick={() => onNavigate(value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNavigate(value)}
    >
      {label}
    </div>
  );

  return (
    <aside
      className="fixed left-0 top-24 w-67 h-[calc(100vh-6rem)] bg-white border-r border-gray-200 p-4 overflow-auto z-20 flex flex-col justify-between"
      aria-label="Sidebar"
    >
      {/* TOP SECTION */}
      <div>
        {/* WELCOME */}
        <div className="mb-6 px-2">
          <p className="text-2xl font-semibold text-gray-700">Welcome,</p>
          <p className="text-2xl font-extrabold text-gray-700">
            {role === "superadmin" ? "Super Admin" : "Admin"}
          </p>
        </div>

        <hr className="my-3" />

        <nav className="mb-4">
          {/* Dashboard */}
          {navItem("Dashboard", "dashboard", <FaHome />)}

          {/* Loans */}
          {headerItem("Loans", <FaHandHoldingUsd />)}

          <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">
            {subItem("Pending Loans", "pendingLoans")}
            {subItem("Approved Loans", "approvedLoan")}

            {/* THIS opens like Manage Notice */}
            {subItem("Duedates", "totalloan")}
          </div>

          {/* Shares */}
          {navItem("Shares", "shares", <FaChartPie />)}

          {/* Users */}
          {headerItem("Users", <FaUsers />)}

          <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">
            {subItem("Member", "users:members")}
            {role === "superadmin" && subItem("Admin", "users:admins")}
            {subItem("Activity Logs", "users:activity")}
          </div>

          {/* Manage Notice */}
          {navItem("Manage Notice", "notice", <FaBullhorn />)}
        </nav>

        <hr className="my-3" />
      </div>

      {/* LOGOUT BUTTON */}
      <div className="px-2 mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 bg-gray-400 hover:bg-gray-300 text-white px-4 py-3 rounded-lg font-semibold text-lg"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
}
