import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiClock,
  FiInbox,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";
import ReceiptModal from "../components/ReceiptModal";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import config from "../config/config";

const PAGE_SIZE = 8;

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmApprove, setConfirmApprove] = useState({
    show: false,
    approvalId: null,
  });

  const [confirmDecline, setConfirmDecline] = useState({
    show: false,
    approvalId: null,
    reason: "",
  });

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/approval/pending/${user.id}`);

      setUserRoles((user.roles || []).map((role) => role.name));
      setApprovals(response.data || []);
      setCurrentPage(1);
    } catch (err) {
      setErrorMessage("Failed to fetch pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role) => userRoles.includes(role);

  const pageTitle = hasRole("Processor") ? "Requests" : "Pending Approvals";
  const pageSubtitle = hasRole("Processor")
    ? "Review requests assigned to you, inspect receipts, and complete processing decisions with confidence."
    : "Review applications waiting for your decision, inspect receipts, and approve or decline with full context.";

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(approvals.length / PAGE_SIZE)),
    [approvals.length]
  );

  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return approvals.slice(start, start + PAGE_SIZE);
  }, [approvals, currentPage]);

  const pageStart = approvals.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, approvals.length);

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApprove = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      await ApiClient.post("/approval/approve", {
        approvalId: confirmApprove.approvalId,
        userId: user.id,
        remarks: "Approved by user",
      });

      setSuccessMessage("Visa application approved successfully.");
      setConfirmApprove({ show: false, approvalId: null });
      fetchPendingApprovals();
    } catch (err) {
      setErrorMessage("Failed to approve visa application.");
    }
  };

  const handleDecline = async () => {
    if (!confirmDecline.reason.trim()) {
      setErrorMessage("Please enter a reason for declining.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      await ApiClient.post("/approval/decline", {
        approvalId: confirmDecline.approvalId,
        userId: user.id,
        remarks: confirmDecline.reason,
      });

      setSuccessMessage("Visa application declined successfully.");
      setConfirmDecline({ show: false, approvalId: null, reason: "" });
      fetchPendingApprovals();
    } catch (err) {
      setErrorMessage("Failed to decline approval.");
    }
  };

  const openReceipt = (filename) => {
    setSelectedReceipt(`${config.baseUrl}uploads/${filename}`);
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow={hasRole("Processor") ? "Processing Queue" : "Approval Queue"}
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              {approvals.length} item{approvals.length === 1 ? "" : "s"}
            </div>
          }
        />

        {errorMessage && (
          <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />
        )}

        {successMessage && (
          <ConfirmationPopup
            message={successMessage}
            onConfirm={() => setSuccessMessage("")}
            onCancel={() => setSuccessMessage("")}
          />
        )}

        <SectionCard
          title={hasRole("Processor") ? "Assigned Requests" : "Approval List"}
          subtitle="Review the applicant details, open the receipt, and complete the next action."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading your queue...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve your pending items.
              </p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FiInbox className="text-2xl" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No pending items
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                You currently have no approvals waiting in your queue.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {approvals.length} item
                    {approvals.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Review the request details carefully before taking action.
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
                        <TableHead className="w-[20%]">Remarks</TableHead>
                        <TableHead className="w-[10%]">Receipt</TableHead>
                        <TableHead className="w-[14%]">Actions</TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedApprovals.map((approval) => (
                        <tr key={approval.id} className="align-top">
                          <TableCell className="rounded-l-2xl">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FiUser />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {approval.applicantName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Approval ID #{approval.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2">
                              <FiBriefcase className="mt-0.5 shrink-0 text-slate-400" />
                              <span>{approval.department}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2">
                              <FiFileText className="mt-0.5 shrink-0 text-slate-400" />
                              <span>{approval.type}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2 font-semibold text-slate-900">
                              <FiDollarSign className="mt-0.5 shrink-0 text-slate-400" />
                              <span>${approval.priceWithTax?.toFixed(2)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="line-clamp-3 text-sm text-slate-600">
                              {approval.remarks || "No remarks"}
                            </div>
                          </TableCell>

                          <TableCell>
                            {approval.imageFilename ? (
                              <ActionButton
                                icon={<FiEye />}
                                label="View"
                                onClick={() => openReceipt(approval.imageFilename)}
                              />
                            ) : (
                              <MutedText>No Image</MutedText>
                            )}
                          </TableCell>

                          <TableCell className="rounded-r-2xl">
                            <div className="flex flex-wrap gap-2">
                              <ActionButton
                                icon={<FiCheckCircle />}
                                label="Approve"
                                onClick={() =>
                                  setConfirmApprove({
                                    show: true,
                                    approvalId: approval.id,
                                  })
                                }
                                variant="success"
                              />
                              <ActionButton
                                icon={<FiXCircle />}
                                label="Decline"
                                onClick={() =>
                                  setConfirmDecline({
                                    show: true,
                                    approvalId: approval.id,
                                    reason: "",
                                  })
                                }
                                variant="danger"
                              />
                            </div>
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 xl:hidden">
                {paginatedApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-slate-500">Applicant</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {approval.applicantName}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Approval ID #{approval.id}
                          </div>
                        </div>

                        <QueueBadge label={hasRole("Processor") ? "In Queue" : "Pending"} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoItem label="Department" value={approval.department} />
                        <InfoItem label="Type" value={approval.type} />
                        <InfoItem
                          label="Price (With Tax)"
                          value={`$${approval.priceWithTax?.toFixed(2)}`}
                        />
                        <InfoItem
                          label="Remarks"
                          value={approval.remarks || "No remarks"}
                        />
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {approval.imageFilename ? (
                          <ActionButton
                            icon={<FiEye />}
                            label="View Receipt"
                            onClick={() => openReceipt(approval.imageFilename)}
                          />
                        ) : (
                          <MutedText>No Image</MutedText>
                        )}

                        <ActionButton
                          icon={<FiCheckCircle />}
                          label="Approve"
                          onClick={() =>
                            setConfirmApprove({
                              show: true,
                              approvalId: approval.id,
                            })
                          }
                          variant="success"
                        />

                        <ActionButton
                          icon={<FiXCircle />}
                          label="Decline"
                          onClick={() =>
                            setConfirmDecline({
                              show: true,
                              approvalId: approval.id,
                              reason: "",
                            })
                          }
                          variant="danger"
                        />
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
        </SectionCard>
      </div>

      {confirmApprove.show && (
        <PremiumDecisionModal
          title="Confirm Approval"
          description="Approve this application and move it to the next step in the workflow."
          confirmLabel="Approve Request"
          confirmVariant="success"
          onClose={() => setConfirmApprove({ show: false, approvalId: null })}
          onConfirm={handleApprove}
        />
      )}

      {confirmDecline.show && (
        <PremiumDecisionModal
          title="Confirm Decline"
          description="Provide a short reason before declining this application."
          confirmLabel="Decline Request"
          confirmVariant="danger"
          onClose={() =>
            setConfirmDecline({ show: false, approvalId: null, reason: "" })
          }
          onConfirm={handleDecline}
        >
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Decline Reason
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Enter reason for declining..."
              rows={4}
              value={confirmDecline.reason}
              onChange={(e) =>
                setConfirmDecline({
                  ...confirmDecline,
                  reason: e.target.value,
                })
              }
            />
          </div>
        </PremiumDecisionModal>
      )}

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

function MutedText({ children }) {
  return <span className="text-sm text-slate-400">{children}</span>;
}

function QueueBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <FiClock />
      {label}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = "default",
}) {
  const variantClasses = {
    default: disabled
      ? "border-slate-200 bg-slate-100 text-slate-400"
      : "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100",
    success: disabled
      ? "border-slate-200 bg-slate-100 text-slate-400"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
    danger: disabled
      ? "border-slate-200 bg-slate-100 text-slate-400"
      : "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
    secondary: disabled
      ? "border-slate-200 bg-slate-100 text-slate-400"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${variantClasses[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function PremiumDecisionModal({
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  onClose,
  onConfirm,
  children,
}) {
  const confirmClasses = {
    default:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)]",
    success:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_18px_40px_rgba(5,150,105,0.28)]",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_18px_40px_rgba(220,38,38,0.28)]",
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <FiAlertCircle className="text-xl" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {children}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={`rounded-2xl px-4 py-2.5 font-medium ${confirmClasses[confirmVariant]}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
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

      {pages.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm font-medium text-slate-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${
              currentPage === page
                ? "border-blue-600 bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.24)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {page}
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

export default PendingApprovals;
