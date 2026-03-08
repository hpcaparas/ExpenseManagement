import React, { useEffect, useMemo, useState } from "react";
import {
  FiUser,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiInbox,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

const PAGE_SIZE = 8;

const ApprovalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchApprovalHistory();
  }, []);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/approval/history/${user.id}`);

      setUserRoles((user.roles || []).map((role) => role.name));
      setHistory(response.data || []);
      setCurrentPage(1);
    } catch (err) {
      setErrorMessage("Failed to fetch approval history.");
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role) => userRoles.includes(role);

  const pageTitle = hasRole("Processor")
    ? "Request History"
    : "Approval History";

  const pageSubtitle = hasRole("Processor")
    ? "Review the requests you processed previously and inspect the associated receipts."
    : "View a timeline of approvals and decisions you have previously made.";

  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED":
      case "PROCESSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "DECLINED":
        return "bg-red-50 text-red-700 border-red-200";
      case "PENDING":
      case "FOR_PROCESSING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "RETURNED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "CANCELLED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(history.length / PAGE_SIZE)),
    [history.length]
  );

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return history.slice(start, start + PAGE_SIZE);
  }, [history, currentPage]);

  const pageStart = history.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, history.length);

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Activity"
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              {history.length} records
            </div>
          }
        />

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {errorMessage}
          </div>
        )}

        <SectionCard
          title="Decision History"
          subtitle="Each row represents an application that you have reviewed."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading history...
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FiInbox className="text-2xl" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No history available
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Your completed approvals and processed requests will appear
                here.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {history.length} records
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Browse through the approvals you have completed.
                  </div>
                </div>

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </div>

              <div className="hidden xl:block">
                <div className="rounded-[24px] border border-slate-200 bg-white">
                  <table className="w-full table-fixed border-separate border-spacing-y-3">
                    <thead>
                      <tr>
                        <TableHead className="w-[16%]">Applicant</TableHead>
                        <TableHead className="w-[14%]">Department</TableHead>
                        <TableHead className="w-[14%]">Type</TableHead>
                        <TableHead className="w-[12%]">Amount</TableHead>
                        <TableHead className="w-[14%]">Action</TableHead>
                        <TableHead className="w-[18%]">Remarks</TableHead>
                        <TableHead className="w-[12%]">Receipt</TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedHistory.map((record) => (
                        <tr key={record.id}>
                          <TableCell className="rounded-l-2xl">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FiUser />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {record.applicantName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Approval #{record.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FiBriefcase className="text-slate-400" />
                              {record.department}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FiFileText className="text-slate-400" />
                              {record.type}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                              <FiDollarSign className="text-slate-400" />
                              ${record.priceWithTax?.toFixed(2)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                record.status.description
                              )}`}
                            >
                              {record.status.description}
                            </span>
                          </TableCell>

                          <TableCell className="text-sm text-slate-600">
                            {record.remarks || "No remarks"}
                          </TableCell>

                          <TableCell className="rounded-r-2xl">
                            {record.imageFilename ? (
                              <button
                                onClick={() =>
                                  setSelectedReceipt(
                                    `http://localhost:8080/uploads/${record.imageFilename}`
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                              >
                                <FiEye />
                                View
                              </button>
                            ) : (
                              <span className="text-sm text-slate-400">
                                No Image
                              </span>
                            )}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 xl:hidden">
                {paginatedHistory.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                      <div className="text-lg font-semibold text-slate-900">
                        {record.applicantName}
                      </div>

                      <div className="mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        record.status.description
                      )}">
                        {record.status.description}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoItem label="Department" value={record.department} />
                        <InfoItem label="Type" value={record.type} />
                        <InfoItem
                          label="Amount"
                          value={`$${record.priceWithTax?.toFixed(2)}`}
                        />
                        <InfoItem
                          label="Remarks"
                          value={record.remarks || "No remarks"}
                        />
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      {record.imageFilename ? (
                        <button
                          onClick={() =>
                            setSelectedReceipt(
                              `http://localhost:8080/uploads/${record.imageFilename}`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <FiEye />
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No Image
                        </span>
                      )}
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
        </SectionCard>
      </div>

      {selectedReceipt && (
        <ReceiptModal
          imageUrl={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
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
      className={`align-top border-y border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
      >
        <FiChevronLeft />
      </button>

      <span className="text-sm text-slate-600">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
      >
        <FiChevronRight />
      </button>
    </div>
  );
}

export default ApprovalHistory;
