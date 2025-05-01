import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal";
import config from "../config/config";

const FINANCE_APPROVER_LABEL = "Finance Approver"; // adjust if needed

const VisaList = () => {
  const [visaApplications, setVisaApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchVisaApplications();
  }, []);

  const fetchVisaApplications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/visa/user/${user.id}`);
      setVisaApplications(response.data);
    } catch (err) {
      setError("Failed to fetch Expense applications.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500";
      case "DECLINED":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  // Approved By: keep current logic but no trailing comma.
  const formatApprovedBy = (approvals) => {
    if (!approvals || approvals.length === 0) return "N/A";
    const approved = approvals.filter((approval) => approval.status === "APPROVED");
    if (approved.length === 0) return "N/A";
    return approved
      .map((approval) => approval.approverRole ? approval.approverRole.name : approval.approver?.name)
      .filter(Boolean)
      .join(", ");
  };

  // Current Approver: show only the first PENDING approver.
  const getCurrentApprover = (approvals) => {
    if (!approvals || approvals.length === 0) return "N/A";
    const pending = approvals.find((a) => a.status === "PENDING");
    if (!pending) return "N/A";
    return pending.approverRole ? pending.approverRole.name : pending.approver?.name;
  };

  // Approvers: show all in workflow, skipping skipped/removed, always add Finance last.
  const getAllApprovers = (visa) => {
    if (!visa || !visa.approvals || visa.approvals.length === 0) return "N/A";
    // Only include unique role/user for skipped ones (those that never got PENDING or APPROVED, i.e. were not created)
    // In your system, you only store created approvals, so just show their names in order
    const approverNames = visa.approvals
      .map((approval) =>
        approval.approverRole ? approval.approverRole.name : approval.approver?.name
      )
      .filter(Boolean);

    // Add Finance Approver only if not already present
    const hasFinance = approverNames.some(name => name === FINANCE_APPROVER_LABEL);
    if (!hasFinance) {
      approverNames.push(FINANCE_APPROVER_LABEL);
    }

    // Remove duplicates if any (optional)
    const uniqueNames = Array.from(new Set(approverNames));
    return uniqueNames.join(", ");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Expense Applications</h1>

      {error && <p className="text-red-500">{error}</p>}
      {loading ? <p>Loading...</p> : null}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Price (With Tax)</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Current Approver</th>
              <th className="p-2 border">Approved By</th>
              <th className="p-2 border">Approvers</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visaApplications.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-4">No expense applications found.</td>
              </tr>
            ) : (
              visaApplications.map((visa) => (
                <tr key={visa.id} className="border">
                  <td className="p-2 border">{visa.department ? visa.department.name : "N/A"}</td>
                  <td className="p-2 border">{visa.type ? visa.type.name : "N/A"}</td>
                  <td className="p-2 border">${visa.priceWithTax ? visa.priceWithTax.toFixed(2) : "0.00"}</td>
                  <td className={`p-2 border font-bold ${getStatusColor(visa.status)}`}>{visa.status}</td>
                  <td className="p-2 border">{getCurrentApprover(visa.approvals)}</td>
                  <td className="p-2 border">{formatApprovedBy(visa.approvals)}</td>
                  <td className="p-2 border">{getAllApprovers(visa)}</td>
                  <td className="p-2 border">
                    {visa.imageFilename ? (
                      <span
                        onClick={() => setSelectedReceipt(`${config.baseUrl}uploads/${visa.imageFilename}`)}
                        className="text-blue-500 hover:underline cursor-pointer"
                        style={{ marginRight: "16px" }}
                      >
                        View Receipt
                      </span>
                    ) : (
                      <span style={{ marginRight: "16px" }}>No Image</span>
                    )}

                    {/* Edit Action */}
                    <span
                      className={`${
                        ["DECLINED", "RETURNED_BY_FINANCE"].includes(visa.status)
                          ? "text-blue-600 hover:underline cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (["DECLINED", "RETURNED_BY_FINANCE"].includes(visa.status)) {
                          window.location.href = `/visa/edit/${visa.id}`;
                        }
                      }}
                      style={{
                        userSelect: "none",
                        pointerEvents: ["DECLINED", "RETURNED_BY_FINANCE"].includes(visa.status) ? "auto" : "none",
                      }}
                    >
                      Edit
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card Layout */}
      {/* ...your mobile logic can be adapted in the same way if you want Approvers column... */}

      {/* Receipt Modal */}
      {selectedReceipt && <ReceiptModal imageUrl={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </div>
  );
};

export default VisaList;
