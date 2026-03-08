import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ErrorModal from "../components/ErrorModal";
import ConfirmationPopup from "../components/ConfirmationPopup";
import Lottie from "lottie-react";
import loadingAnimation from "../images/lottie/lottie-loading-money.json";
import imageCompression from "browser-image-compression";
import config from "../config/config";

const EditVisa = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [preview, setPreview] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [user, setUser] = useState(null);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [approverSelections, setApproverSelections] = useState({});
  const [originalImageFilename, setOriginalImageFilename] = useState(null);

  useEffect(() => {
    const user_ = JSON.parse(localStorage.getItem("user"));
    if (user_) {
      setUser(user_);
      setFormData((prev) => ({ ...prev, userId: user_.id }));
      fetchMetadata(user_);
    }
  }, []);  

  useEffect(() => {
    if (user) {
      fetchVisa(); // Call only after user is definitely available
    }
  }, [user]);

  const fetchMetadata = async (user_) => {
    try {
      const [deptRes, typeRes] = await Promise.all([
        ApiClient.get(`/departments/company?companyName=${user_.company.name}`),
        ApiClient.get("/types"),
      ]);
      setDepartments(deptRes.data);
      setTypes(typeRes.data);
    } catch (err) {
      setErrorMessage("Failed to load metadata.");
    }
  };

  const fetchVisa = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.get(`/visa/${id}`);
      const visa = res.data;
      setFormData({
        userId: user.id,
        departmentId: visa.department.id,
        typeId: visa.type.id,
        priceWithTax: visa.priceWithTax,
        tax: visa.tax,
        remarks: visa.remarks,
        image: null,
      });
      setStatus(visa.status);
      await fetchWorkflow(visa.department.id, visa.priceWithTax);
      setPreview(visa.imageFilename ? `${config.baseUrl}uploads/${visa.imageFilename}` : null);
      setOriginalImageFilename(visa.imageFilename);
    } catch (err) {
      console.log(err);
      setErrorMessage("Failed to load application data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflow = async (deptId, price) => {
    try {
      const response = await ApiClient.get(`/departments/${deptId}/workflow?approvalType=EXPENSE_APPROVAL`);
      const workflow = response.data;
  
      const selections = {};
      for (let step of workflow) {
        if (step.users.length === 0) {
          setErrorMessage(`No approver found for org role ${step.orgRoleCode}`);
          return;
        } else if (step.users.length === 1) {
          selections[step.sequenceOrder] = step.users[0].id;
        }
      }
  
      setWorkflowSteps(workflow);
      setApproverSelections(selections);
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to fetch workflow");
    }
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
      setErrorMessage("Failed to compress image. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });
      if (compressedFile) {
        formDataObj.set("image", compressedFile);
      } else if (originalImageFilename) {
        formDataObj.set("imageFilename", originalImageFilename); // 👈 Include this in backend
      }

      const priceWithTax = Number(formData.priceWithTax);
      let finalSteps = [];

      for (let step of workflowSteps) {
        const stepAmountLimit = Number(step.amountLimit || 0);
        const isProcessor = step.stepType === 'PROCESSING';

        if (isProcessor || priceWithTax > stepAmountLimit) {
          finalSteps.push({
            orgRoleId: step.orgRoleId,
            scope: step.scope,
            stepType: step.stepType,
            selectedUserId: step.users.length === 1
              ? step.users[0].id
              : approverSelections[step.sequenceOrder]
          });
        }
      }

      formDataObj.append("approvalSteps", JSON.stringify(finalSteps));


      await ApiClient.put(`/visa/${id}`, formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/visa/visas");
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to update application.");
    } finally {
      setLoading(false);
    }
  };

  // Status check for edit permission
  if (status && !["DECLINED", "RETURNED_BY_FINANCE", "CANCELLED"].includes(status)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Edit Application</h1>
        <p className="text-red-500">This application cannot be edited unless it is <b>Rejected</b>, <b>Returned by Finance</b> or <b>Cancelled</b>.</p>
        <button onClick={() => navigate("/visa/visas")} className="mt-4 px-4 py-2 bg-gray-400 text-white rounded">
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Expense Application</h1>

      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />}

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Lottie animationData={loadingAnimation} width={200} height={200} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <div className="mb-4">
          <label className="block text-sm font-medium">Department</label>
          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {workflowSteps.map((step) => (
          step.users.length > 1 && (
            <div key={step.sequenceOrder} className="mb-4">
              <label className="block text-sm font-medium">
                Select Approver for Step {step.sequenceOrder} ({step.orgRoleDescription})
              </label>
              <select
                value={approverSelections[step.sequenceOrder] || ""}
                onChange={(e) =>
                  setApproverSelections((prev) => ({
                    ...prev,
                    [step.sequenceOrder]: e.target.value,
                  }))
                }
                required
                className="w-full border p-2 rounded"
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
          <select
            name="typeId"
            value={formData.typeId}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Price With Tax</label>
          <input
            type="number"
            name="priceWithTax"
            value={formData.priceWithTax}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Tax</label>
          <input
            type="number"
            name="tax"
            value={formData.tax}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Remarks</label>
          <input
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            required
            maxLength={250}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Upload Receipt</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">Image should contain tax, date, name of vendor, and other necessary details.</p>
        </div>

        {preview && (
          <img src={preview} alt="Receipt Preview" className="mt-2 rounded shadow-md w-full h-auto" />
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate("/visa/visas")}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Back
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Resubmit
          </button>
        </div>
      </form>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to resubmit this application?"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

export default EditVisa;
