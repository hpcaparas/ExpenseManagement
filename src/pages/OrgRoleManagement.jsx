import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApiClient from "../utils/ApiClient";

const OrgRoleManagement = () => {
  const [orgRoles, setOrgRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("orgRoleCode");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 10; 

  useEffect(() => {
    fetchOrgRoles();
  }, []);

  useEffect(() => {
    filterAndSortRoles();
  }, [orgRoles, searchTerm, sortColumn, sortOrder]);

  const fetchOrgRoles = async () => {
    try {
      const companyName = JSON.parse(localStorage.getItem("user")).company.name;
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      setOrgRoles(response.data);
    } catch (error) {
      console.error("Failed to fetch org roles:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const order = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(order);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const confirmed = window.confirm(`Are you sure you want to ${currentStatus === "ACTIVE" ? "deactivate" : "activate"} this role?`);
    if (!confirmed) return;

    try {
      await ApiClient.patch(`/org-roles/${id}/status`, {
        status: currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE",
        userId: localStorage.getItem("userId"),
      });
      fetchOrgRoles();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const filterAndSortRoles = () => {
    let filtered = [...orgRoles];

    if (searchTerm) {
      filtered = filtered.filter((role) =>
        role.orgRoleCode.toLowerCase().includes(searchTerm) ||
        role.orgRoleDescription?.toLowerCase().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    // Move deactivated to bottom
    filtered.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    setFilteredRoles(filtered);
  }; 

  const paginated = filteredRoles.slice((currentPage - 1) * rolesPerPage, currentPage * rolesPerPage);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Org Role Management</h1>
        <Link to="/orgRoles/addOrgRole" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Org Role
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search org roles..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("orgRoleCode")}>
                Code {sortColumn === "orgRoleCode" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("orgRoleDescription")}>
                Description {sortColumn === "orgRoleDescription" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th className="p-2 border-b text-left">Status</th>
              <th className="p-2 border-b text-left">Amount Limit</th>
              <th className="p-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((role) => (
              <tr key={role.id}>
                <td className="p-2 border-b">{role.orgRoleCode}</td>
                <td className="p-2 border-b">{role.orgRoleDescription}</td>
                <td className="p-2 border-b">{role.status}</td>
                <td className="p-2 border-b">{role.amountLimit}</td>
                <td className="p-2 border-b">
                  <Link to={`/orgRoles/editOrgRole/${role.id}`} className="text-blue-500 mr-2">Edit</Link>
                  <button
                    onClick={() => handleToggleStatus(role.id, role.status)}
                    className={`px-3 py-1 text-white rounded ${role.status === "ACTIVE" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                  >
                    {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (optional) */}
    </div>
  );
};

export default OrgRoleManagement;
