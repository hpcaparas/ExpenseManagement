import { useState, useEffect, useRef } from "react";
import { FiMenu, FiChevronDown, FiLogOut, FiLock, FiImage } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import logo from "../images/spendflow_transparent_title.png";
import defaultAvatar from "../images/avatar_default.jpg";
import imageCompression from "browser-image-compression";

const Header = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [userAvatar, setUserAvatar] = useState(defaultAvatar);
  const [userName, setUserName] = useState("User");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmOldPassword, setConfirmOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [compressedFile, setCompressedFile] = useState(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserName(user.name || "User");
      if (user.profilePicture) {
        setUserAvatar(`http://localhost:8080/uploads/profilePictures/${user.profilePicture}`);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    try {
      localStorage.setItem("__idle__logout", JSON.stringify({ ts: Date.now() }));
    } catch {}

    navigate("/");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedBlob = await imageCompression(file, options);
      const fileName = `compressed_${Date.now()}.jpg`;
      const compressed = new File([compressedBlob], fileName, {
        type: "image/jpeg",
      });

      setSelectedFile(file);
      setCompressedFile(compressed);
      setPreviewImage(URL.createObjectURL(compressed));
    } catch (error) {
      console.error("Image compression failed:", error);
      alert("Failed to compress image. Please try again.");
    }
  };

  const handlePasswordChange = async () => {
    if (oldPassword !== confirmOldPassword) {
      alert("Old password and confirm old password do not match.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await ApiClient.post(`/users/${user.id}/change-password`, {
        oldPassword,
        newPassword,
      });

      alert(response.data.message || "Password changed successfully!");
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setConfirmOldPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (!compressedFile) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", compressedFile);

    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const response = await ApiClient.post(
        `/users/${user.id}/upload-profile-picture`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const profilePicture = response.data.filename;
      setUserAvatar(`http://localhost:8080/uploads/profilePictures/${profilePicture}`);

      user.profilePicture = profilePicture;
      localStorage.setItem("user", JSON.stringify(user));

      alert("Profile picture updated successfully!");
      setIsModalOpen(false);
      setPreviewImage(null);
      setSelectedFile(null);
      setCompressedFile(null);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Error uploading profile picture. Please try again.");
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-4">
        <div className="mx-auto flex h-16 max-w-[3000px] items-center justify-between rounded-[24px] border border-white/60 bg-white/75 px-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm md:hidden"
              onClick={toggleSidebar}
            >
              <FiMenu size={20} />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Expense Management Logo"
                className="h-12 md:h-14"
              />
            </div>
          </div>

          <div className="flex items-center gap-3" ref={dropdownRef}>
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold text-slate-900">Welcome back</div>
              <div className="text-xs text-slate-500">{userName}</div>
            </div>

            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm transition hover:shadow-md"
            >
              <img
                src={userAvatar}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
              <FiChevronDown className="hidden text-slate-500 md:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-16 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsModalOpen(true);
                  }}
                >
                  <FiImage />
                  Change Account Picture
                </button>

                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                >
                  <FiLock />
                  Change Password
                </button>

                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <FiLogOut />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isModalOpen && (
        <PremiumModal
          title="Change Account Picture"
          subtitle="Upload a clean square photo for the best profile appearance."
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />

            {previewImage && (
              <div className="flex justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-slate-100"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-blue-900/20"
                onClick={handleUpload}
              >
                Upload
              </button>
            </div>
          </div>
        </PremiumModal>
      )}

      {isPasswordModalOpen && (
        <PremiumModal
          title="Change Password"
          subtitle="Update your password to keep your account secure."
          onClose={() => setIsPasswordModalOpen(false)}
        >
          <div className="space-y-4">
            <PremiumField
              label="Old Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <PremiumField
              label="Confirm Old Password"
              type="password"
              value={confirmOldPassword}
              onChange={(e) => setConfirmOldPassword(e.target.value)}
            />
            <PremiumField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-blue-900/20"
                onClick={handlePasswordChange}
              >
                Save
              </button>
            </div>
          </div>
        </PremiumModal>
      )}
    </>
  );
};

function PremiumModal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function PremiumField({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

export default Header;