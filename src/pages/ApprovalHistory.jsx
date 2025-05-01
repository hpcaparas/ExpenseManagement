import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal";

const ApprovalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchApprovalHistory();
  }, []);

  const fetchApprovalHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await ApiClient.get(`/approval/history/${user.id}`);
      setHistory(response.data);
    } catch (err) {
      setErrorMessage("Failed to fetch approval history.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
      case "FINANCE APPROVED":
        return "text-green-600 font-bold";
      case "REJECTED":
      case "RETURNED":
      case "RETURNED BY FINANCE":
        return "text-yellow-600 font-bold";
      case "PENDING":
        return "text-gray-500";
      case "PENDING FINANCE APPROVAL":
        return "text-blue-600 font-bold";
      default:
        return "text-gray-500";
    }
  };
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Approval History</h1>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {loading ? <p>Loading...</p> : null}

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Applicant</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Price (With Tax)</th>
              <th className="p-2 border">Action Made</th>
              <th className="p-2 border">Remarks</th>
              <th className="p-2 border">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">No approval history found.</td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} className="border">
                  <td className="p-2 border">{record.applicantName}</td>
                  <td className="p-2 border">{record.department}</td>
                  <td className="p-2 border">{record.type}</td>
                  <td className="p-2 border">${record.priceWithTax.toFixed(2)}</td>
                  <td className={`p-2 border font-bold ${getStatusColor(record.status)}`}>
                    {record.status}
                  </td>
                  <td className="p-2 border">{record.remarks}</td>
                  <td className="p-2 border">
                    {record.imageFilename ? (
                      <button
                        onClick={() => setSelectedReceipt(`http://localhost:8080/uploads/${record.imageFilename}`)}
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
        {history.length === 0 ? (
          <p className="text-center">No approval history found.</p>
        ) : (
          history.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded shadow">
              <p><strong>Applicant:</strong> {record.applicantName}</p>
              <p><strong>Department:</strong> {record.department}</p>
              <p><strong>Type:</strong> {record.type}</p>
              <p><strong>Price (With Tax):</strong> ${record.priceWithTax.toFixed(2)}</p>
              <p className={`font-bold ${getStatusColor(record.status)}`}>
                <strong>Status:</strong> {record.status}
              </p>
              <p><strong>Remarks:</strong> {record.remarks || "No remarks"}</p>
              <p>
                <strong>Receipt:</strong>
                {record.imageFilename ? (
                  <button
                    onClick={() => setSelectedReceipt(`http://localhost:8080/uploads/${record.imageFilename}`)}
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

      {selectedReceipt && <ReceiptModal imageUrl={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </div>
  );
};

export default ApprovalHistory;
