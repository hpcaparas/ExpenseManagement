import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";
import Lottie from "lottie-react";
import loadingAnimation from "../images/lottie/lottie-loading-money.json";
import imageCompression from "browser-image-compression";

const ApplyVisa = () => {
  const [formData, setFormData] = useState({
    userId: "",
    departmentId: "",
    typeId: "",
    priceWithTax: "",
    tax: "",
    remarks: "",
    image: null,
  });

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [approverSelections, setApproverSelections] = useState({});
  const [workflowSteps, setWorkflowSteps] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [maxUploadSize, setMaxUploadSize] = useState(5 * 1024 * 1024);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      setFormData((prev) => ({ ...prev, userId: user.id }));

      const [deptRes, typeRes] = await Promise.all([
        ApiClient.get(`/departments/company?companyName=${user.company.name}`),
        ApiClient.get("/types"),
      ]);

      setDepartments(deptRes.data);
      setTypes(typeRes.data);
    } catch (err) {
      setErrorMessage("Failed to load metadata.");
    }
  };

  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;
    setFormData({ ...formData, departmentId });
    setWorkflowSteps([]);
    setApproverSelections({});

    if (!departmentId) return;

    try {
      const response = await ApiClient.get(`/departments/${departmentId}/workflow?approvalType=EXPENSE_APPROVAL`);
      const workflow = response.data;

      const updatedApproverSelections = {};
      for (let step of workflow) {
        if (step.users.length === 0) {
          setErrorMessage(`No approver found for org role ${step.orgRoleCode}. Please contact your administrator.`);
          return;
        } else if (step.users.length === 1) {
          updatedApproverSelections[step.sequenceOrder] = step.users[0].id;
        }
      }

      setWorkflowSteps(workflow);
      setApproverSelections(updatedApproverSelections);
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to load approval workflow.");
    }
  };

  const handleApproverChange = (stepOrder, userId) => {
    setApproverSelections((prev) => ({
      ...prev,
      [stepOrder]: userId,
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedBlob = await imageCompression(file, options);
      const fileName = `receipt_${Date.now()}.jpg`;
      const compressedFile = new File([compressedBlob], fileName, { type: "image/jpeg" });

      setCompressedFile(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Image compression failed:", error);
      alert("Failed to compress image. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setPendingRequest({ ...formData, image: compressedFile });
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!pendingRequest) return;
  
    setShowConfirmation(false);
    setLoading(true);
  
    const user = JSON.parse(localStorage.getItem("user"));
    const userOrgRoles = user.orgRoles || []; // [{id, orgRoleCode, orgRoleDescription, amountLimit, ...}]
  
    // Find the user's main org role and amount limit
    // (If multiple org roles, define your rule: pick highest, lowest, or show a selection to the user)
    const userRole = userOrgRoles[0]; // Simplified; adjust as needed
    const userAmountLimit = userRole?.amountLimit ? Number(userRole.amountLimit) : 0;
  
    // Prepare new approverSelections (skip if user's amount limit < approver's amount limit, except Finance)
    let newApproverSelections = { ...approverSelections };
  
    workflowSteps.forEach((step) => {
      const isFinance = step.orgRoleDescription.toLowerCase().includes("finance");
      const approverRoleAmountLimit = Number(step.amountLimit);
  
      if (!isFinance && userAmountLimit < approverRoleAmountLimit) {
        // Skip this approver step (don't include in selections)
        delete newApproverSelections[step.sequenceOrder];
      }
      // If Finance, always keep
    });
  
    // Now continue with your normal FormData logic
    const formDataObj = new FormData();
    Object.keys(pendingRequest).forEach((key) => {
      formDataObj.append(key, pendingRequest[key]);
    });
    formDataObj.append("approverSelections", JSON.stringify(newApproverSelections));
  
    try {
      await ApiClient.post("/visa", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/visa/visas");
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to apply for Expense.");
    } finally {
      setLoading(false);
    }
  };
  

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Apply for Expense</h1>

      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />}

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Lottie options={defaultOptions} height={200} width={200} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <div className="mb-4">
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={JSON.parse(localStorage.getItem("user"))?.name || ""}
            disabled
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Department</label>
          <select name="departmentId" value={formData.departmentId} onChange={handleDepartmentChange} required className="w-full border p-2 rounded">
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Approver Selections */}
        {workflowSteps.map((step) => (
          step.users.length > 1 && (
            <div key={step.sequenceOrder} className="mb-4">
              <label className="block text-sm font-medium">
                Select Approver for Step {step.sequenceOrder} ({step.orgRoleDescription}) -{" "}
                <span className="text-yellow-600 font-semibold">
                  You are seeing this because multiple users have the same org role in the Department/Company.
                </span>
              </label>
              <select
                value={approverSelections[step.sequenceOrder] || ""}
                onChange={(e) => handleApproverChange(step.sequenceOrder, e.target.value)}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select Approver</option>
                {step.users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )
        ))}

        <div className="mb-4">
          <label className="block text-sm font-medium">Type</label>
          <select name="typeId" value={formData.typeId} onChange={handleChange} required className="w-full border p-2 rounded">
            <option value="">Select Type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Price With Tax</label>
          <input type="number" name="priceWithTax" value={formData.priceWithTax} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Tax</label>
          <input type="number" name="tax" value={formData.tax} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Remarks</label>
          <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} required maxLength={250} className="w-full border p-2 rounded" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Upload Receipt</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border p-2 rounded" />
          <p className="text-xs text-gray-500 mt-1">Image should contain tax, date, name of vendor, and other necessary details.</p>
        </div>

        {preview && <img src={preview} alt="Preview" className="mt-2 rounded shadow-md w-full h-auto" />}

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Submit
        </button>
      </form>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to apply for this Expense?"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

export default ApplyVisa;
