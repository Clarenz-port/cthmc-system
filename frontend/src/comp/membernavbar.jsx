import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EditProfilePopup from "../page/popup/editprofile.jsx";

export default function MemberNavbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [member, setMember] = useState(null); // fetched current member
  const settingsRef = useRef();
  const navigate = useNavigate();

  // Prevent going back after logout
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      window.history.go(1);
    };
  }, []);

  // Load current member profile (used to populate the EditProfilePopup)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // not logged in — other code handles redirect
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/members/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        if (!res.ok) {
          // If unauthorized or failed, don't crash — optionally navigate to login
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }
          return;
        }
        const data = await res.json();
        if (mounted) setMember(data);
      } catch (err) {
        console.error("Failed to load profile in navbar:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  const handleViewClick = (type) => alert(`Viewing ${type} details...`);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-[#317256] p-9 flex justify-between items-center fixed top-0 left-0 right-0 z-50 h-22">
        <h1 className="text-3xl font-bold text-white">Profile</h1>

        <div className="flex right-10 space-x-6 relative">
          <FaBell
            className="text-white text-3xl cursor-pointer"
            onClick={() => {
              setShowNotifPopup(true);
              setIsSettingsOpen(false);
            }}
          />

          <div className="relative" ref={settingsRef}>
            <FaCog
              className="text-white text-3xl cursor-pointer"
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setShowNotifPopup(false);
              }}
            />

            {isSettingsOpen && (
              <div className="absolute -right-2 mt-3 w-54 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="absolute -top-2 right-3">
                  <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white"></div>
                </div>

                <p
                  onClick={() => {
                    // ensure we have latest member before opening popup
                    setIsEditProfileOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="block w-full font-semibold text-lg px-8 py-4 text-gray-700 hover:rounded-t-lg hover:bg-gray-100 cursor-pointer"
                >
                  Edit Profile
                </p>

                <p
                  onClick={handleLogout}
                  className="block w-full font-semibold text-lg px-8 py-4 text-gray-700 hover:rounded-b-lg hover:bg-gray-100 cursor-pointer"
                >
                  Logout
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      {showNotifPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-50">
          <div className="bg-white border-10 border-[#b8d8ba] rounded-2xl shadow-xl p-8 w-[520px] relative animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#7e9e6c] mb-6 text-center">
              Notifications
            </h2>

            <div className="space-y-2">
              {[
                { label: "📄 Loan Request", type: "Loan Request" },
                { label: "📢 Notice", type: "Notice" },
                { label: "⚠️ Alert", type: "Alert" },
              ].map((item) => (
                <div
                  key={item.type}
                  className="flex justify-between items-center border-[#85a265] border-t-2 border-b-2 px-2 py-3 transition"
                >
                  <p className="text-gray-800 font-semibold select-none">
                    {item.label}
                  </p>
                  <p
                    onClick={() => handleViewClick(item.type)}
                    className="text-[#7e9e6c] font-semibold hover:underline cursor-pointer select-none"
                  >
                    View
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNotifPopup(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Popup wired to current member */}
      <EditProfilePopup
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        member={member}
        onSave={(updatedMember) => {
          // update local member copy so the popup stays in sync next time
          setMember((prev) => ({ ...prev, ...updatedMember }));
          // close popup
          setIsEditProfileOpen(false);
        }}
      />
    </>
  );
}
