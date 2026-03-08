import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiUser,
  FiMail,
  FiShield,
  FiBriefcase,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiUserCheck,
  FiClock,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

const USERS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const user = JSON.parse(localStorage.getItem("user"));
      const companyId = user?.company?.id;

      const response = await ApiClient.get(`/users?companyId=${companyId}`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
      setErrorMessage("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const newSortOrder =
      sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    let updatedUsers = [...users];

    if (searchTerm) {
      updatedUsers = updatedUsers.filter(
        (user) =>
          String(user.name || "").toLowerCase().includes(searchTerm) ||
          String(user.username || "").toLowerCase().includes(searchTerm) ||
          String(user.email || "").toLowerCase().includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      updatedUsers = updatedUsers.filter((user) => user.status === statusFilter);
    }

    updatedUsers.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";

      if (sortColumn === "departments") {
        valA = a.departments?.length ? a.departments.map((d) => d.name).join(", ") : "";
        valB = b.departments?.length ? b.departments.map((d) => d.name).join(", ") : "";
      } else if (sortColumn === "roles") {
        valA = a.roles?.length ? a.roles.map((r) => r.name).join(", ") : "";
        valB = b.roles?.length ? b.roles.map((r) => r.name).join(", ") : "";
      } else if (sortColumn === "orgRoles") {
        valA = a.orgRoles?.length
          ? a.orgRoles.map((r) => r.orgRoleCode || r.name).join(", ")
          : "";
        valB = b.orgRoles?.length
          ? b.orgRoles.map((r) => r.orgRoleCode || r.name).join(", ")
          : "";
      }

      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    updatedUsers.sort((a, b) => {
      if (a.status === "DEACTIVATED" && b.status !== "DEACTIVATED") return 1;
      if (a.status !== "DEACTIVATED" && b.status === "DEACTIVATED") return -1;
      return 0;
    });

    return updatedUsers;
  }, [users, searchTerm, statusFilter, sortColumn, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );
  const pageStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStatus = (userId, currentStatus) => {
    setSelectedUser({ id: userId, status: currentStatus });
    setShowConfirmation(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;

    const newStatus =
      selectedUser.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";

    try {
      const response = await ApiClient.patch(
        `/users/${selectedUser.id}/status`,
        {
          status: newStatus,
        }
      );

      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUser.id ? { ...user, status: newStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      setErrorMessage("Failed to update user status.");
    }

    setShowConfirmation(false);
    setSelectedUser(null);
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
      {showConfirmation && selectedUser && (
        <ConfirmationPopup
          message={`Are you sure you want to ${
            selectedUser.status === "ACTIVE" ? "deactivate" : "activate"
          } this user?`}
          onConfirm={confirmToggleStatus}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="User Management"
          subtitle="Search, review, edit, and manage user access across your company."
          actions={
            <Link
              to="/users/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(37,99,235,0.32)]"
            >
              <FiPlus />
              Add User
            </Link>
          }
        />

        {errorMessage ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <SectionCard
          title="User Directory"
          subtitle="Review company users, assigned permissions, organization roles, and account status."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading users...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve user accounts.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                <div className="relative w-full">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, or email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {filteredUsers.length} user
                    {filteredUsers.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Filtered from {users.length} total account
                    {users.length === 1 ? "" : "s"}.
                  </div>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FiUsers className="text-2xl" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    No users found
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Try adjusting your search or status filter to see matching users.
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
                              className="w-[14%]"
                              label="Name"
                              sortKey="name"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[10%]"
                              label="Username"
                              sortKey="username"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[14%]"
                              label="Email"
                              sortKey="email"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[16%]"
                              label="Departments"
                              sortKey="departments"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[10%]"
                              label="Permission"
                              sortKey="roles"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[10%]"
                              label="Org Roles"
                              sortKey="orgRoles"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHead
                              className="w-[8%]"
                              label="Status"
                              sortKey="status"
                              sortColumn={sortColumn}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <TableHead className="w-[18%]">Actions</TableHead>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedUsers.map((user) => (
                            <tr key={user.id} className="align-top">
                              <TableCell className="rounded-l-2xl">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <FiUser />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      {user.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      User ID #{user.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="font-medium text-slate-800">
                                  {user.username}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-start gap-2">
                                  <FiMail className="mt-0.5 shrink-0 text-slate-400" />
                                  <span className="break-words">{user.email}</span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-start gap-2">
                                  <FiBriefcase className="mt-0.5 shrink-0 text-slate-400" />
                                  <span>
                                    {user.departments?.map((d) => d.name).join(", ") ||
                                      "No Departments"}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-start gap-2">
                                  <FiShield className="mt-0.5 shrink-0 text-slate-400" />
                                  <span>
                                    {user.roles?.map((r) => r.name).join(", ") ||
                                      "No Roles"}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-start gap-2">
                                  <FiUserCheck className="mt-0.5 shrink-0 text-slate-400" />
                                  <span>
                                    {user.orgRoles
                                      ?.map((r) => r.orgRoleCode || r.name)
                                      .join(", ") || "No Org Roles"}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <StatusBadge status={user.status} />
                              </TableCell>

                              <TableCell className="rounded-r-2xl">
                                <div className="mt-3 flex gap-4">
                                  <Link
                                    to={`/users/edit/${user.id}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                                  >
                                    Edit
                                  </Link>

                                  <button
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                      user.status === "ACTIVE"
                                        ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                                    }`}
                                    onClick={() =>
                                      handleToggleStatus(user.id, user.status)
                                    }
                                  >
                                    {user.status === "ACTIVE" ? (
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
                    {paginatedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                      >
                        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm text-slate-500">User</div>
                              <div className="text-lg font-semibold text-slate-900">
                                {user.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {user.username}
                              </div>
                            </div>

                            <StatusBadge status={user.status} />
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <InfoItem label="Email" value={user.email} />
                            <InfoItem
                              label="Departments"
                              value={
                                user.departments?.map((d) => d.name).join(", ") ||
                                "No Departments"
                              }
                            />
                            <InfoItem
                              label="Roles"
                              value={
                                user.roles?.map((r) => r.name).join(", ") ||
                                "No Roles"
                              }
                            />
                            <InfoItem
                              label="Org Roles"
                              value={
                                user.orgRoles
                                  ?.map((r) => r.orgRoleCode || r.name)
                                  .join(", ") || "No Org Roles"
                              }
                            />
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/users/edit/${user.id}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                            >
                              <FiEdit3 />
                              Edit
                            </Link>

                            <button
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                user.status === "ACTIVE"
                                  ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                              }`}
                              onClick={() =>
                                handleToggleStatus(user.id, user.status)
                              }
                            >
                              {user.status === "ACTIVE" ? (
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

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
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

export default UserManagement;
