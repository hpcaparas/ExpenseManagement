import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup"; // ✅ Import ConfirmationPopup

const EditDepartment = () => {
  const { id } = useParams(); // ✅ Get department ID from URL
  const [formData, setFormData] = useState({
    name: "",
    glCode: "",
    companyName: "Default Company",
    approvalSteps: [],
  });

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetadata();
    fetchDepartmentDetails();
  }, []);

  // Fetch available roles and users
  const fetchMetadata = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        ApiClient.get("/roles"),
        ApiClient.get("/users"),
      ]);
      setRoles(rolesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError("Failed to load roles or users.");
    }
  };

  // Fetch department details and prepopulate form
  const fetchDepartmentDetails = async () => {
    try {
      const response = await ApiClient.get(`/departments/${id}`);
      const departmentData = response.data;

      setFormData({
        name: departmentData.name,
        glCode: departmentData.glCode,
        companyName: departmentData.company?.name || "Default Company",
        approvalSteps: departmentData.approvalSteps.map((step, index) => ({
          approvalType: step.roleId ? "role" : "user",
          roleId: step.roleId || null,
          userId: step.userId || null,
          sequenceOrder: index + 1,
        })),
      });
    } catch (err) {
      setError("Failed to load department details.");
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
          approvalType: "",
          roleId: null,
          userId: null,
          sequenceOrder: prevState.approvalSteps.length + 1, // ✅ Auto-assign sequenceOrder
        },
      ],
    }));
  };

  const handleApprovalStepChange = (index, field, value) => {
    setFormData((prevState) => {
      const updatedSteps = [...prevState.approvalSteps];

      if (field === "roleId") {
        updatedSteps[index] = { ...updatedSteps[index], roleId: value, userId: null };
      } else if (field === "userId") {
        updatedSteps[index] = { ...updatedSteps[index], userId: value, roleId: null };
      } else {
        updatedSteps[index][field] = value;
      }

      return { ...prevState, approvalSteps: updatedSteps };
    });
  };

  const removeApprovalStep = (index) => {
    setFormData((prevState) => ({
      ...prevState,
      approvalSteps: prevState.approvalSteps
        .filter((_, i) => i !== index)
        .map((step, idx) => ({ ...step, sequenceOrder: idx + 1 })), // ✅ Reorder sequence
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ If no approval steps are selected, add a default one
    const approvalSteps =
      formData.approvalSteps.length > 0
        ? formData.approvalSteps.map((step, index) => ({
            approvalType: step.approvalType,
            roleId: step.approvalType === "role" ? step.roleId : null,
            userId: step.approvalType === "user" ? step.userId : null,
            sequenceOrder: index + 1,
          }))
        : [
            {
              approvalType: "role",
              roleId: "1",
              userId: null,
              sequenceOrder: 1,
            },
          ]; // ✅ Default approval step if none is selected

    const finalData = {
      ...formData,
      approvalSteps,
      userId: localStorage.getItem("userId"),
      username: JSON.parse(localStorage.getItem("user")).name,
    };

    try {
      await ApiClient.put(`/departments/${id}`, finalData);
      setShowConfirmation(true); // ✅ Show confirmation popup on success
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update department.");
    }
  };

  const handleBack = () => {
    if (window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
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

        {/* Approval Steps Section */}
        <div className="mb-4 hidden">
          <h2 className="text-lg font-semibold mb-2">Approval Workflow</h2>

          {formData.approvalSteps.map((step, index) => (
            <div key={index} className="mb-4 p-3 border rounded bg-gray-100">
              <p className="text-sm font-bold">Step {index + 1}</p>
              <label className="block text-sm font-medium mt-2">Approval Type</label>
              <select
                onChange={(e) => handleApprovalStepChange(index, "approvalType", e.target.value)}
                value={step.approvalType}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Type</option>
                <option value="role">Role</option>
                <option value="user">User</option>
              </select>

              {step.approvalType === "role" && (
                <select
                  onChange={(e) => handleApprovalStepChange(index, "roleId", e.target.value)}
                  value={step.roleId || ""}
                  className="w-full border p-2 rounded mt-2"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}

              {step.approvalType === "user" && (
                <select
                  onChange={(e) => handleApprovalStepChange(index, "userId", e.target.value)}
                  value={step.userId || ""}
                  className="w-full border p-2 rounded mt-2"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}

              <button type="button" onClick={() => removeApprovalStep(index)} className="text-red-500 mt-2">
                Remove Step
              </button>
            </div>
          ))}

          <button type="button" onClick={addApprovalStep} className="mt-2 bg-blue-500 text-white p-2 rounded">
            Add Approval Step
          </button>
        </div>

        {/* ✅ Back & Submit Buttons */}
        <div className="flex justify-center">
          <button type="button" onClick={handleBack} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            Back
          </button>
          &nbsp;
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Update Department
          </button>
        </div>
      </form>

      {showConfirmation && <ConfirmationPopup message="Department updated successfully!" onConfirm={() => navigate("/departments")} />}
    </div>
  );
};

export default EditDepartment;
