import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApiClient from "../utils/ApiClient";

const TypeManagement = () => {
  const [types, setTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const typesPerPage = 10;

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await ApiClient.get("/types");
      setTypes(response.data);
      setFilteredTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch types:", error);
      setFilteredTypes([]);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterAndSortTypes(term, statusFilter, sortColumn, sortOrder);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    filterAndSortTypes(searchTerm, status, sortColumn, sortOrder);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const newSortOrder = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
    filterAndSortTypes(searchTerm, statusFilter, column, newSortOrder);
  };

  const filterAndSortTypes = (search, status, column, order) => {
    let updatedTypes = [...types];

    if (search) {
      updatedTypes = updatedTypes.filter((type) =>
        type.name.toLowerCase().includes(search)
      );
    }

    if (status !== "all") {
      updatedTypes = updatedTypes.filter((type) => type.status === status);
    }

    updatedTypes.sort((a, b) => {
      let valA = a[column] || "";
      let valB = b[column] || "";
      return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    updatedTypes.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    setFilteredTypes(updatedTypes);
  };

  const handleToggleStatus = async (typeId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === "ACTIVE" ? "deactivate" : "activate"} this type?`)) {
      return;
    }

    try {
      const newStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
      await ApiClient.patch(`/types/${typeId}/status`, { status: newStatus });

      setTypes((prevTypes) =>
        prevTypes.map((type) =>
          type.id === typeId ? { ...type, status: newStatus } : type
        )
      );

      setFilteredTypes((prevTypes) =>
        prevTypes.map((type) =>
          type.id === typeId ? { ...type, status: newStatus } : type
        )
      );
    } catch (error) {
      console.error("Failed to update type status:", error);
      alert("Failed to update type status.");
    }
  };

  const paginatedTypes = filteredTypes.slice(
    (currentPage - 1) * typesPerPage,
    currentPage * typesPerPage
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Type Management</h1>
        <Link to="/types/add" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Type
        </Link>
      </div>

      {/* 🔍 Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by type name..."
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

      {/* 📌 Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("glCode")}>
                GL Code ▲/▼
              </th>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("name")}>
                Type Name ▲/▼
              </th>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => handleSort("status")}>
                Status ▲/▼
              </th>
              <th className="p-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTypes.map((type) => (
              <tr key={type.id}>
                <td className="p-2 border-b">{type.glCode}</td>
                <td className="p-2 border-b">{type.name}</td>
                <td className="p-2 border-b">{type.status}</td>
                <td className="p-2 border-b">
                  <Link to={`/types/edit/${type.id}`} className="text-blue-500 mr-2">
                    Edit
                  </Link>
                  <button
                    className={`px-3 py-1 text-white rounded ${
                      type.status === "ACTIVE" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                    }`}
                    onClick={() => handleToggleStatus(type.id, type.status)}
                  >
                    {type.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📌 Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4">
        {paginatedTypes.map((type) => (
          <div key={type.id} className="bg-white p-4 rounded shadow">
            <p><strong>GL Code:</strong> {type.glCode}</p>
            <p><strong>Type Name:</strong> {type.name}</p>
            <p><strong>Status:</strong> {type.status}</p>
            <div className="mt-2 flex gap-2">
              <Link to={`/types/edit/${type.id}`} className="text-blue-500">Edit</Link>
              <button className="text-white px-3 py-1 rounded bg-red-500 hover:bg-red-600" onClick={() => handleToggleStatus(type.id, type.status)}>
                {type.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypeManagement;
