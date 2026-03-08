import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiTag,
  FiHash,
  FiAlertCircle,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

const EditType = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    glCode: "",
    name: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchTypeDetails();
  }, []);

  const fetchTypeDetails = async () => {
    try {
      const response = await ApiClient.get(`/types/${id}`);
      const typeData = response.data;

      setFormData({
        glCode: typeData.glCode || "",
        name: typeData.name || "",
      });
    } catch (err) {
      setError("Failed to load type details.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId) {
      setError("User ID is missing. Please re-login.");
      setLoading(false);
      return;
    }

    const requestData = { ...formData, userId };

    try {
      await ApiClient.put(`/types/${id}`, requestData);
      setShowConfirmation(true);
    } catch (err) {
      setError(err.response?.data || "Failed to update type.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (
      window.confirm(
        "Are you sure you want to go back? Unsaved changes will be lost."
      )
    ) {
      navigate("/types");
    }
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Edit Type"
          subtitle="Update the purchase type details and associated GL code."
        />

        {error && (
          <div className="flex items-start gap-3 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <SectionCard
          title="Type Information"
          subtitle="Maintain the GL code and display name used in expense requests."
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  GL Code
                </label>

                <div className="relative">
                  <FiHash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    name="glCode"
                    value={formData.glCode}
                    onChange={handleChange}
                    required
                    placeholder="Example: 6200"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <p className="text-xs text-slate-500">
                  The GL code used for accounting classification.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Type Name
                </label>

                <div className="relative">
                  <FiTag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Example: Travel Expense"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <p className="text-xs text-slate-500">
                  A descriptive name shown to users when selecting this expense type.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FiArrowLeft />
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(37,99,235,0.32)] ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FiSave />
                {loading ? "Updating..." : "Update Type"}
              </button>
            </div>
          </form>
        </SectionCard>

        {showConfirmation && (
          <ConfirmationPopup
            message="Type updated successfully!"
            onConfirm={() => navigate("/types")}
          />
        )}
      </div>
    </div>
  );
};

export default EditType;
