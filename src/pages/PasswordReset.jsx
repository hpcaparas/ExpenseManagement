import React, { useState, useEffect, useMemo } from "react";
import {
  FiLock,
  FiMail,
  FiSearch,
  FiUser,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import ConfirmationPopup from "../components/ConfirmationPopup";

const USERS_PER_PAGE = 10;

const PasswordReset = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      setErrorMessage("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;

    return users.filter((user) =>
      [user.name, user.username, user.email]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const pageStart =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  const handleResetClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      await ApiClient.post(`/users/${selectedUser.id}/reset-password`);
      setSuccessMessage(
        `Password has been reset and emailed to ${selectedUser.email}.`
      );
    } catch (error) {
      console.error("Failed to reset password:", error);
      setErrorMessage("Failed to reset password. Please try again.");
    } finally {
      setIsModalOpen(false);
      setSelectedUser(null);
    }
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Password Reset"
          subtitle="Reset user passwords securely and notify the affected user by email."
          actions={
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <FiLock />
              {users.length} user{users.length === 1 ? "" : "s"}
            </div>
          }
        />

        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="flex items-start gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            <FiCheckCircle className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : null}

        <SectionCard
          title="User Password Management"
          subtitle="Search users and trigger a password reset when account recovery or admin intervention is needed."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading users...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve your user directory.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="relative w-full">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by fullname, username, or email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {filteredUsers.length} user
                    {filteredUsers.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    From {users.length} total account{users.length === 1 ? "" : "s"}.
                  </div>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <FiLock className="text-2xl" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    No users found
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Try adjusting your search to find the user whose password you want to reset.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden xl:block">
                    <div className="rounded-[24px] border border-slate-200 bg-white">
                      <table className="w-full table-fixed border-separate border-spacing-y-3">
                        <thead>
                          <tr>
                            <TableHead className="w-[30%]">Full Name</TableHead>
                            <TableHead className="w-[22%]">Username</TableHead>
                            <TableHead className="w-[28%]">Email</TableHead>
                            <TableHead className="w-[20%]">Action</TableHead>
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

                              <TableCell className="rounded-r-2xl">
                                <button
                                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
                                  onClick={() => handleResetClick(user)}
                                >
                                  <FiRefreshCw />
                                  Reset Password
                                </button>
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
                          <div className="text-sm text-slate-500">User</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {user.name}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <InfoItem label="Username" value={user.username} />
                            <InfoItem label="Email" value={user.email} />
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          <button
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
                            onClick={() => handleResetClick(user)}
                          >
                            <FiRefreshCw />
                            Reset Password
                          </button>
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

      {isModalOpen && (
        <ConfirmationPopup
          message={`Are you sure you want to reset the password for ${selectedUser?.name}?`}
          onConfirm={confirmResetPassword}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

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

export default PasswordReset;
