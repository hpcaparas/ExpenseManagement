import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEdit3,
  FiShield,
  FiDollarSign,
  FiArrowLeft,
  FiSave,
  FiCheckSquare,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import InfoTooltip from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import fieldHelpMessages from "../config/fieldHelpMessages";

const EditOrgRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    orgRoleCode: "",
    orgRoleDescription: "",
    companyName: "",
    amountLimit: 0,
    isDefault: false,
  });

  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          companyName: user.company?.name || "Default Company",
        }));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }

    fetchOrgRoleDetails();
  }, []);

  const fetchOrgRoleDetails = async () => {
    try {
      const companyName = JSON.parse(localStorage.getItem("user")).company.name;
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      const matched = response.data.find((role) => role.id === parseInt(id));

      if (!matched) throw new Error("Org Role not found");

      setFormData({
        orgRoleCode: matched.orgRoleCode,
        orgRoleDescription: matched.orgRoleDescription || "",
        companyName: matched.companyName,
        amountLimit: matched.amountLimit,
        isDefault: matched.isDefault,
      });
    } catch (error) {
      console.error("Error loading org role:", error);
      setError("Failed to load org role details.");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.orgRoleCode) {
      return setError("Org Role Code is required.");
    }

    setPendingRequest({
      ...formData,
      userId: localStorage.getItem("userId"),
    });
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      await ApiClient.put(`/org-roles/${id}`, pendingRequest);
      navigate("/orgRoles");
    } catch (err) {
      setError(err.response?.data || "Failed to update org role.");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (
      window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")
    ) {
      navigate("/orgRoles");
    }
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <PageHeader
        eyebrow="Administration"
        title="Edit Org Role"
        subtitle="Update org role settings such as amount limit and default approver behavior."
      />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <SectionCard title="Org Role Details">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid md:grid-cols-2 gap-4">

            <InputField
              icon={<FiShield />}
              label="Org Role Code"
              name="orgRoleCode"
              value={formData.orgRoleCode}
              onChange={handleChange}
              disabled
            />

            <InputField
              icon={<FiEdit3 />}
              label="Org Role Description"
              name="orgRoleDescription"
              value={formData.orgRoleDescription}
              onChange={handleChange}
              disabled
            />

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Amount Limit
                <InfoTooltip message={fieldHelpMessages.amountLimit} />
              </label>

              <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <FiDollarSign className="text-slate-400" />
                <input
                  type="text"
                  name="amountLimit"
                  value={formData.amountLimit}
                  onChange={handleChange}
                  className="w-full outline-none"
                />
              </div>
            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isDefault: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="inline-flex items-center gap-2">
                <FiCheckSquare className="text-slate-500" />
                Default Approver
                <InfoTooltip message={fieldHelpMessages.isDefaultApprover} />
              </span>
            </label>

            <p className="mt-2 text-sm text-slate-500">
              Mark this org role as a default approver when applicable.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <FiArrowLeft />
              Back
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <FiSave />
              {loading ? "Updating..." : "Update Org Role"}
            </button>
          </div>

        </form>
      </SectionCard>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to update this Org Role?"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

const InputField = ({
  icon,
  label,
  name,
  value,
  onChange,
  disabled = false,
}) => (
  <div>
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <div
      className={`mt-1 flex items-center gap-2 rounded-xl border px-3 py-2 ${
        disabled
          ? "border-slate-200 bg-slate-100 text-slate-500"
          : "border-slate-200 bg-white"
      }`}
    >
      {icon}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-transparent outline-none"
      />
    </div>
  </div>
);

export default EditOrgRole;
