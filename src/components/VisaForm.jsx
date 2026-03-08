import React, { useEffect, useState } from "react";
import ApiClient from "../utils/ApiClient";
import ErrorModal from "./ErrorModal";

const VisaForm = ({ initialValues = {}, onSubmit, isSubmitting, isResubmission }) => {
  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [formData, setFormData] = useState({
    userId: JSON.parse(localStorage.getItem("user")).id,
    departmentId: "",
    typeId: "",
    priceWithTax: "",
    tax: "",
    remarks: "",
    image: null,
    approvalSteps: [],
    ...initialValues,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [deptRes, typeRes] = await Promise.all([
        ApiClient.get("/department"),
        ApiClient.get("/type")
      ]);
      setDepartments(deptRes.data);
      setTypes(typeRes.data);
    } catch (err) {
      setError("Failed to load dropdown data.");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      {isResubmission && (
        <div className="text-blue-600 font-semibold">Resubmission Mode</div>
      )}

      <div>
        <label className="block mb-1">Department</label>
        <select
          name="departmentId"
          value={formData.departmentId}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Type</label>
        <select
          name="typeId"
          value={formData.typeId}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        >
          <option value="">Select Type</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Price with Tax</label>
        <input
          type="number"
          name="priceWithTax"
          value={formData.priceWithTax}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Tax</label>
        <input
          type="number"
          name="tax"
          value={formData.tax}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block mb-1">Upload Image</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full"
        />
        {formData.imageFilename && !formData.image && (
          <p className="text-sm text-gray-500 mt-1">Previously uploaded image: {formData.imageFilename}</p>
        )}
      </div>

      {/* ApprovalSteps logic can be extended later */}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};

export default VisaForm;
