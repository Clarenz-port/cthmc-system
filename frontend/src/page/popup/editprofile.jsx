import React, { useEffect, useState, useRef } from "react";
import { FaUser, FaPhone, FaEnvelope, FaBirthdayCake, FaEdit } from "react-icons/fa";
import axios from "axios";

/**
 * EditProfilePopup (with Remove Picture)
 *
 * - Adds "Remove Picture" button that deletes avatar on server (DELETE) or clears avatarUrl via PUT fallback.
 * - Uses inline SVG placeholder to avoid external network dependency.
 *
 * Adjust API base / endpoints if your backend differs.
 */
export default function EditProfilePopup({ isOpen, onClose, member, onSave }) {
  const [isEditing, setIsEditing] = useState({
    name: false,
    phone: false,
    email: false,
    birthdate: false,
    username: false,
  });

  const [profile, setProfile] = useState({});
  const [error, setError] = useState("");

  // PASSWORD PANEL
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);

  // IMAGE UPLOAD
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <rect fill='%23e5e7eb' width='100%' height='100%' rx='16' ry='16'/>
    <text x='50%' y='50%' font-size='18' text-anchor='middle' fill='%237e9e6c' dy='.35em'>Avatar</text>
  </svg>`;
  const DEFAULT_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const [imagePreviewUrl, setImagePreviewUrl] = useState(DEFAULT_PLACEHOLDER); // preview (object URL or remote URL)
  const [imageFile, setImageFile] = useState(null); // selected File instance
  const fileInputRef = useRef(null);

  // Initialize local state when modal opens or when member prop changes
  useEffect(() => {
    if (isOpen && member) {
      const id = member.id ?? member._id ?? null;
      const avatar = member.avatarUrl ?? member.avatar ?? null;
      const preview = avatar
        ? (avatar.startsWith("http") ? avatar : `http://localhost:8000${avatar}`)
        : DEFAULT_PLACEHOLDER;

      setProfile({
        id,
        firstName: member.firstName ?? "",
        middleName: member.middleName ?? "",
        lastName: member.lastName ?? "",
        phoneNumber: member.phoneNumber ?? member.phone ?? "",
        email: member.email ?? "",
        birthdate: member.birthdate ?? "",
        username: member.username ?? "",
        avatarUrl: avatar ?? null,
      });

      setImagePreviewUrl(preview);
      setImageFile(null);

      // reset password / errors
      setPwError("");
      setPwSuccess("");
      setShowPasswordPanel(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setError("");
    }
  }, [isOpen, member]);

  // Cleanup object URL on unmount/when preview changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreviewUrl);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [imagePreviewUrl]);

  if (!isOpen) return null;

  const handleChange = (e, field) =>
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEditToggle = (field) =>
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));

  // Image selection handler
  const handleImageSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // validation
    if (!f.type.startsWith("image/")) {
      setError("Selected file must be an image.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setError("");

    // revoke previous object URL if it was one
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreviewUrl);
      } catch (e) {}
    }

    const url = URL.createObjectURL(f);
    setImageFile(f);
    setImagePreviewUrl(url);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Remove picture handler
  const handleRemovePicture = async () => {
    // quick confirmation
    if (!confirm("Remove profile picture? This will delete the avatar from your account.")) return;

    setError("");
    setSaving(true);
    const id = profile.id;
    if (!id) {
      setError("Member id not available.");
      setSaving(false);
      return;
    }
    const token = (localStorage.getItem("token") || "").trim();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // Try DELETE endpoint first (preferred)
      try {
        const delRes = await axios.delete(`http://localhost:8000/api/members/${id}/avatar`, {
          headers: { ...authHeader },
        });
        // server should return updated member or avatarUrl
        const updatedMember = delRes.data?.member ?? delRes.data ?? null;
        // Update UI
        setProfile((prev) => ({ ...prev, avatarUrl: null }));
        setImageFile(null);
        setImagePreviewUrl(DEFAULT_PLACEHOLDER);
        if (typeof onSave === "function") onSave(updatedMember ?? { ...profile, avatarUrl: null });
        setError("");
        setPwError("");
        setPwSuccess("");
        setSaving(false);
        return;
      } catch (errDel) {
        // If DELETE 404s or not implemented, fallback to PUT clearing avatarUrl
        console.warn("DELETE avatar endpoint failed, falling back to PUT to clear avatarUrl.", errDel?.response?.status);
      }

      // Fallback: clear avatarUrl via JSON PUT
      try {
        const payload = { avatarUrl: null };
        const putRes = await axios.put(`http://localhost:8000/api/members/${id}`, payload, {
          headers: { "Content-Type": "application/json", ...authHeader },
        });
        const updated = putRes.data?.member ?? putRes.data ?? { ...profile, avatarUrl: null };

        setProfile((prev) => ({ ...prev, avatarUrl: null }));
        setImageFile(null);
        setImagePreviewUrl(DEFAULT_PLACEHOLDER);
        if (typeof onSave === "function") onSave(updated);
      } catch (errPut) {
        console.error("Fallback PUT to clear avatarUrl failed:", errPut);
        const serverMsg =
          errPut.response?.data?.message ||
          errPut.response?.data?.error ||
          (errPut.response?.data ? JSON.stringify(errPut.response.data) : null);
        setError(serverMsg || "Failed to remove avatar on server.");
      }
    } catch (err) {
      console.error("Unexpected error removing avatar:", err);
      setError("Failed to remove avatar. Check console.");
    } finally {
      setSaving(false);
    }
  };

  // Core save handler: uploads avatar (if any) then updates profile (and password if requested)
  const handleSave = async () => {
    setError("");
    setPwError("");
    setPwSuccess("");

    if (!profile.firstName || !profile.lastName || !profile.username) {
      setError("First name, last name and username are required.");
      return;
    }

    const id = profile.id;
    if (!id) {
      setError("Member id not available.");
      return;
    }

    setSaving(true);
    const token = (localStorage.getItem("token") || "").trim();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const wantsPasswordChange =
        showPasswordPanel && (oldPassword || newPassword || confirmNewPassword);

      if (wantsPasswordChange) {
        if (!oldPassword || !newPassword || !confirmNewPassword) {
          setPwError("All password fields are required to change password.");
          setSaving(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPwError("New password and confirm password do not match.");
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          setPwError("New password must be at least 6 characters.");
          setSaving(false);
          return;
        }
      }

      // Prepare JSON payload (used when not sending multipart file)
      const payload = {
        firstName: profile.firstName,
        middleName: profile.middleName || null,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber || null,
        email: profile.email || null,
        birthdate: profile.birthdate
          ? profile.birthdate.includes("T")
            ? profile.birthdate.split("T")[0]
            : profile.birthdate
          : null,
        username: profile.username,
        ...(wantsPasswordChange ? { oldPassword, password: newPassword } : {}),
      };

      console.info("Updating member payload:", payload);

      // Step 1: If image file selected, try dedicated avatar upload endpoint first
      let uploadedAvatarUrl = null;
      if (imageFile) {
        try {
          const form = new FormData();
          form.append("avatar", imageFile);
          // Optional: include id or other fields if your endpoint needs it
          const avatarRes = await axios.post(
            `http://localhost:8000/api/members/${id}/avatar`,
            form,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                ...authHeader,
              },
            }
          );
          uploadedAvatarUrl = avatarRes.data?.avatarUrl ?? avatarRes.data?.url ?? null;
          console.info("Avatar upload response:", avatarRes.data);
        } catch (errAvatar) {
          console.warn("Avatar endpoint failed, will try multipart PUT fallback.", errAvatar?.response?.status);
          // Fallback: try multipart PUT to the main member endpoint (include fields + file)
          try {
            const form = new FormData();
            Object.entries(payload).forEach(([k, v]) => {
              if (v !== null && v !== undefined) form.append(k, v);
            });
            form.append("avatar", imageFile);
            const putRes = await axios.put(
              `http://localhost:8000/api/members/${id}`,
              form,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  ...authHeader,
                },
              }
            );
            // If this PUT succeeded and returns member or avatar url:
            uploadedAvatarUrl = putRes.data?.member?.avatarUrl ?? putRes.data?.avatarUrl ?? null;
            const updatedMember = putRes.data?.member ?? putRes.data ?? { id, ...payload, avatarUrl: uploadedAvatarUrl };

            // Update UI and inform parent
            const fullAvatar = uploadedAvatarUrl && !uploadedAvatarUrl.startsWith("http")
              ? (uploadedAvatarUrl.startsWith("/") ? `http://localhost:8000${uploadedAvatarUrl}` : `http://localhost:8000/${uploadedAvatarUrl}`)
              : uploadedAvatarUrl;

            if (fullAvatar) {
              setProfile((prev) => ({ ...prev, avatarUrl: fullAvatar }));
              setImagePreviewUrl(fullAvatar);
            }

            if (typeof onSave === "function") onSave(updatedMember);

            setIsEditing({ name: false, phone: false, email: false, birthdate: false, username: false });
            setPwSuccess(wantsPasswordChange ? "Password changed + profile updated." : "");
            setPwError("");
            setError("");
            setShowPasswordPanel(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setImageFile(null);
            setSaving(false);
            return; // done, fallback PUT already updated server/state
          } catch (errPutFallback) {
            console.warn("Multipart PUT fallback failed:", errPutFallback);
            // continue to try JSON PUT (without file) so at least profile updates
          }
        }
      }

      // If uploadedAvatarUrl present, attach to payload so JSON PUT will set it server-side
      if (uploadedAvatarUrl) {
        payload.avatarUrl = uploadedAvatarUrl;
      }

      // Final: send JSON PUT to update profile (without file)
      const res = await axios.put(`http://localhost:8000/api/members/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      console.info("Update response:", res.data);

      // derive updated member and avatar url
      const updated = res.data?.member ?? res.data ?? { id, ...payload };
      let returnedAvatar = updated.avatarUrl ?? updated.avatar ?? payload.avatarUrl ?? null;

      // If server gave a relative path, make it absolute (adjust base URL if needed)
      if (returnedAvatar && !returnedAvatar.startsWith("http")) {
        // adjust base url if your server uses a different host in production
        returnedAvatar = returnedAvatar.startsWith("/")
          ? `http://localhost:8000${returnedAvatar}`
          : `http://localhost:8000/${returnedAvatar}`;
      }

      if (returnedAvatar) {
        updated.avatarUrl = returnedAvatar;
        setProfile((prev) => ({ ...prev, avatarUrl: returnedAvatar }));
        setImagePreviewUrl(returnedAvatar);
      }

      if (typeof onSave === "function") onSave(updated);

      setProfile((prev) => ({ ...prev, ...updated }));
      setIsEditing({ name: false, phone: false, email: false, birthdate: false, username: false });
      setPwSuccess(wantsPasswordChange ? "Password changed + profile updated." : "");
      setPwError("");
      setError("");
      setShowPasswordPanel(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setImageFile(null);
    } catch (err) {
      console.error("Save failed (full error):", err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data ? JSON.stringify(err.response.data) : null);
      setError(serverMsg || err.message || "Failed to save changes. Check server logs.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
      <div className="bg-white border-10 border-[#b8d8ba] rounded-2xl shadow-xl w-[600px] max-h-[85vh] overflow-hidden relative animate-fadeIn">

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto max-h-[85vh] p-8">

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-xl"
          >
            ✕
          </button>

          <h2 className="text-3xl font-bold text-[#7e9e6c] mb-6 text-center">
            Edit Profile
          </h2>

          {/* PROFILE PICTURE */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={imagePreviewUrl}
              className="w-32 h-32 rounded-full border-4 border-[#7e9e6c] object-cover"
              alt="Profile"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={openFileDialog}
                className="text-[#7e9e6c] font-semibold hover:underline"
              >
                Change Picture
              </button>

              {/* show Remove button if there's a persisted avatar or a selected file */}
              {(profile.avatarUrl || imageFile) && (
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  disabled={saving}
                  className="text-red-500 font-semibold hover:underline"
                >
                  {saving ? "Removing..." : "Remove Picture"}
                </button>
              )}
            </div>

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <p className="text-xs text-gray-500 mt-2">Max 5MB. JPG/PNG recommended.</p>
          </div>

          {/* PERSONAL DETAILS */}
          <div className="space-y-4">

            {/* FULL NAME */}
            <div className="flex items-center justify-between border border-[#b8d8ba] px-4 py-2 rounded-lg">
              <div className="flex items-center gap-3 w-full">
                <FaUser className="text-[#7e9e6c] text-xl" />
                {isEditing.name ? (
                  <div className="flex gap-2 w-full">
                    <input className="border p-1 rounded w-1/3"
                      value={profile.firstName}
                      onChange={(e) => handleChange(e, "firstName")}
                    />
                    <input className="border p-1 rounded w-1/3"
                      value={profile.middleName}
                      onChange={(e) => handleChange(e, "middleName")}
                    />
                    <input className="border p-1 rounded w-1/3"
                      value={profile.lastName}
                      onChange={(e) => handleChange(e, "lastName")}
                    />
                  </div>
                ) : (
                  <p className="text-gray-700 font-medium">
                    {profile.firstName} {profile.middleName} {profile.lastName}
                  </p>
                )}
              </div>

              <FaEdit
                className="text-[#7e9e6c] cursor-pointer"
                onClick={() => handleEditToggle("name")}
              />
            </div>

            {/* PHONE */}
            <div className="flex items-center justify-between border border-[#b8d8ba] px-4 py-2 rounded-lg">
              <div className="flex items-center gap-3">
                <FaPhone className="text-[#7e9e6c] text-xl" />
                {isEditing.phone ? (
                  <input
                    className="outline-none"
                    value={profile.phoneNumber}
                    onChange={(e) => handleChange(e, "phoneNumber")}
                  />
                ) : (
                  <p className="text-gray-700 font-medium">{profile.phoneNumber}</p>
                )}
              </div>
              <FaEdit onClick={() => handleEditToggle("phone")} className="text-[#7e9e6c] cursor-pointer" />
            </div>

            {/* EMAIL */}
            <div className="flex items-center justify-between border border-[#b8d8ba] px-4 py-2 rounded-lg">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-[#7e9e6c] text-xl" />
                {isEditing.email ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange(e, "email")}
                  />
                ) : (
                  <p className="text-gray-700 font-medium">{profile.email}</p>
                )}
              </div>
              <FaEdit onClick={() => handleEditToggle("email")} className="text-[#7e9e6c] cursor-pointer" />
            </div>

            {/* BIRTHDATE */}
            <div className="flex items-center justify-between border border-[#b8d8ba] px-4 py-2 rounded-lg">
              <div className="flex items-center gap-3">
                <FaBirthdayCake className="text-[#7e9e6c] text-xl" />
                {isEditing.birthdate ? (
                  <input
                    type="date"
                    value={profile.birthdate ? profile.birthdate.split("T")[0] : ""}
                    onChange={(e) => handleChange(e, "birthdate")}
                  />
                ) : (
                  <p className="text-gray-700 font-medium">
                    {profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : ""}
                  </p>
                )}
              </div>
              <FaEdit
                onClick={() => handleEditToggle("birthdate")}
                className="text-[#7e9e6c] cursor-pointer"
              />
            </div>
          </div>

          {/* ⭐⭐⭐ DO NOT REMOVE THIS LINE OR ACCOUNT TEXT ⭐⭐⭐ */}
          <div className="mt-8 border-t border-[#b8d8ba] pt-5">
            <h3 className="text-xl font-semibold text-[#7e9e6c] mb-4">Account</h3>

            {/* USERNAME */}
            <div className="flex items-center justify-between border border-[#b8d8ba] px-4 py-2 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <FaUser className="text-[#7e9e6c] text-xl" />
                {isEditing.username ? (
                  <input
                    value={profile.username}
                    onChange={(e) => handleChange(e, "username")}
                  />
                ) : (
                  <p className="text-gray-700 font-medium">{profile.username}</p>
                )}
              </div>
              <FaEdit
                onClick={() => handleEditToggle("username")}
                className="text-[#7e9e6c] cursor-pointer"
              />
            </div>

            {/* CHANGE PASSWORD BUTTON */}
            <button
              className="w-full bg-[#7e9e6c] text-white py-2 rounded-lg font-semibold hover:bg-[#6a8e5a] transition"
              onClick={() => {
                setShowPasswordPanel((s) => !s);
                setPwError("");
                setPwSuccess("");
              }}
            >
              Change Password
            </button>
          </div>

          {/* PASSWORD PANEL */}
          {showPasswordPanel && (
            <div className="mt-4 border p-4 rounded-lg bg-white">
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Old Password"
                className="border w-full p-2 rounded mb-2"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />

              <input
                type={showPasswords ? "text" : "password"}
                placeholder="New Password"
                className="border w-full p-2 rounded mb-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm New Password"
                className="border w-full p-2 rounded mb-2"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />

              <label className="flex gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={() => setShowPasswords(!showPasswords)}
                />
                Show Passwords
              </label>

              {pwError && <p className="text-red-500 mt-2">{pwError}</p>}
              {pwSuccess && <p className="text-green-600 mt-2">{pwSuccess}</p>}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-center mt-3">{error}</p>
          )}

          {/* SAVE BUTTON */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#b8d8ba] disabled:opacity-60 text-[#3d5a3a] px-6 py-2 rounded-lg font-semibold hover:bg-[#a3c89f]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
