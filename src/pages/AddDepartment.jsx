import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import { useNavigate } from "react-router-dom";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";

const AddDepartment = () => {
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
  const [showFinanceWarning, setShowFinanceWarning] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.company?.name) {
      setFormData((prev) => ({ ...prev, companyName: user.company.name }));
      fetchOrgRoles(user.company.name);
    }
  }, []);

  const fetchOrgRoles = async (companyName) => {
    try {
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      const roles = response.data;
      setOrgRoles(roles);
  
      const manager = roles.find(r => r.orgRoleDescription.toLowerCase() === "manager" && r.status === "ACTIVE");
      const director = roles.find(r => r.orgRoleDescription.toLowerCase() === "director" && r.status === "ACTIVE");
      const finance = roles.find(r => r.orgRoleDescription.toLowerCase() === "finance approver" && r.status === "ACTIVE");
  
      // ✅ Show modal if Finance is missing or deactivated
      if (!finance) {
        setShowFinanceWarning(true);
        return;
      }
  
      if (manager && director) {
        setFormData((prev) => ({
          ...prev,
          approvalSteps: [
            { orgRoleId: manager.id, scope: "DEPARTMENT", sequenceOrder: 1 },
            { orgRoleId: director.id, scope: "COMPANY", sequenceOrder: 2 },
          ],
        }));
      }
    } catch (err) {
      setError("Failed to load organization roles.");
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
    if (field === "orgRoleId") {
      const selectedRole = orgRoles.find(r => r.id.toString() === value);
      if (selectedRole && selectedRole.orgRoleDescription.toLowerCase() === "finance approver") {
        setError("Finance cannot be added to the approval workflow. It will be added automatically.");
        return;
      }
    }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setPendingRequest(formData);
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const finalData = {
        ...pendingRequest,
        userId: localStorage.getItem("userId"),
        username: user.name,
      };
      await ApiClient.post("/departments", finalData);
      navigate("/departments");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setShowConfirmation(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Department</h1>
      {error && <ErrorModal message={error} onClose={() => setError("")} />}
      {showFinanceWarning && (
        <ErrorModal message="'Finance Approver' org role is either deactivated or not yet existing. Please contact your administrator." onClose={() => setShowFinanceWarning(false)} />
      )}

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
                    {role.orgRoleCode} - {role.orgRoleDescription}
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
            onClick={() => navigate("/departments")}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Department
          </button>
        </div>
      </form>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to create this department?"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {showFinanceWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-96 text-center fade-in-scale">
            <h2 className="text-lg font-bold mb-4 text-red-600">Finance Org Role Missing</h2>
            <p className="text-gray-700 mb-4">
              'Finance Approver' org role is either deactivated or not yet existing. Please contact your administrator.
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => navigate("/departments")}
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddDepartment;
