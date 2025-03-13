import React, { useState, useEffect } from "react";
import ApiClient from "../utils/ApiClient";
import { useNavigate } from "react-router-dom";
import ConfirmationPopup from "../components/ConfirmationPopup"; // ✅ Import ConfirmationPopup

const AddDepartment = () => {
  const [formData, setFormData] = useState({
    name: "",
    glCode: "",
    companyName: "", // Auto-detected
    approvalSteps: [],
  });

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false); // ✅ Confirmation popup state
  const [pendingRequest, setPendingRequest] = useState(null);
  const navigate = useNavigate();

  // Fetch roles and users on mount
  useEffect(() => {
    fetchMetadata();

    const storedUser = localStorage.getItem("user");
  
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.company?.name) {
          setFormData((prevData) => ({
            ...prevData,
            companyName: user.company.name, // ✅ Set companyName
          }));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // ✅ Store request data and show confirmation modal
    setPendingRequest(formData);
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!pendingRequest) return;

    setShowConfirmation(false);

    const role = roles.find((role) => role.name === "Finance");

    // ✅ If no approval steps are selected, add a default one
    const approvalSteps =
      pendingRequest.approvalSteps.length > 0
        ? pendingRequest.approvalSteps.map((step, index) => ({
            approvalType: step.approvalType,
            roleId: step.approvalType === "role" ? step.roleId : null,
            userId: step.approvalType === "user" ? step.userId : null,
            sequenceOrder: index + 1,
          }))
        : [
            {
              approvalType: "role",
              roleId: role ? role.id : null,
              userId: null,
              sequenceOrder: 1,
            },
          ]; // ✅ Default approval step if none is selected

    const finalData = {
      ...pendingRequest,
      approvalSteps,
      userId: localStorage.getItem("userId"),
      username: JSON.parse(localStorage.getItem("user")).name,
    };

    try {
      await ApiClient.post("/departments", finalData);
      navigate("/departments"); // ✅ Redirect after success
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    }
  };

  const handleBack = () => {
    if (window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
      navigate("/departments");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Department</h1>

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
            Create Department
          </button>
        </div>
      </form>

      {/* ✅ Confirmation Popup */}
      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to create this department?"
          onConfirm={confirmSubmit} // ✅ Proceed with API call
          onCancel={() => setShowConfirmation(false)} // ❌ Cancel action
        />
      )}
    </div>
  );
};

export default AddDepartment;
