import React from "react";

const VisaDetailsModal = ({ visa, onClose }) => {
  if (!visa) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-200">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold">Visa Application #{visa.id}</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Remarks</label>
              <p className="text-gray-800 font-medium">{visa.remarks || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Purchase Method</label>
              <p className="text-gray-800 font-medium">{visa.purchaseMethod?.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Current Approver</label>
              <p className="text-gray-800 font-medium">{visa.currentApprover || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Approved By</label>
              <p className="text-gray-800 font-medium">{visa.approvedBy || "N/A"}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-500">All Approvers</label>
              <p className="text-gray-800 font-medium">{visa.allApprovers || "N/A"}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-500">Decline Remarks</label>
              <p className="text-gray-800 font-medium">{visa.declineRemarks || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-100 text-right rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisaDetailsModal;
