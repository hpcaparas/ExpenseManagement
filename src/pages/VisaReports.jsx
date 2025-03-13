import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import ReceiptModal from "../components/ReceiptModal";
import { FaDownload, FaSearch } from "react-icons/fa";

const VisaReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchVisaReports();
  }, []);

  const fetchVisaReports = async () => {
    try {
      const response = await ApiClient.get("/reports");
      setReports(response.data);
    } catch (err) {
      console.error("Failed to fetch visa reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const response = await ApiClient.get("/reports/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "visa_reports.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Failed to export visa reports.");
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      report.department.toLowerCase().includes(search.toLowerCase()) ||
      report.type.toLowerCase().includes(search.toLowerCase()) ||
      report.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Visa Reports</h1>

      <div className="flex justify-between mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="border p-2 rounded pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
        </div>

        <button
          onClick={handleExportToExcel}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          <FaDownload className="mr-2" /> Download Excel
        </button>
      </div>

      {loading ? <p>Loading...</p> : null}

      {/* 📌 Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 hidden md:table">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Applicant</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Price (With Tax)</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Remarks</th>
              <th className="p-2 border">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">No visa reports found.</td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className="border">
                  <td className="p-2 border">{report.applicantName}</td>
                  <td className="p-2 border">{report.department}</td>
                  <td className="p-2 border">{report.type}</td>
                  <td className="p-2 border">${report.priceWithTax.toFixed(2)}</td>
                  <td className="p-2 border">{report.status}</td>
                  <td className="p-2 border">{report.remarks}</td>
                  <td className="p-2 border">
                    {report.imageFilename ? (
                      <button
                        onClick={() => setSelectedReceipt(`http://localhost:8080/uploads/${report.imageFilename}`)}
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
        {filteredReports.length === 0 ? (
          <p className="text-center">No visa reports found.</p>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-white p-4 rounded shadow">
              <p><strong>Applicant:</strong> {report.applicantName}</p>
              <p><strong>Department:</strong> {report.department}</p>
              <p><strong>Type:</strong> {report.type}</p>
              <p><strong>Price (With Tax):</strong> ${report.priceWithTax.toFixed(2)}</p>
              <p><strong>Status:</strong> {report.status}</p>
              <p><strong>Remarks:</strong> {report.remarks}</p>
              <p>
                <strong>Receipt:</strong>
                {report.imageFilename ? (
                  <button
                    onClick={() => setSelectedReceipt(`http://localhost:8080/uploads/${report.imageFilename}`)}
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

export default VisaReports;
