import React, { useEffect, useMemo, useState } from "react";
import {
  FiDownload,
  FiSearch,
  FiFilter,
  FiInbox,
  FiUser,
  FiCalendar,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal";
import FilterModal from "../components/FilterModal";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import config from "../config/config";
import JSZip from "jszip";
import { saveAs } from "file-saver";


const getStatusStyle = (status) => {
  switch (status) {
    case "APPROVED":
    case "PROCESSED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DECLINED":
      return "border-red-200 bg-red-50 text-red-700";
    case "PENDING":
    case "FOR_PROCESSING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "RETURNED":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-500";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
};

const getDefaultPageSize = () => {
  const height = window.innerHeight;
  return Math.max(5, Math.floor((height - 260) / 72));
};

const VisaReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(getDefaultPageSize());
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const filterOptions = [
    { key: "applicantName", label: "Applicant Name" },
    { key: "createdAt", label: "Created At" },
    { key: "department", label: "Department" },
    { key: "purchaseMethod", label: "Purchase Method" },
    { key: "type", label: "Type" },
    { key: "status.description", label: "Status" },
    { key: "remarks", label: "Remarks" },
  ];

  useEffect(() => {
    fetchVisaReports();
  }, []);

  const fetchVisaReports = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await ApiClient.get("/reports");
      setReports(response.data || []);
      setPage(1);
    } catch (err) {
      setErrorMessage("Failed to fetch expense reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const response = await ApiClient.get("/reports/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_reports.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage("Failed to export to Excel.");
    }
  };

  const handleExportToCSV = () => {
    try {
      const csvHeader = [
        "Applicant",
        "Created At",
        "Department GL Code",
        "Department Name",
        "Purchase Method",
        "Purchase Type GL Code",
        "Purchase Type Name",
        "Price With Tax",
        "Status",
        "Remarks",
      ];

      const csvRows = filteredAndSortedReports.map((r) => [
        r.applicantName,
        r.createdAt,
        r.departmentCode,
        r.department,
        r.purchaseMethod,
        r.typeCode,
        r.type,
        r.priceWithTax,
        r.status?.description,
        r.remarks,
      ]);

      const escapeCsv = (value) => {
        const str = String(value ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvContent = [csvHeader, ...csvRows]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", "expense_reports.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage("Failed to export to CSV.");
    }
  };

  const applyFilters = (report) => {
    return filters.every((filter) => {
      if (!filter.property || !filter.value) return true;

      if (filter.property === "createdAt") {
        const createdAtDate = new Date(report.createdAt);
        const fromDate = filter.value.from ? new Date(filter.value.from) : null;
        const toDate = filter.value.to ? new Date(filter.value.to) : null;

        if (fromDate && createdAtDate < fromDate) return false;
        if (toDate) {
          const inclusiveTo = new Date(toDate);
          inclusiveTo.setHours(23, 59, 59, 999);
          if (createdAtDate > inclusiveTo) return false;
        }
        return true;
      }

      const value = filter.property.includes(".")
        ? filter.property.split(".").reduce((o, k) => (o ? o[k] : ""), report)
        : report[filter.property];

      return String(value || "")
        .toLowerCase()
        .includes(String(filter.value || "").toLowerCase());
    });
  };

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) =>
        [
          report.applicantName,
          report.department,
          report.type,
          report.status?.description,
          report.purchaseMethod,
          report.remarks,
        ].some((val) =>
          String(val || "").toLowerCase().includes(search.toLowerCase())
        )
      )
      .filter(applyFilters);
  }, [reports, search, filters]);

  const getSortValue = (report, key) => {
    if (key.includes(".")) {
      return key.split(".").reduce((o, k) => (o ? o[k] : ""), report) ?? "";
    }
    return report[key] ?? "";
  };

  const filteredAndSortedReports = useMemo(() => {
    const sorted = [...filteredReports].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aVal = getSortValue(a, sortConfig.key);
      const bVal = getSortValue(b, sortConfig.key);

      if (sortConfig.key === "createdAt") {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return sorted;
  }, [filteredReports, sortConfig]);

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredAndSortedReports.slice(start, start + rowsPerPage);
  }, [filteredAndSortedReports, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReports.length / rowsPerPage));
  const pageStart = filteredAndSortedReports.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(page * rowsPerPage, filteredAndSortedReports.length);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const addFilter = () =>
    setFilters([...filters, { property: "", value: "" }]);

  const removeFilter = (index) =>
    setFilters(filters.filter((_, i) => i !== index));

  const clearFilters = () => setFilters([]);

  const goToPage = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExportImagesToZip = async () => {
    try {
      setErrorMessage("");
  
      const reportsWithImages = filteredAndSortedReports.filter(
        (report) => report.imageFilename
      );
  
      if (reportsWithImages.length === 0) {
        setErrorMessage("No images available to download.");
        return;
      }
  
      const zip = new JSZip();
      const imagesFolder = zip.folder("expense-report-images");
  
      const sanitize = (value) =>
        String(value || "")
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
          .replace(/\s+/g, "_");
  
      await Promise.all(
        reportsWithImages.map(async (report) => {
          try {
            const imageUrl = `${config.baseUrl}uploads/${report.imageFilename}`;
            const response = await fetch(imageUrl);
  
            if (!response.ok) {
              console.warn(`Failed to fetch image: ${report.imageFilename}`);
              return;
            }
  
            const blob = await response.blob();
  
            const originalName = report.imageFilename || `report-${report.id}`;
            const extension = originalName.includes(".")
              ? originalName.substring(originalName.lastIndexOf("."))
              : ".jpg";
  
            const fileName = `report_${report.id}_${sanitize(
              report.applicantName || "unknown"
            )}_${sanitize(report.department || "department")}${extension}`;
  
            imagesFolder.file(fileName, blob);
          } catch (err) {
            console.warn("Error processing image:", report.imageFilename, err);
          }
        })
      );
  
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "expense_report_images.zip");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to export images to ZIP.");
    }
  };


  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Reporting"
          title="Expense Reports"
          subtitle="Search, filter, export, and review expense activity across the organization."
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportToCSV}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                <FiDownload />
                CSV
              </button>
              <button
                onClick={handleExportToExcel}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
              >
                <FiDownload />
                Excel
              </button>
              <button
                onClick={handleExportImagesToZip}
                className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-100"
              >
                <FiDownload />
                Images ZIP
              </button>

            </div>
          }
        />

        {errorMessage ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <SectionCard
          title="Report Explorer"
          subtitle="Use filters, search, sorting, and exports to analyze submitted expense records."
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading reports...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve your reporting data.
              </p>
            </div>
          ) : filteredAndSortedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FiInbox className="text-2xl" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No reports found
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try adjusting your search or filters to find matching expense records.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => setFilterModalOpen(true)}
                    className={`relative inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition ${
                      filters.length > 0
                        ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <FiFilter />
                    Filters
                    {filters.length > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                        {filters.length}
                      </span>
                    )}
                  </button>

                  <div className="relative w-full sm:max-w-md">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search applicant, department, type, status..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Showing {pageStart}-{pageEnd} of {filteredAndSortedReports.length} record
                    {filteredAndSortedReports.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Filtered from {reports.length} total report
                    {reports.length === 1 ? "" : "s"}.
                  </div>
                </div>
              </div>

              <div className="hidden xl:block">
                <div className="rounded-[24px] border border-slate-200 bg-white">
                  <table className="w-full table-fixed border-separate border-spacing-y-3">
                    <thead>
                      <tr>
                        <SortableHead
                          className="w-[12%]"
                          label="Applicant"
                          sortKey="applicantName"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <SortableHead
                          className="w-[14%]"
                          label="Created At"
                          sortKey="createdAt"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <SortableHead
                          className="w-[16%]"
                          label="Department"
                          sortKey="department"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <SortableHead
                          className="w-[12%]"
                          label="Method"
                          sortKey="purchaseMethod"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <SortableHead
                          className="w-[16%]"
                          label="Type"
                          sortKey="type"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <SortableHead
                          className="w-[10%]"
                          label="Amount"
                          sortKey="priceWithTax"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <SortableHead
                          className="w-[10%]"
                          label="Status"
                          sortKey="status.description"
                          requestSort={requestSort}
                          sortConfig={sortConfig}
                        />
                        <TableHead className="w-[10%]">Receipt</TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedReports.map((report) => (
                        <tr key={report.id} className="align-top">
                          <TableCell className="rounded-l-2xl">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FiUser />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {report.applicantName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Report #{report.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2">
                              <FiCalendar className="mt-0.5 shrink-0 text-slate-400" />
                              <div>
                                <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-500">
                                  {new Date(report.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2">
                              <FiBriefcase className="mt-0.5 shrink-0 text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-900">
                                  {report.department}
                                </div>
                                <div className="text-xs text-slate-500">
                                  GL: {report.departmentCode || "N/A"}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>{report.purchaseMethod || "N/A"}</TableCell>

                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-900">
                                {report.type}
                              </div>
                              <div className="text-xs text-slate-500">
                                GL: {report.typeCode || "N/A"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2 font-semibold text-slate-900">
                              <FiDollarSign className="mt-0.5 shrink-0 text-slate-400" />
                              <span>${Number(report.priceWithTax || 0).toFixed(2)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              statusCode={report.status?.code}
                              label={report.status?.description}
                            />
                          </TableCell>

                          <TableCell className="rounded-r-2xl">
                            {report.imageFilename ? (
                              <ActionButton
                                icon={<FiEye />}
                                label="View"
                                onClick={() =>
                                  setSelectedReceipt(
                                    `${config.baseUrl}uploads/${report.imageFilename}`
                                  )
                                }
                              />
                            ) : (
                              <MutedText>No Image</MutedText>
                            )}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 xl:hidden">
                {paginatedReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-slate-500">Applicant</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {report.applicantName}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Report #{report.id}
                          </div>
                        </div>

                        <StatusBadge
                          statusCode={report.status?.code}
                          label={report.status?.description}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoItem
                          label="Created At"
                          value={new Date(report.createdAt).toLocaleString()}
                        />
                        <InfoItem
                          label="Department"
                          value={`${report.departmentCode || "N/A"} - ${report.department}`}
                        />
                        <InfoItem
                          label="Purchase Method"
                          value={report.purchaseMethod || "N/A"}
                        />
                        <InfoItem
                          label="Purchase Type"
                          value={`${report.typeCode || "N/A"} - ${report.type}`}
                        />
                        <InfoItem
                          label="Price With Tax"
                          value={`$${Number(report.priceWithTax || 0).toFixed(2)}`}
                        />
                        <InfoItem
                          label="Remarks"
                          value={report.remarks || "No remarks"}
                        />
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      {report.imageFilename ? (
                        <ActionButton
                          icon={<FiEye />}
                          label="View Receipt"
                          onClick={() =>
                            setSelectedReceipt(
                              `${config.baseUrl}uploads/${report.imageFilename}`
                            )
                          }
                        />
                      ) : (
                        <MutedText>No Image</MutedText>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </div>

                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {filterModalOpen && (
        <FilterModal onClose={() => setFilterModalOpen(false)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiFilter />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Filter Reports</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Build one or more filters to narrow down the report list.
                </p>
              </div>
            </div>

            {filters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No filters added yet.
              </div>
            ) : null}

            {filters.map((filter, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <select
                    value={filter.property}
                    onChange={(e) => {
                      const newFilters = [...filters];
                      newFilters[index].property = e.target.value;
                      if (e.target.value === "createdAt") {
                        newFilters[index].value = { from: "", to: "" };
                      } else {
                        newFilters[index].value = "";
                      }
                      setFilters(newFilters);
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select Property</option>
                    {filterOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {filter.property === "createdAt" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="date"
                        value={filter.value.from}
                        onChange={(e) => {
                          const newFilters = [...filters];
                          newFilters[index].value.from = e.target.value;
                          setFilters(newFilters);
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                      <input
                        type="date"
                        value={filter.value.to}
                        onChange={(e) => {
                          const newFilters = [...filters];
                          newFilters[index].value.to = e.target.value;
                          setFilters(newFilters);
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[index].value = e.target.value;
                        setFilters(newFilters);
                      }}
                      placeholder="Enter value"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  )}

                  <button
                    onClick={() => removeFilter(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={addFilter}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FiFilter />
                Add Filter
              </button>

              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
              >
                <FiRefreshCw />
                Clear Filters
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setFilterModalOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700"
              >
                Apply
              </button>
            </div>
          </div>
        </FilterModal>
      )}

      {selectedReceipt && (
        <ReceiptModal imageUrl={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
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

function SortableHead({ label, sortKey, requestSort, sortConfig, className = "" }) {
  const active = sortConfig.key === sortKey;
  const direction = active ? sortConfig.direction : "";

  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ${className}`}>
      <button
        type="button"
        onClick={() => requestSort(sortKey)}
        className="inline-flex items-center gap-2 transition hover:text-slate-700"
      >
        {label}
        <span className={`text-[10px] ${active ? "text-blue-600" : "text-slate-300"}`}>
          {direction === "asc" ? "▲" : direction === "desc" ? "▼" : "↕"}
        </span>
      </button>
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

function StatusBadge({ statusCode, label }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
        statusCode
      )}`}
    >
      {statusCode === "APPROVED" || statusCode === "PROCESSED" ? (
        <FiCheckCircle />
      ) : statusCode === "DECLINED" ? (
        <FiXCircle />
      ) : (
        <FiClock />
      )}
      {label || statusCode || "N/A"}
    </span>
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

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
    >
      {icon}
      {label}
    </button>
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

export default VisaReports;
