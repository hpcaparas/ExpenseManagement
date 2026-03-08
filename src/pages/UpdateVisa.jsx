import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ErrorModal from "../components/ErrorModal";
import ConfirmationPopup from "../components/ConfirmationPopup";
import config from "../config/config";
import imageCompression from "browser-image-compression";

const UpdateVisa = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [approverSelections, setApproverSelections] = useState({});
  const [formData, setFormData] = useState({});
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [originalImageFilename, setOriginalImageFilename] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [purchaseMethods, setPurchaseMethods] = useState([]);

  useEffect(() => {
    const user_ = JSON.parse(localStorage.getItem("user"));
    if (user_) {
      setUser(user_);
      fetchMetadata(user_);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchVisaDetails();
    }
  }, [user]);

  const fetchMetadata = async (user_) => {
    try {
      const [deptRes, typeRes, methodRes] = await Promise.all([
        ApiClient.get(`/departments/company?companyName=${user_.company.name}`),
        ApiClient.get("/types"),
        ApiClient.get(`/purchase-methods?companyName=${user_.company.name}`), 
      ]);
      setDepartments(deptRes.data);
      setTypes(typeRes.data);
      setPurchaseMethods(methodRes.data);
    } catch (err) {
      setError("Failed to load metadata.");
    }
  };

  const fetchVisaDetails = async () => {
    try {
      const res = await ApiClient.get(`/visa/${id}`);
      const visa = res.data;
      setFormData({
        userId: user.id,
        parentApplicationId: visa.id,
        departmentId: visa.department.id,
        typeId: visa.type.id,
        priceWithTax: visa.priceWithTax,
        tax: visa.tax,
        remarks: visa.remarks,
        image: null,
        purchaseMethodId:visa.purchaseMethod.id,
      });
      setOriginalImageFilename(visa.imageFilename);
      setPreview(visa.imageFilename ? `${config.baseUrl}uploads/${visa.imageFilename}` : null);
      fetchWorkflow(visa.department.id, visa.priceWithTax);
    } catch (err) {
      setError("Failed to load visa details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflow = async (deptId, price) => {
    try {
      const response = await ApiClient.get(`/departments/${deptId}/workflow?approvalType=EXPENSE_APPROVAL`);
      const steps = response.data;
      const selections = {};
      for (let step of steps) {
        if (step.users.length === 1) {
          selections[step.sequenceOrder] = step.users[0].id;
        }
      }
      setWorkflowSteps(steps);
      setApproverSelections(selections);
    } catch (err) {
      setError("Failed to load approval workflow.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedBlob = await imageCompression(file, options);
      const newFile = new File([compressedBlob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
      setCompressedFile(newFile);
      setPreview(URL.createObjectURL(newFile));
    } catch (err) {
      setError("Image compression failed.");
    }
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
  
    try {
      const formPayload = new FormData();
  
      formPayload.append("userId", formData.userId);
      formPayload.append("departmentId", formData.departmentId);
      formPayload.append("typeId", formData.typeId);
      formPayload.append("priceWithTax", formData.priceWithTax);
      formPayload.append("tax", formData.tax);
      formPayload.append("remarks", formData.remarks);
      formPayload.append("purchaseMethodId", formData.purchaseMethodId)
  
      // Approval steps (as JSON string)
      const priceWithTax = Number(formData.priceWithTax);
      const finalSteps = workflowSteps
        .filter(step => step.stepType === "PROCESSING" || priceWithTax > Number(step.amountLimit || 0))
        .map(step => ({
          orgRoleId: step.orgRoleId,
          scope: step.scope,
          stepType: step.stepType,
          selectedUserId: step.users.length === 1 ? step.users[0].id : approverSelections[step.sequenceOrder],
        }));
  
      formPayload.append("approvalSteps", JSON.stringify(finalSteps));
  
      // 🟡 Image handling: compress new or keep existing
      if (compressedFile) {
        formPayload.append("image", compressedFile);
      } else if (originalImageFilename) {
        formPayload.append("imageFilename", originalImageFilename);
      }
  
      // 🔵 Submit as multipart/form-data
      await ApiClient.post(`/visa/resubmit/${formData.parentApplicationId}`, formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      navigate("/visa/visas");
    } catch (err) {
      console.error(err);
      setError("Failed to resubmit application.");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Resubmit Visa Application</h1>
      <p className="text-sm text-gray-600 italic mb-4">This is a resubmission. Your previous application will be retained for historical tracking.</p>

      {error && <ErrorModal message={error} onClose={() => setError("")} />}
      {loading ? <p>Loading...</p> : (
        <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }} className="bg-white p-6 shadow-md rounded">
          
          {!loading && purchaseMethods.length > 0 && (
            <div className="flex gap-4">
              {purchaseMethods.map((method) => (
                <label key={method.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="purchaseMethodId"
                    value={method.id}
                    checked={formData.purchaseMethodId === method.id}
                    onChange={handleChange}
                    required
                  />
                  {method.description}
                </label>
              ))}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Department</label>
            <select
              name="departmentId"
              value={formData.departmentId || ""}
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
                <span className="text-yellow-600 font-semibold">
                  You are seeing this because multiple users have the same org role in the Department/Company.
                </span>
                <select
                  value={approverSelections[step.sequenceOrder] || ""}
                  onChange={(e) =>
                    setApproverSelections((prev) => ({ ...prev, [step.sequenceOrder]: e.target.value }))
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
              value={formData.typeId || ""}
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
              value={formData.priceWithTax || ""}
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
              value={formData.tax || ""}
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
              value={formData.remarks || ""}
              onChange={handleChange}
              maxLength={250}
              required
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
            {preview && <img src={preview} alt="Preview" className="mt-2 rounded shadow w-full h-auto" />}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/visa/visas")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={isSubmitting}
            >
              Resubmit
            </button>
          </div>
        </form>
      )}

      {showConfirm && (
        <ConfirmationPopup
          message="Are you sure you want to resubmit this application?"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default UpdateVisa;
