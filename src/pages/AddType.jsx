import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup"; // ✅ Import ConfirmationPopup

const AddType = () => {
  const [formData, setFormData] = useState({
    glCode: "",
    name: "",
  });

  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // ✅ Store request data and show confirmation modal
    setPendingRequest(formData);
    setShowConfirmation(true);
  };

  // ✅ Proceed with API call after confirmation
  const confirmSubmit = async () => {
    if (!pendingRequest) return;

    setShowConfirmation(false);
    setLoading(true);

    // ✅ Fetch user ID from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId) {
        setError("User ID is missing. Please re-login.");
        setLoading(false);
        return;
    }

    try {
      await ApiClient.post("/types", { ...pendingRequest, userId });
      navigate("/types"); // ✅ Redirect after success
    } catch (err) {
        setError(err.response?.data || "Failed to create type.");
    } finally {
        setLoading(false);
    }
  };


  const handleBack = () => {
    if (window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
      navigate("/types");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Type</h1>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <div className="mb-4">
          <label className="block text-sm font-medium">GL Code</label>
          <input
            type="text"
            name="glCode"
            value={formData.glCode}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Type Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
          &nbsp;
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
            {loading ? "Creating..." : "Create Type"}
          </button>
        </div>
      </form>

      {/* ✅ Confirmation before saving */}
      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to create this type?"
          onConfirm={confirmSubmit} // ✅ Proceed with API call
          onCancel={() => setShowConfirmation(false)} // ❌ Cancel action
        />
      )}
    </div>
  );
};

export default AddType;
