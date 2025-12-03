import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog } from "react-icons/fa";

export default function Adminnavbar({ onManageNotice }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  // Get user role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole.toLowerCase().trim());
  }, []);

  // Handle logout properly
  const handleLogout = () => {
    // clear stored login data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    // prevent going back to dashboard after logout
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      navigate("/login", { replace: true });
    };

    // redirect to login
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="bg-[#317256] text-white px-6 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50 h-22">
        {/* System Title */}
        <h2 className="text-3xl ml-20 flex-none font-extrabold">CTHMC</h2>

      </header>
    </>
  );
}
