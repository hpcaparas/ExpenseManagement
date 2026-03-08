import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiBriefcase,
  FiHash,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

const DEPARTMENTS_PER_PAGE = 10;

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterAndSortDepartments();
  }, [searchTerm, sortColumn, sortOrder, departments]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await ApiClient.get("/departments");
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
      setErrorMessage("Failed to fetch departments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const newSortOrder =
      sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
  };

  const filterAndSortDepartments = () => {
    let updatedDepartments = [...departments];

    if (searchTerm) {
      updatedDepartments = updatedDepartments.filter((department) =>
        String(department.name || "").toLowerCase().includes(searchTerm)
      );
    }

    updatedDepartments.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    updatedDepartments.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    setFilteredDepartments(updatedDepartments);
  };

  const handleToggleStatus = async (departmentId, currentStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          currentStatus === "ACTIVE" ? "deactivate" : "activate"
        } this department?`
      )
    ) {
      return;
    }

    try {
      const newStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";

      await ApiClient.patch(`/departments/${departmentId}/status`, {
        status: newStatus,
        userId: localStorage.getItem("userId"),
      });

      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === departmentId ? { ...dept, status: newStatus } : dept
        )
      );
    } catch (error) {
      console.error("Failed to update department status:", error);
      setErrorMessage("Failed to update department status.");
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredDepartments.length / DEPARTMENTS_PER_PAGE)),
    [filteredDepartments.length]
  );

  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * DEPARTMENTS_PER_PAGE,
    currentPage * DEPARTMENTS_PER_PAGE
  );

  const pageStart =
    filteredDepartments.length === 0
      ? 0
      : (currentPage - 1) * DEPARTMENTS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * DEPARTMENTS_PER_PAGE,
    filteredDepartments.length
  );

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Department Management"
          subtitle="Manage department records, GL codes, and account status across the organization."
          actions={
            <Link
              to="/departments/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(37,99,235,0.32)]"
            >
              <FiPlus />
              Add Department
            </Link>
          }
        />

        {errorMessage ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <SectionCard
          title="Department Directory"
          subtitle="Search, sort, and maintain departments used throughout the approval workflow."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading departments...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve department records.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="relative w-full">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {filteredDepartments.length} department
                    {filteredDepartments.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    From {departments.length} total record
                    {departments.length === 1 ? "" : "s"}.
                  </div>
                </div>
              </div>

              {filteredDepartments.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FiBriefcase className="text-2xl" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    No departments found
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Try adjusting your search to see matching departments.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden xl:block">
                    <div className="rounded-[24px] border border-slate-200 bg-white">
                      <table className="w-full table-fixed border-separate border-spacing-y-3">
                        <thead>
                          <tr>
                            <SortableHead
                              className="w-[34%]"
                              label="Name"
                              sortKey="name"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[22%]"
                              label="GL Code"
                              sortKey="glCode"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <TableHead className="w-[18%]">Status</TableHead>
                            <TableHead className="w-[26%]">Actions</TableHead>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedDepartments.map((department) => (
                            <tr key={department.id} className="align-top">
                              <TableCell className="rounded-l-2xl">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <FiBriefcase />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      {department.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Department ID #{department.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2 font-medium text-slate-800">
                                  <FiHash className="shrink-0 text-slate-400" />
                                  <span>{department.glCode || "N/A"}</span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <StatusBadge status={department.status} />
                              </TableCell>

                              <TableCell className="rounded-r-2xl">
                                <div className="flex flex-wrap gap-2">
                                  <Link
                                    to={`/departments/edit/${department.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                                  >
                                    <FiEdit3 />
                                    Edit
                                  </Link>

                                  <button
                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                      department.status === "ACTIVE"
                                        ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                                    }`}
                                    onClick={() =>
                                      handleToggleStatus(department.id, department.status)
                                    }
                                  >
                                    {department.status === "ACTIVE" ? (
                                      <>
                                        <FiXCircle />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <FiCheckCircle />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4 xl:hidden">
                    {paginatedDepartments.map((department) => (
                      <div
                        key={department.id}
                        className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                      >
                        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-slate-500">Department</div>
                              <div className="text-lg font-semibold text-slate-900">
                                {department.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                GL Code: {department.glCode || "N/A"}
                              </div>
                            </div>

                            <StatusBadge status={department.status} />
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/departments/edit/${department.id}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                            >
                              <FiEdit3 />
                              Edit
                            </Link>

                            <button
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                department.status === "ACTIVE"
                                  ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                              }`}
                              onClick={() =>
                                handleToggleStatus(department.id, department.status)
                              }
                            >
                              {department.status === "ACTIVE" ? (
                                <>
                                  <FiXCircle />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <FiCheckCircle />
                                  Activate
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                      Page {currentPage} of {totalPages}
                    </div>

                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

function SortableHead({
  label,
  sortKey,
  sortColumn,
  sortOrder,
  onSort,
  className = "",
}) {
  const active = sortColumn === sortKey;

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-2 transition hover:text-slate-700"
      >
        {label}
        <span className={`text-[10px] ${active ? "text-blue-600" : "text-slate-300"}`}>
          {active ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function TableHead({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({ children, className = "" }) {
  return (
    <td
      className={`align-top break-words border-y border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {isActive ? <FiCheckCircle /> : <FiClock />}
      {status || "N/A"}
    </span>
  );
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiChevronLeft />
        Prev
      </button>

      {pages.map((p, index) =>
        p === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm font-medium text-slate-400"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${
              currentPage === p
                ? "border-blue-600 bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.24)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <FiChevronRight />
      </button>
    </div>
  );
}

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default DepartmentManagement;
