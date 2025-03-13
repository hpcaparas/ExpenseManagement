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
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Error modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [maxUploadSize, setMaxUploadSize] = useState(5 * 1024 * 1024); // Default 5MB
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);

  useEffect(() => {
    fetchMetadata();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await ApiClient.get("/visa/config"); // ✅ Fetch max upload size
      setMaxUploadSize(response.data.maxUploadSize);
    } catch (err) {
      console.error("Failed to load config, using default max size.");
    }
  };

  const fetchMetadata = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      setFormData((prev) => ({ ...prev, userId: user.id }));

      const [deptRes, typeRes] = await Promise.all([
        ApiClient.get(`/departments/assigned?userId=${user.id}`),
        ApiClient.get("/types"),
      ]);

      setDepartments(deptRes.data);
      setTypes(typeRes.data);

      if (deptRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, departmentId: deptRes.data[0].id }));
      }
    } catch (err) {
      setErrorMessage("Failed to load metadata.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      try {
        // ✅ Compress image before storing
        const options = {
          maxSizeMB: 1, // ✅ Compress image to max 1MB
          maxWidthOrHeight: 1024, // ✅ Resize image to max 1024x1024 pixels
          useWebWorker: true, // ✅ Use Web Workers for better performance
        };

        const compressedBlob = await imageCompression(file, options);
        console.log("Original file size:", (file.size / 1024 / 1024).toFixed(2), "MB");
        console.log("Compressed file size:", (compressedBlob.size / 1024 / 1024).toFixed(2), "MB");

        // ✅ Convert Blob to .jpg File
        const fileName = `receipt_${Date.now()}.jpg`; // Ensure a proper .jpg extension
        const compressedFile = new File([compressedBlob], fileName, { type: "image/jpeg" });

        setCompressedFile(compressedFile); // ✅ Store the compressed .jpg file
        setPreview(URL.createObjectURL(compressedFile)); // ✅ Preview compressed image
      } catch (error) {
        console.error("Image compression failed:", error);
        alert("Failed to compress image. Please try again.");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    // ✅ Store the request data and show confirmation modal
    setPendingRequest({ ...formData, image: compressedFile });
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!pendingRequest) return;

    setShowConfirmation(false);
    setLoading(true);

    const formDataObj = new FormData();
    Object.keys(pendingRequest).forEach((key) => {
      formDataObj.append(key, pendingRequest[key]);
    });

    try {
      await ApiClient.post("/visa", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/visa/visas"); // ✅ Redirect after success
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to apply for visa.");
    }finally{
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
      <h1 className="text-2xl font-bold mb-4">Apply for Visa</h1>

      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />}

       {/* 🔥 Full-screen Loading Overlay */}
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
          <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className="w-full border p-2 rounded">
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

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
        </div>

        {preview && <img src={preview} alt="Preview" className="mt-2 rounded shadow-md w-full h-auto" />}

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Submit
        </button>
      </form>

      {/* ✅ Confirmation Popup */}
      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to apply for this visa?"
          onConfirm={confirmSubmit} // ✅ Proceed with API call
          onCancel={() => setShowConfirmation(false)} // ❌ Cancel action
        />
      )}
    </div>
  );
};

export default ApplyVisa;
