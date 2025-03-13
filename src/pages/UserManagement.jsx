import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await ApiClient.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  // 🔍 Ensure search updates correctly
  useEffect(() => {
    filterAndSortUsers();
  }, [searchTerm, statusFilter, sortColumn, sortOrder, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const newSortOrder = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
  };

  const filterAndSortUsers = () => {
    let updatedUsers = [...users];

    if (searchTerm) {
      updatedUsers = updatedUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      updatedUsers = updatedUsers.filter((user) => user.status === statusFilter);
    }

    updatedUsers.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";

      if (sortColumn === "departments") {
        valA = a.departments.length ? a.departments[0].name : "";
        valB = b.departments.length ? b.departments[0].name : "";
      } else if (sortColumn === "roles") {
        valA = a.roles.length ? a.roles[0].name : "";
        valB = b.roles.length ? b.roles[0].name : "";
      }

      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    // 📌 Ensure "Deactivated" accounts appear last
    updatedUsers.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    setFilteredUsers(updatedUsers);
  };

  // 📌 Pagination Logic
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handleToggleStatus = (userId, currentStatus) => {
    setSelectedUser({ id: userId, status: currentStatus });
    setShowConfirmation(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;

    const newStatus = selectedUser.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";

    try {
      const response = await ApiClient.patch(`/users/${selectedUser.id}/status`, {
        status: newStatus,
      });

      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser.id ? { ...user, status: newStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    }

    setShowConfirmation(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-6">
      {/* Confirmation Popup */}
      {showConfirmation && (
        <ConfirmationPopup
          message={`Are you sure you want to ${
            selectedUser.status === "ACTIVE" ? "deactivate" : "activate"
          } this user?`}
          onConfirm={confirmToggleStatus}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link to="/users/add" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add User
        </Link>
      </div>

      {/* 🔍 Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded"
        />

        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>
      </div>

      {/* 📌 Table View (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border-b text-left" onClick={() => handleSort("name")}>Name</th>
              <th className="p-2 border-b text-left" onClick={() => handleSort("username")}>Username</th>
              <th className="p-2 border-b text-left" onClick={() => handleSort("email")}>Email</th>
              <th className="p-2 border-b text-left" onClick={() => handleSort("departments")}>Departments</th>
              <th className="p-2 border-b text-left" onClick={() => handleSort("roles")}>Roles</th>
              <th className="p-2 border-b text-left" onClick={() => handleSort("status")}>Status</th>
              <th className="p-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td className="p-2 border-b">{user.name}</td>
                <td className="p-2 border-b">{user.username}</td>
                <td className="p-2 border-b">{user.email}</td>
                <td className="p-2 border-b">{user.departments.map((d) => d.name).join(", ") || "No Departments"}</td>
                <td className="p-2 border-b">{user.roles.map((r) => r.name).join(", ") || "No Roles"}</td>
                <td className="p-2 border-b">{user.status}</td>
                <td className="p-2 border-b">
                  <Link to={`/users/edit/${user.id}`} className="text-blue-500 mr-2">Edit</Link>
                  <button
                    className={`px-3 py-1 text-white rounded ${
                      user.status === "ACTIVE" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                    }`}
                    onClick={() => handleToggleStatus(user.id, user.status)}
                  >
                    {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Card View (Mobile) */}
      <div className="block md:hidden">
        {paginatedUsers.map((user) => (
          <div key={user.id} className="bg-white shadow rounded p-4 mb-4">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Departments:</strong> {user.departments.map((d) => d.name).join(", ") || "No Departments"}</p>
            <p><strong>Roles:</strong> {user.roles.map((r) => r.name).join(", ") || "No Roles"}</p>
            <p><strong>Status:</strong> {user.status}</p>
            <div className="flex gap-2 mt-2">
              <Link to={`/users/edit/${user.id}`} className="bg-blue-500 text-white px-3 py-1 rounded">
                Edit
              </Link>
              <button
                className={`px-3 py-1 text-white rounded ${
                  user.status === "ACTIVE" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                }`}
                onClick={() => handleToggleStatus(user.id, user.status)}
              >
                {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
