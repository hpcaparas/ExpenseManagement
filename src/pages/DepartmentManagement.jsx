import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApiClient from "../utils/ApiClient";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const departmentsPerPage = 10;

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterAndSortDepartments();
  }, [searchTerm, sortColumn, sortOrder, departments]);

  const fetchDepartments = async () => {
    try {
      const response = await ApiClient.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const newSortOrder = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
  };

  const filterAndSortDepartments = () => {
    let updatedDepartments = [...departments];

    if (searchTerm) {
      updatedDepartments = updatedDepartments.filter((department) =>
        department.name.toLowerCase().includes(searchTerm)
      );
    }

    updatedDepartments.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    updatedDepartments.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    setFilteredDepartments(updatedDepartments);
  };

  const handleToggleStatus = async (departmentId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === "ACTIVE" ? "deactivate" : "activate"} this department?`)) {
      return;
    }

    try {
      const newStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
      await ApiClient.patch(`/departments/${departmentId}/status`, {
        status: newStatus,
        userId: localStorage.getItem("userId"),
      });

      setDepartments((prev) =>
        prev.map((dept) => (dept.id === departmentId ? { ...dept, status: newStatus } : dept))
      );
    } catch (error) {
      console.error("Failed to update department status:", error);
      alert("Failed to update department status.");
    }
  };

  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * departmentsPerPage, 
    currentPage * departmentsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Department Management</h1>
        <Link to="/departments/add" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Department
        </Link>
      </div>

      {/* 🔍 Search */}
      <input
        type="text"
        placeholder="Search departments..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      {/* 🖥️ Table View (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("name")}>
                Name {sortColumn === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("glCode")}>
                GL Code {sortColumn === "glCode" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th className="p-2 border-b text-left">Status</th>
              <th className="p-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDepartments.map((department) => (
              <tr key={department.id}>
                <td className="p-2 border-b">{department.name}</td>
                <td className="p-2 border-b">{department.glCode}</td>
                <td className="p-2 border-b">{department.status}</td>
                <td className="p-2 border-b">
                  <Link to={`/departments/edit/${department.id}`} className="text-blue-500 mr-2">
                    Edit
                  </Link>
                  <button
                    className={`px-3 py-1 text-white rounded ${
                      department.status === "ACTIVE" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                    }`}
                    onClick={() => handleToggleStatus(department.id, department.status)}
                  >
                    {department.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile View (Card Layout) */}
      <div className="block md:hidden">
        {paginatedDepartments.map((department) => (
          <div key={department.id} className="bg-white shadow rounded p-4 mb-4">
            <p><strong>Name:</strong> {department.name}</p>
            <p><strong>GL Code:</strong> {department.glCode}</p>
            <p><strong>Status:</strong> {department.status}</p>
            <div className="flex gap-2 mt-2">
              <Link to={`/departments/edit/${department.id}`} className="bg-blue-500 text-white px-3 py-1 rounded">
                Edit
              </Link>
              <button
                className={`px-3 py-1 text-white rounded ${
                  department.status === "ACTIVE" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                }`}
                onClick={() => handleToggleStatus(department.id, department.status)}
              >
                {department.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentManagement;
