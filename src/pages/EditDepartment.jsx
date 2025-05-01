import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    glCode: "",
    companyName: "",
    approvalType: "EXPENSE_APPROVAL",
    approvalSteps: [],
  });

  const [orgRoles, setOrgRoles] = useState([]);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.company?.name) {
      setFormData((prev) => ({ ...prev, companyName: user.company.name }));
      fetchOrgRoles(user.company.name);
    }
    fetchDepartment();
  }, []);

  const fetchOrgRoles = async (companyName) => {
    try {
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      setOrgRoles(response.data);
    } catch (err) {
      setError("Failed to load org roles.");
    }
  };

  const fetchDepartment = async () => {
    try {
      const res = await ApiClient.get(`/departments/${id}`);
      const dept = res.data;

      setFormData((prev) => ({
        ...prev,
        name: dept.name,
        glCode: dept.glCode,
        approvalType: dept.approvalType || "EXPENSE_APPROVAL",
        approvalSteps: dept.approvalSteps.map((step) => ({
          orgRoleId: step.orgRoleId,
          sequenceOrder: step.sequenceOrder,
        })),
      }));
    } catch (err) {
      setError("Failed to fetch department.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addApprovalStep = () => {
    setFormData((prevState) => ({
      ...prevState,
      approvalSteps: [
        ...prevState.approvalSteps,
        {
          orgRoleId: null,
          scope: "DEPARTMENT",
          sequenceOrder: prevState.approvalSteps.length + 1,
        },
      ],
    }));
  };
  
  const handleApprovalStepChange = (index, field, value) => {
    setFormData((prevState) => {
      const updatedSteps = [...prevState.approvalSteps];
      updatedSteps[index][field] = value;
      return { ...prevState, approvalSteps: updatedSteps };
    });
  };
  

  const removeApprovalStep = (index) => {
    const updated = formData.approvalSteps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, sequenceOrder: i + 1 }));
    setFormData({ ...formData, approvalSteps: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalData = {
      ...formData,
      userId: localStorage.getItem("userId"),
      username: JSON.parse(localStorage.getItem("user"))?.name,
    };

    try {
      await ApiClient.put(`/departments/${id}`, finalData);
      setShowConfirmation(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update department.");
    }
  };

  const handleBack = () => {
    if (window.confirm("Discard changes and go back?")) {
      navigate("/departments");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Department</h1>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <div className="mb-4">
          <label className="block text-sm font-medium">Department Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

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
          <label className="block text-sm font-medium">Approval Type</label>
          <select
            name="approvalType"
            value={formData.approvalType}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled
          >
            <option value="EXPENSE_APPROVAL">Expense Approval</option>
          </select>
        </div>

        {/* Approval Steps */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Approval Steps</h2>
          {formData.approvalSteps.map((step, index) => (
            <div key={index} className="mb-4 p-3 border rounded bg-gray-100">
              <p className="text-sm font-bold mb-1">Step {index + 1}</p>

              <label className="block text-sm font-medium">Org Role</label>
              <select
                value={step.orgRoleId || ""}
                onChange={(e) => handleApprovalStepChange(index, "orgRoleId", e.target.value)}
                className="w-full border p-2 rounded mb-2"
              >
                <option value="">Select Org Role</option>
                {orgRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.orgRoleDescription}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium">Scope</label>
              <select
                value={step.scope || "DEPARTMENT"}
                onChange={(e) => handleApprovalStepChange(index, "scope", e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="DEPARTMENT">DEPARTMENT</option>
                <option value="COMPANY">COMPANY</option>
              </select>

              <button
                type="button"
                onClick={() => removeApprovalStep(index)}
                className="text-red-500 mt-2 block"
              >
                Remove Step
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addApprovalStep}
            className="bg-blue-500 text-white p-2 rounded mt-2"
          >
            Add Step
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Department
          </button>
        </div>
      </form>

      {showConfirmation && (
        <ConfirmationPopup
          message="Department updated successfully!"
          onConfirm={() => navigate("/departments")}
        />
      )}
    </div>
  );
};

export default EditDepartment;
