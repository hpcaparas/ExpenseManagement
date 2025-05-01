import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";
import ReceiptModal from "../components/ReceiptModal"; // ✅ Modal for receipt preview
import config from "../config/config";

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmApprove, setConfirmApprove] = useState({ show: false, approvalId: null });
  const [confirmDecline, setConfirmDecline] = useState({ show: false, approvalId: null, reason: "" });
  const [selectedReceipt, setSelectedReceipt] = useState(null); // ✅ Store selected image

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/approval/pending/${user.id}`);
      setApprovals(response.data);
    } catch (err) {
      setErrorMessage("Failed to fetch pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Approve Visa Application with Confirmation
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

  // ✅ Decline Visa Application with Confirmation
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Approvals</h1>

      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />}
      {successMessage && <ConfirmationPopup message={successMessage} onConfirm={() => setSuccessMessage("")} />}

      {loading ? <p>Loading...</p> : null}

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Applicant</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Price (With Tax)</th>
              <th className="p-2 border">Remarks</th>
              <th className="p-2 border">Receipt</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">No pending approvals.</td>
              </tr>
            ) : (
              approvals.map((approval) => (
                <tr key={approval.id} className="border">
                  <td className="p-2 border">{approval.applicantName}</td>
                  <td className="p-2 border">{approval.department}</td>
                  <td className="p-2 border">{approval.type}</td>
                  <td className="p-2 border">${approval.priceWithTax?.toFixed(2)}</td>
                  <td className="p-2 border">{approval.remarks || "No remarks"}</td>
                  <td className="p-2 border">
                    {approval.imageFilename ? (
                      <button
                        onClick={() => setSelectedReceipt(`${config.baseUrl}uploads/${approval.imageFilename}`)}
                        className="text-blue-500 hover:underline"
                      >
                        View Receipt
                      </button>
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2"
                      onClick={() => setConfirmApprove({ show: true, approvalId: approval.id })}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => setConfirmDecline({ show: true, approvalId: approval.id, reason: "" })}
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden space-y-4">
        {approvals.map((approval) => (
          <div key={approval.id} className="bg-white p-4 rounded shadow">
            <p><strong>Applicant:</strong> {approval.applicantName}</p>
            <p><strong>Department:</strong> {approval.department}</p>
            <p><strong>Type:</strong> {approval.type}</p>
            <p><strong>Price (With Tax):</strong> ${approval.priceWithTax?.toFixed(2)}</p>
            <p><strong>Remarks:</strong> {approval.remarks || "No remarks"}</p>
            <p>
              <strong>Receipt:</strong> 
              {approval.imageFilename ? (
                <button
                  onClick={() => setSelectedReceipt(`${config.baseUrl}uploads/${approval.imageFilename}`)}
                  className="text-blue-500 hover:underline ml-2"
                >
                  View Receipt
                </button>
              ) : (
                " No Image"
              )}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                onClick={() => setConfirmApprove({ show: true, approvalId: approval.id })}
              >
                Approve
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                onClick={() => setConfirmDecline({ show: true, approvalId: approval.id, reason: "" })}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Approve Confirmation Modal */}
      {confirmApprove.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Confirm Approval</h2>
            <p>Are you sure you want to approve this visa application?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 mr-2"
                onClick={() => setConfirmApprove({ show: false, approvalId: null })}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                onClick={handleApprove}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Decline Confirmation Modal */}
      {confirmDecline.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Confirm Decline</h2>
            <textarea
              className="w-full p-2 border rounded"
              placeholder="Enter reason for declining..."
              value={confirmDecline.reason}
              onChange={(e) => setConfirmDecline({ ...confirmDecline, reason: e.target.value })}
            ></textarea>
            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 mr-2"
                onClick={() => setConfirmDecline({ show: false, approvalId: null, reason: "" })}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                onClick={handleDecline}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Receipt Modal */}
      {selectedReceipt && <ReceiptModal imageUrl={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </div>
  );
};

export default PendingApprovals;
