import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";

const PasswordReset = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await ApiClient.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleResetClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      await ApiClient.post(`/users/${selectedUser.id}/reset-password`);
      alert(`Password has been reset and emailed to ${selectedUser.email}`);
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Failed to reset password. Please try again.");
    } finally {
      setIsModalOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Password Reset</h1>

      {/* Table View (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border-b text-left">Fullname</th>
              <th className="p-2 border-b text-left">Username</th>
              <th className="p-2 border-b text-left">Email</th>
              <th className="p-2 border-b text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-2 border-b">{user.name}</td>
                <td className="p-2 border-b">{user.username}</td>
                <td className="p-2 border-b">{user.email}</td>
                <td className="p-2 border-b">
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleResetClick(user)}
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View (Mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded shadow">
            <p className="font-bold">{user.name}</p>
            <p className="text-gray-600">Username: {user.username}</p>
            <p className="text-gray-600">Email: {user.email}</p>
            <button
              className="bg-red-500 text-white px-3 py-1 mt-2 rounded hover:bg-red-600 w-full"
              onClick={() => handleResetClick(user)}
            >
              Reset Password
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Password Reset</h2>
            <p>
              Are you sure you want to reset the password for{" "}
              <span className="font-bold">{selectedUser?.name}</span>?
            </p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded mr-2"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={confirmResetPassword}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordReset;
