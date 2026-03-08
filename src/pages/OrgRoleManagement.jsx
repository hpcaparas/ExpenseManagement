import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiEdit2, FiPower } from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

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
    const confirmed = window.confirm(
      `Are you sure you want to ${currentStatus === "ACTIVE" ? "deactivate" : "activate"} this role?`
    );
    if (!confirmed) return;

    try {
      await ApiClient.patch(`/org-roles/${id}/status`, {
        status: currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE",
      });
      fetchOrgRoles();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const filterAndSortRoles = () => {
    let filtered = [...orgRoles];

    if (searchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.orgRoleCode.toLowerCase().includes(searchTerm) ||
          role.orgRoleDescription?.toLowerCase().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    filtered.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    setFilteredRoles(filtered);
  };

  const paginated = filteredRoles.slice(
    (currentPage - 1) * rolesPerPage,
    currentPage * rolesPerPage
  );

  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);

  const statusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            ACTIVE
          </span>
        );
      case "DEACTIVATED":
        return (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            DEACTIVATED
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

      <PageHeader
        eyebrow="Administration"
        title="Org Role Management"
        subtitle="Manage organizational roles and approval limits."
      />

      <SectionCard title="Org Roles">

        <div className="mb-6 flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search org roles..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() => handleSort("orgRoleCode")}
                >
                  Code
                </th>
                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() => handleSort("orgRoleDescription")}
                >
                  Description
                </th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Amount Limit</th>
                <th className="p-3 text-left">Default Approver</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>

              {paginated.map((role) => (
                <tr key={role.id} className="border-b border-slate-100">

                  <td className="p-3 font-medium text-slate-800">
                    {role.orgRoleCode}
                  </td>

                  <td className="p-3 text-slate-600">
                    {role.orgRoleDescription}
                  </td>

                  <td className="p-3">
                    {statusBadge(role.status)}
                  </td>

                  <td className="p-3 text-slate-700">
                    {role.amountLimit}
                  </td>

                  <td className="p-3 text-slate-600">
                    {role.isDefault ? "Yes" : "No"}
                  </td>

                  <td className="p-3 flex gap-3">

                    <Link
                      to={`/orgRoles/editOrgRole/${role.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </Link>

                    <button
                      onClick={() => handleToggleStatus(role.id, role.status)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <FiPower size={14} />
                      {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        <div className="block md:hidden space-y-4">

          {paginated.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >

              <p className="text-sm font-semibold text-slate-800">
                {role.orgRoleCode}
              </p>

              <p className="text-sm text-slate-500">
                {role.orgRoleDescription}
              </p>

              <div className="mt-2">{statusBadge(role.status)}</div>

              <p className="mt-2 text-sm text-slate-600">
                Amount Limit: {role.amountLimit}
              </p>

              <div className="mt-3 flex gap-4">

                <Link
                  to={`/orgRoles/editOrgRole/${role.id}`}
                  className="text-blue-600 text-sm"
                >
                  Edit
                </Link>

                <button
                  onClick={() => handleToggleStatus(role.id, role.status)}
                  className="text-red-600 text-sm"
                >
                  {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>

              </div>

            </div>
          ))}

        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>

          </div>
        )}

      </SectionCard>

    </div>
  );
};

export default OrgRoleManagement;
