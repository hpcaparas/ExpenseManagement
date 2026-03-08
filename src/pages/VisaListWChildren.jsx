import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiEye,
  FiXCircle,
  FiRotateCcw,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal";
import ConfirmationPopup from "../components/ConfirmationPopup";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import VisaDetailsModal from "./VisaDetailsModal";
import config from "../config/config";

const PAGE_SIZE = 8;

const VisaListWChildren = () => {
  const navigate = useNavigate();

  const [groupedApplications, setGroupedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedVisaToCancel, setSelectedVisaToCancel] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selectedVisaDetails, setSelectedVisaDetails] = useState(null);
  const [expandedCards, setExpandedCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVisaApplications();
  }, []);

  const fetchVisaApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/visa/user/${user.id}`);
      const apps = response.data || [];

      const grouped = apps.reduce((acc, app) => {
        const parentId = app.parentApplicationId || app.id;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(app);
        return acc;
      }, {});

      const sortedGroups = Object.values(grouped)
        .map((group) =>
          group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        )
        .sort(
          (a, b) =>
            new Date(b[0]?.createdAt || 0) - new Date(a[0]?.createdAt || 0)
        );

      setGroupedApplications(sortedGroups);

      const expandedParentIds = sortedGroups
        .filter((group) => group.length > 1)
        .map((group) => group[0].id);

      setExpanded(expandedParentIds);
      setCurrentPage(1);
    } catch (err) {
      setError("Failed to fetch Expense applications.");
    } finally {
      setLoading(false);
    }
  };

  const totalApplications = useMemo(
    () => groupedApplications.reduce((sum, group) => sum + group.length, 0),
    [groupedApplications]
  );

  const totalGroups = groupedApplications.length;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalGroups / PAGE_SIZE)),
    [totalGroups]
  );

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return groupedApplications.slice(start, start + PAGE_SIZE);
  }, [groupedApplications, currentPage]);

  const pageStart = totalGroups === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalGroups);

  const toggleExpand = (id) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleCardExpand = (id) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatApprovedBy = (approvals) => {
    if (!approvals || approvals.length === 0) return "N/A";

    const approved = approvals.filter((a) => a.status?.code === "APPROVED");
    if (approved.length === 0) return "N/A";

    return approved
      .map((a) => a.approverName || a.approverRoleName)
      .filter(Boolean)
      .join(", ");
  };

  const getCurrentApprover = (approvals) => {
    if (!approvals || approvals.length === 0) return "N/A";

    const pending = approvals.find((a) => a.status?.code === "PENDING");
    return pending?.approverName || pending?.approverRoleName || "N/A";
  };

  const getAllApprovers = (visa) => {
    if (!visa?.approvals || visa.approvals.length === 0) return "N/A";

    const names = visa.approvals
      .map((a) => a.approverName || a.approverRoleName)
      .filter(Boolean);

    return names.join(", ");
  };

  const getDeclineRemarksWithApprover = (approvals) => {
    const declined = approvals?.find((a) => a.status?.code === "DECLINED");
    if (!declined) return "N/A";

    const name = declined.approverName || declined.approverRoleName || "Unknown";
    return `${name} - ${declined.remarks || "No remarks"}`;
  };

  const handleCancelClick = (visa) => {
    setSelectedVisaToCancel(visa);
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!selectedVisaToCancel) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await ApiClient.post(
        `/approval/cancel/${selectedVisaToCancel.id}?userId=${user.id}`
      );

      setShowCancelConfirm(false);
      setSelectedVisaToCancel(null);
      fetchVisaApplications();
    } catch (err) {
      setError("Failed to cancel application.");
    }
  };

  const openVisaDetails = (visa) => {
    setSelectedVisaDetails({
      ...visa,
      currentApprover: getCurrentApprover(visa.approvals),
      approvedBy: formatApprovedBy(visa.approvals),
      allApprovers: getAllApprovers(visa),
      declineRemarks: getDeclineRemarksWithApprover(visa.approvals),
    });
  };

  const canResubmit = (statusCode) =>
    ["DECLINED", "RETURNED_BY_FINANCE", "CANCELLED"].includes(statusCode);

  const canCancel = (statusCode) =>
    ["PENDING", "FOR_PROCESSING"].includes(statusCode);

  const getReceiptUrl = (filename) => `${config.baseUrl}uploads/${filename}`;

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Expense Tracking"
          title="My Expense Applications"
          subtitle="Review your submitted requests, view resubmissions, track approval progress, and manage pending applications."
          actions={
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              {totalApplications} application{totalApplications === 1 ? "" : "s"}
            </div>
          }
        />

        {error ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <SectionCard
          title="Application History"
          subtitle="Parent rows show the latest record in a request chain. Expand them to reveal previous submissions and resubmissions."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading your applications...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve your expense history.
              </p>
            </div>
          ) : groupedApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FiFileText className="text-2xl" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No applications found
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                You have not submitted any expense applications yet. Once you
                create one, it will appear here together with any resubmissions.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {totalGroups} request chain
                    {totalGroups === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Each row can contain the latest submission plus its related
                    resubmissions.
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
                        <TableHead className="w-[9%]">#</TableHead>
                        <TableHead className="w-[16%]">Department</TableHead>
                        <TableHead className="w-[14%]">Created At</TableHead>
                        <TableHead className="w-[10%]">Purchase Info</TableHead>
                        <TableHead className="w-[10%]">Amount</TableHead>
                        <TableHead className="w-[13%]">Status</TableHead>
                        <TableHead className="w-[28%]">Actions</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedGroups.flatMap((group) => {
                        const parent = group[0];
                        const children = group.slice(1);
                        const isExpanded = expanded.includes(parent.id);
                        const rows = [];

                        rows.push(
                          <tr key={`parent-${parent.id}`} className="align-top">
                            <TableCell className="rounded-l-2xl">
                              <button
                                onClick={() => toggleExpand(parent.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                #{parent.id}
                              </button>
                            </TableCell>

                            <TableCell>
                              <div className="break-words font-medium text-slate-800">
                                {parent.department?.name || "N/A"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm text-slate-700 break-words">
                                {new Date(parent.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(parent.createdAt).toLocaleTimeString()}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm font-medium text-slate-800">
                                {parent.type?.name || "N/A"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {parent.purchaseMethod?.description || "N/A"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-semibold text-slate-800">
                                ${parent.priceWithTax?.toFixed(2) || "0.00"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <StatusBadge
                                status={parent.statusCode}
                                label={parent.statusLabel}
                              />
                            </TableCell>

                            <TableCell className="rounded-r-2xl">
                              <div className="flex flex-wrap gap-2">
                                {parent.imageFilename ? (
                                  <ActionButton
                                    icon={<FiEye />}
                                    label="Receipt"
                                    onClick={() =>
                                      setSelectedReceipt(getReceiptUrl(parent.imageFilename))
                                    }
                                  />
                                ) : (
                                  <MutedText>No Image</MutedText>
                                )}

                                <ActionButton
                                  icon={<FiFileText />}
                                  label="Details"
                                  onClick={() => openVisaDetails(parent)}
                                  variant="secondary"
                                />

                                <ActionButton
                                  icon={<FiRotateCcw />}
                                  label="Resubmit"
                                  onClick={() => navigate(`/visa/edit/${parent.id}`)}
                                  disabled={!canResubmit(parent.statusCode)}
                                />

                                <ActionButton
                                  icon={<FiXCircle />}
                                  label="Cancel"
                                  onClick={() => handleCancelClick(parent)}
                                  variant="danger"
                                  disabled={!canCancel(parent.statusCode)}
                                />
                              </div>
                            </TableCell>
                          </tr>
                        );

                        if (isExpanded) {
                          children.forEach((child) => {
                            rows.push(
                              <tr key={`child-${child.id}`} className="align-top">
                                <TableCell className="rounded-l-2xl bg-slate-50">
                                  <div className="flex items-center gap-2 pl-3 text-sm font-medium text-slate-600">
                                    <FiLayers className="shrink-0 text-slate-400" />
                                    <span className="truncate">↳ #{child.id}</span>
                                  </div>
                                </TableCell>

                                <TableCell className="bg-slate-50">
                                  <div className="break-words font-medium text-slate-800">
                                    {child.department?.name || "N/A"}
                                  </div>
                                </TableCell>

                                <TableCell className="bg-slate-50">
                                  <div className="text-sm text-slate-700">
                                    {new Date(child.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {new Date(child.createdAt).toLocaleTimeString()}
                                  </div>
                                </TableCell>

                                <TableCell className="bg-slate-50">
                                  <div className="text-sm font-medium text-slate-800">
                                    {child.type?.name || "N/A"}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {child.purchaseMethod?.description || "N/A"}
                                  </div>
                                </TableCell>

                                <TableCell className="bg-slate-50">
                                  <div className="font-semibold text-slate-800">
                                    ${child.priceWithTax?.toFixed(2) || "0.00"}
                                  </div>
                                </TableCell>

                                <TableCell className="bg-slate-50">
                                  <StatusBadge
                                    status={child.statusCode}
                                    label={child.statusLabel}
                                  />
                                </TableCell>

                                <TableCell className="rounded-r-2xl bg-slate-50">
                                  <div className="flex flex-wrap gap-2">
                                    {child.imageFilename ? (
                                      <ActionButton
                                        icon={<FiEye />}
                                        label="Receipt"
                                        onClick={() =>
                                          setSelectedReceipt(getReceiptUrl(child.imageFilename))
                                        }
                                      />
                                    ) : (
                                      <MutedText>No Image</MutedText>
                                    )}

                                    <ActionButton
                                      icon={<FiFileText />}
                                      label="Details"
                                      onClick={() => openVisaDetails(child)}
                                      variant="secondary"
                                    />
                                  </div>
                                </TableCell>
                              </tr>
                            );
                          });
                        }

                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 xl:hidden">
                {paginatedGroups.map((group) => {
                  const parent = group[0];
                  const children = group.slice(1);
                  const isExpanded = expandedCards.includes(parent.id);

                  return (
                    <div
                      key={parent.id}
                      className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                    >
                      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-slate-500">
                              Application
                            </div>
                            <div className="text-lg font-semibold text-slate-900">
                              #{parent.id}
                            </div>
                          </div>

                          <StatusBadge
                            status={parent.statusCode}
                            label={parent.statusLabel}
                          />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <InfoItem
                            label="Department"
                            value={parent.department?.name || "N/A"}
                          />
                          <InfoItem
                            label="Created At"
                            value={new Date(parent.createdAt).toLocaleString()}
                          />
                          <InfoItem
                            label="Type"
                            value={parent.type?.name || "N/A"}
                          />
                          <InfoItem
                            label="Price (With Tax)"
                            value={`$${parent.priceWithTax?.toFixed(2) || "0.00"}`}
                          />
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {parent.imageFilename ? (
                            <ActionButton
                              icon={<FiEye />}
                              label="View Receipt"
                              onClick={() =>
                                setSelectedReceipt(getReceiptUrl(parent.imageFilename))
                              }
                            />
                          ) : (
                            <MutedText>No Image</MutedText>
                          )}

                          <ActionButton
                            icon={<FiFileText />}
                            label="Show Details"
                            onClick={() => openVisaDetails(parent)}
                            variant="secondary"
                          />

                          <ActionButton
                            icon={<FiRotateCcw />}
                            label="Resubmit"
                            onClick={() => navigate(`/visa/edit/${parent.id}`)}
                            disabled={!canResubmit(parent.statusCode)}
                          />

                          <ActionButton
                            icon={<FiXCircle />}
                            label="Cancel"
                            onClick={() => handleCancelClick(parent)}
                            variant="danger"
                            disabled={!canCancel(parent.statusCode)}
                          />
                        </div>

                        <button
                          onClick={() => toggleCardExpand(parent.id)}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                        >
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                          {isExpanded ? "Show Less" : "Show More"}
                        </button>

                        {isExpanded && (
                          <div className="mt-5 space-y-5 border-t border-slate-200 pt-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <InfoItem
                                label="Remarks"
                                value={parent.remarks || "N/A"}
                              />
                              <InfoItem
                                label="Purchase Method"
                                value={parent.purchaseMethod?.description || "N/A"}
                              />
                              <InfoItem
                                label="Current Approver"
                                value={getCurrentApprover(parent.approvals)}
                              />
                              <InfoItem
                                label="Approved By"
                                value={formatApprovedBy(parent.approvals)}
                              />
                              <InfoItem
                                label="Approvers"
                                value={getAllApprovers(parent)}
                              />
                              <InfoItem
                                label="Decline Remarks"
                                value={getDeclineRemarksWithApprover(parent.approvals)}
                              />
                            </div>

                            {children.length > 0 && (
                              <div>
                                <div className="mb-3 flex items-center gap-2">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <FiLayers />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      Resubmissions
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Earlier or related submissions in this request
                                      chain
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {children.map((child) => (
                                    <div
                                      key={child.id}
                                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <div className="text-xs text-slate-500">
                                            Application
                                          </div>
                                          <div className="text-sm font-semibold text-slate-900">
                                            #{child.id}
                                          </div>
                                        </div>

                                        <StatusBadge
                                          status={child.statusCode}
                                          label={child.statusLabel}
                                        />
                                      </div>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <InfoItem
                                          label="Department"
                                          value={child.department?.name || "N/A"}
                                        />
                                        <InfoItem
                                          label="Created At"
                                          value={new Date(
                                            child.createdAt
                                          ).toLocaleString()}
                                        />
                                        <InfoItem
                                          label="Type"
                                          value={child.type?.name || "N/A"}
                                        />
                                        <InfoItem
                                          label="Price (With Tax)"
                                          value={`$${child.priceWithTax?.toFixed(2) || "0.00"}`}
                                        />
                                        <InfoItem
                                          label="Purchase Method"
                                          value={
                                            child.purchaseMethod?.description || "N/A"
                                          }
                                        />
                                        <InfoItem
                                          label="Remarks"
                                          value={child.remarks || "N/A"}
                                        />
                                      </div>

                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {child.imageFilename ? (
                                          <ActionButton
                                            icon={<FiEye />}
                                            label="View Receipt"
                                            onClick={() =>
                                              setSelectedReceipt(
                                                getReceiptUrl(child.imageFilename)
                                              )
                                            }
                                          />
                                        ) : (
                                          <MutedText>No Image</MutedText>
                                        )}

                                        <ActionButton
                                          icon={<FiFileText />}
                                          label="Show Details"
                                          onClick={() => openVisaDetails(child)}
                                          variant="secondary"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

        {selectedVisaDetails && (
          <VisaDetailsModal
            visa={selectedVisaDetails}
            onClose={() => setSelectedVisaDetails(null)}
          />
        )}

        {selectedReceipt && (
          <ReceiptModal
            imageUrl={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}

        {showCancelConfirm && (
          <ConfirmationPopup
            message="Are you sure you want to cancel this application?"
            onConfirm={confirmCancel}
            onCancel={() => {
              setShowCancelConfirm(false);
              setSelectedVisaToCancel(null);
            }}
          />
        )}
      </div>
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

function MutedText({ children }) {
  return <span className="text-sm text-slate-400">{children}</span>;
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
    secondary: disabled
      ? "border-slate-200 bg-slate-100 text-slate-400"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    danger: disabled
      ? "border-slate-200 bg-slate-100 text-slate-400"
      : "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
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

function StatusBadge({ status, label }) {
  const map = {
    APPROVED: {
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: <FiCheckCircle />,
    },
    PROCESSED: {
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: <FiCheckCircle />,
    },
    DECLINED: {
      cls: "border-red-200 bg-red-50 text-red-700",
      icon: <FiAlertCircle />,
    },
    PENDING: {
      cls: "border-amber-200 bg-amber-50 text-amber-700",
      icon: <FiClock />,
    },
    FOR_PROCESSING: {
      cls: "border-blue-200 bg-blue-50 text-blue-700",
      icon: <FiClock />,
    },
    RETURNED: {
      cls: "border-purple-200 bg-purple-50 text-purple-700",
      icon: <FiAlertCircle />,
    },
    RETURNED_BY_FINANCE: {
      cls: "border-purple-200 bg-purple-50 text-purple-700",
      icon: <FiAlertCircle />,
    },
    RETURNED_BY_PROCESSOR: {
      cls: "border-purple-200 bg-purple-50 text-purple-700",
      icon: <FiAlertCircle />,
    },
    CANCELLED: {
      cls: "border-slate-200 bg-slate-100 text-slate-600",
      icon: <FiXCircle />,
    },
  };

  const cfg = map[status] || {
    cls: "border-blue-200 bg-blue-50 text-blue-700",
    icon: <FiFileText />,
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {label || status || "N/A"}
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

export default VisaListWChildren;
