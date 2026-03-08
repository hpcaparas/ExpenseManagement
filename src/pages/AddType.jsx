import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const AddType = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    glCode: "",
    name: "",
  });

  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    setPendingRequest(formData);
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!pendingRequest) return;

    setShowConfirmation(false);
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId) {
      setError("User ID is missing. Please re-login.");
      setLoading(false);
      return;
    }

    try {
      await ApiClient.post("/types", { ...pendingRequest, userId });
      navigate("/types");
    } catch (err) {
      setError(err.response?.data || "Failed to create type.");
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
          title="Create Type"
          subtitle="Define a new purchase type and associate it with a GL code for expense tracking."
        />

        {error && (
          <div className="flex items-start gap-3 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <SectionCard
          title="Type Information"
          subtitle="Enter the GL code and name that will be used across expense requests."
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
                  A descriptive name used by employees when selecting expense types.
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
                {loading ? "Creating..." : "Create Type"}
              </button>
            </div>
          </form>
        </SectionCard>

        {showConfirmation && (
          <ConfirmationPopup
            message="Are you sure you want to create this type?"
            onConfirm={confirmSubmit}
            onCancel={() => setShowConfirmation(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AddType;
