import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup"; // ✅ Import ConfirmationPopup

const EditType = () => {
  const { id } = useParams(); // ✅ Get type ID from URL
  const [formData, setFormData] = useState({
    glCode: "",
    name: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTypeDetails();
  }, []);

  const fetchTypeDetails = async () => {
    try {
      const response = await ApiClient.get(`/types/${id}`);
      const typeData = response.data;
      setFormData({
        glCode: typeData.glCode,
        name: typeData.name,
      });
    } catch (err) {
      setError("Failed to load type details.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);

    // ✅ Fetch user ID from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId) {
      setError("User ID is missing. Please re-login.");
      setLoading(false);
      return;
    }

    // ✅ Add userId to formData before submitting
    const requestData = { ...formData, userId };

    try {
      await ApiClient.put(`/types/${id}`, requestData);
      setShowConfirmation(true); // ✅ Show confirmation popup
    } catch (err) {
      setError(err.response?.data || "Failed to update type.");
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
      <h1 className="text-2xl font-bold mb-4">Edit Type</h1>

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
            {loading ? "Updating..." : "Update Type"}
          </button>
        </div>
      </form>

      {showConfirmation && (
        <ConfirmationPopup
          message="Type updated successfully!"
          onConfirm={() => navigate("/types")}
        />
      )}
    </div>
  );
};

export default EditType;
