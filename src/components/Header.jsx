import { useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import logo from "../images/ExpenseManagementLogoTopNew.png";
import defaultAvatar from "../images/avatar_default.jpg";
import config from "../config/config"; 
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

  useEffect(() => {
    // Fetch user profile image and name on load
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserName(user.name || "User"); // Set user's name
      if (user.profilePicture) {
        setUserAvatar(`${config.baseUrl}emsImages/profilePictures/${user.profilePicture}`);
      }
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // ✅ Compress Image Before Storing
        const options = {
          maxSizeMB: 1, // ✅ Compress image to max 1MB
          maxWidthOrHeight: 1024, // ✅ Resize image to max 1024x1024 pixels
          useWebWorker: true, // ✅ Use Web Workers for better performance
        };

        const compressedBlob = await imageCompression(file, options);
        console.log("Original file size:", (file.size / 1024 / 1024).toFixed(2), "MB");
        console.log("Compressed file size:", (compressedBlob.size / 1024 / 1024).toFixed(2), "MB");

        // ✅ Convert Blob to .jpg File
        const fileName = `compressed_${Date.now()}.jpg`; // Ensure a proper .jpg extension
        const compressedFile = new File([compressedBlob], fileName, { type: "image/jpeg" });

        setSelectedFile(file); // ✅ Store the original file
        setCompressedFile(compressedFile); // ✅ Store the converted .jpg file
        setPreviewImage(URL.createObjectURL(compressedFile)); // ✅ Preview compressed image
      } catch (error) {
        console.error("Image compression failed:", error);
        alert("Failed to compress image. Please try again.");
      }
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
      const response = await ApiClient.post(`/users/${user.id}/upload-profile-picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const profilePicture = response.data.filename;
      setUserAvatar(`${config.baseUrl}emsImages/profilePictures/${profilePicture}`);

      // ✅ Update user info in localStorage
      user.profilePicture = profilePicture;
      localStorage.setItem("user", JSON.stringify(user));

      alert("Profile picture updated successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Error uploading profile picture. Please try again.");
    }
  };

  return (
    <div className="bg-gray-800 text-white flex justify-between items-center p-4 fixed w-full z-50">
      {/* Hamburger Menu (Mobile) */}
      <button className="md:hidden focus:outline-none" onClick={toggleSidebar}>
        <FiMenu size={24} />
      </button>

      {/* Logo */}
      <div className="flex-grow flex justify-center md:justify-start">
        <img src={logo} alt="Expense Management Logo" className="h-10 md:h-12" />
      </div>

      {/* User Section */}
      <div className="flex items-center space-x-4">
        {/* Welcome Message */}
        <span className="hidden md:block text-lg font-medium">Welcome, {userName}</span>

        {/* User Avatar */}
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center focus:outline-none">
            <img src={userAvatar} alt="User Avatar" className="w-12 h-12 rounded-full object-cover" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-50">
              <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => setIsModalOpen(true)}>
                Change Account Picture
              </button>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => setIsPasswordModalOpen(true)}>
                Change Password
              </button>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Profile Picture Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-2">Change Account Picture</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
            {previewImage && <img src={previewImage} alt="Preview" className="w-32 h-32 rounded-full object-cover mb-4" />}
            <div className="flex justify-end">
              <button className="bg-gray-500 text-white px-3 py-1 rounded mr-2" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleUpload}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Change Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-black">Change Password</h2>

            <label className="block text-black mb-1">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />

            <label className="block text-black mt-3 mb-1">Confirm Old Password</label>
            <input
              type="password"
              value={confirmOldPassword}
              onChange={(e) => setConfirmOldPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />

            <label className="block text-black mt-3 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />

            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded mr-2"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded"
                onClick={handlePasswordChange}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
