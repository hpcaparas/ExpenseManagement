import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal"; // ✅ Import the new modal component

const VisaList = () => {
  const [visaApplications, setVisaApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null); // ✅ Store selected image

  useEffect(() => {
    fetchVisaApplications();
  }, []);

  const fetchVisaApplications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/visa/user/${user.id}`);
      setVisaApplications(response.data);
    } catch (err) {
      setError("Failed to fetch visa applications.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500";
      case "REJECTED":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatApprovedBy = (approvals) => {
    if (!approvals || approvals.length === 0) return "N/A";
  
    // ✅ Filter only approvals that are NOT pending
    const approved = approvals.filter((approval) => approval.status !== "PENDING");
  
    if (approved.length === 0) return "N/A";
  
    return approved
      .map((approval) =>
        approval.approverRole ? approval.approverRole.name : approval.approver?.name
      )
      .join(", ");
  };

  // ✅ Format Approver Name: Show role if available, else show username
  const formatApprover = (approvals) => {
    if (!approvals || approvals.length === 0) return "N/A";
    return approvals.map((approval) =>
      approval.approverRole ? approval.approverRole.name : approval.approver?.name
    ).join(", ");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Visa Applications</h1>

      {error && <p className="text-red-500">{error}</p>}
      {loading ? <p>Loading...</p> : null}

      {/* 📌 Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left"> {/* ✅ Align headers to the left */}
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Price (With Tax)</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Current Approver</th>
              <th className="p-2 border">Approved By</th>
              <th className="p-2 border">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {visaApplications.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">No visa applications found.</td>
              </tr>
            ) : (
              visaApplications.map((visa) => (
                <tr key={visa.id} className="border">
                  <td className="p-2 border">{visa.department ? visa.department.name : "N/A"}</td>
                  <td className="p-2 border">{visa.type ? visa.type.name : "N/A"}</td>
                  <td className="p-2 border">${visa.priceWithTax ? visa.priceWithTax.toFixed(2) : "0.00"}</td>
                  <td className={`p-2 border font-bold ${getStatusColor(visa.status)}`}>{visa.status}</td>
                  <td className="p-2 border">{formatApprover(visa.approvals)}</td>
                  <td className="p-2 border">{formatApprovedBy(visa.approvals)}</td>
                  <td className="p-2 border">
                    {visa.imageFilename ? (
                      <button
                        onClick={() => setSelectedReceipt(`http://localhost:8080/uploads/${visa.imageFilename}`)}
                        className="text-blue-500 hover:underline"
                      >
                        View Receipt
                      </button>
                    ) : (
                      "No Image"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 📌 Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4">
        {visaApplications.length === 0 ? (
          <p className="text-center">No visa applications found.</p>
        ) : (
          visaApplications.map((visa) => (
            <div key={visa.id} className="bg-white p-4 rounded shadow">
              <p><strong>Department:</strong> {visa.department ? visa.department.name : "N/A"}</p>
              <p><strong>Type:</strong> {visa.type ? visa.type.name : "N/A"}</p>
              <p><strong>Price (With Tax):</strong> ${visa.priceWithTax ? visa.priceWithTax.toFixed(2) : "0.00"}</p>
              <p className={`font-bold ${getStatusColor(visa.status)}`}>
                <strong>Status:</strong> {visa.status}
              </p>
              <p><strong>Current Approver:</strong> {formatApprover(visa.approvals)}</p>
              <p><strong>Approved By:</strong> {formatApprovedBy(visa.approvals)}</p>
              <p>
                <strong>Receipt:</strong>
                {visa.imageFilename ? (
                  <button
                    onClick={() => setSelectedReceipt(`http://localhost:8080/uploads/${visa.imageFilename}`)}
                    className="text-blue-500 hover:underline ml-2"
                  >
                    View Receipt
                  </button>
                ) : (
                  " No Image"
                )}
              </p>
            </div>
          ))
        )}
      </div>


      {/* ✅ Receipt Modal */}
      {selectedReceipt && <ReceiptModal imageUrl={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </div>
  );
};

export default VisaList;
