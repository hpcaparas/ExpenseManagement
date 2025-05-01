import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";

const EditOrgRole = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    orgRoleCode: "",
    orgRoleDescription: "",
    companyName: "",
    amountLimit: 0,
  });

  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          companyName: user.company?.name || "Default Company",
        }));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }

    fetchOrgRoleDetails();
  }, []);

  const fetchOrgRoleDetails = async () => {
    try {
      const companyName = JSON.parse(localStorage.getItem("user")).company.name;
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      const matched = response.data.find((role) => role.id === parseInt(id));
      if (!matched) throw new Error("Org Role not found");

      setFormData({
        orgRoleCode: matched.orgRoleCode,
        orgRoleDescription: matched.orgRoleDescription || "",
        companyName: matched.companyName,
        amountLimit:matched.amountLimit,
      });
    } catch (error) {
      console.error("Error loading org role:", error);
      setError("Failed to load org role details.");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.orgRoleCode) {
      return setError("Org Role Code is required.");
    }

    setPendingRequest({
      ...formData,
      userId: localStorage.getItem("userId"),
    });
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    try {
      await ApiClient.put(`/org-roles/${id}`, pendingRequest);
      navigate("/orgRoles");
    } catch (err) {
      setError(err.response?.data || "Failed to update org role.");
    } finally {
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
      navigate("/orgRoles");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Org Role</h1>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <div className="mb-4">
          <label className="block text-sm font-medium">Org Role Code *</label>
          <input
            type="text"
            name="orgRoleCode"
            value={formData.orgRoleCode}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Org Role Description</label>
          <input
            type="text"
            name="orgRoleDescription"
            value={formData.orgRoleDescription}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Amount Limit</label>
          <input
            type="text"
            name="amountLimit"
            value={formData.amountLimit}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Update Org Role
          </button>
        </div>
      </form>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to update this Org Role?"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

export default EditOrgRole;
