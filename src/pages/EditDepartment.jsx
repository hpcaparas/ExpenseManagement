import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiBriefcase,
  FiHash,
  FiSettings,
  FiGitBranch,
  FiUsers,
  FiShield,
  FiTrash2,
  FiPlus,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    glCode: "",
    companyName: "",
    approvalType: "EXPENSE_APPROVAL",
    approvalSteps: [],
  });

  const [orgRoles, setOrgRoles] = useState([]);
  const [error, setError] = useState("");
  const [processors, setProcessors] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.company?.name) {
      setFormData((prev) => ({ ...prev, companyName: user.company.name }));
      fetchOrgRoles(user.company.name);
    }
    fetchDepartment();
  }, []);

  const fetchOrgRoles = async (companyName) => {
    try {
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      setOrgRoles(response.data || []);
    } catch (err) {
      setError("Failed to load org roles.");
    }
  };

  const fetchDepartment = async () => {
    try {
      const res = await ApiClient.get(`/departments/${id}`);
      const dept = res.data;

      setFormData((prev) => ({
        ...prev,
        name: dept.name,
        glCode: dept.glCode,
        approvalType: dept.approvalType || "EXPENSE_APPROVAL",
        approvalSteps: (dept.approvalSteps || []).map((step) => ({
          orgRoleId: step.orgRoleId,
          sequenceOrder: step.sequenceOrder,
          scope: step.scope || "",
        })),
      }));

      setProcessors(dept.processors || []);
    } catch (err) {
      setError("Failed to fetch department.");
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
          orgRoleId: null,
          scope: "",
          sequenceOrder: prevState.approvalSteps.length + 1,
        },
      ],
    }));
  };

  const handleApprovalStepChange = (index, field, value) => {
    setFormData((prevState) => {
      const updatedSteps = [...prevState.approvalSteps];
      updatedSteps[index][field] = value;
      return { ...prevState, approvalSteps: updatedSteps };
    });
  };

  const removeApprovalStep = (index) => {
    const updated = formData.approvalSteps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, sequenceOrder: i + 1 }));
    setFormData({ ...formData, approvalSteps: updated });
  };

  const handleProcessorChange = (index, field, value) => {
    setProcessors((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalData = {
      ...formData,
      processors,
      userId: localStorage.getItem("userId"),
      username: JSON.parse(localStorage.getItem("user"))?.name,
    };

    try {
      setLoading(true);
      await ApiClient.put(`/departments/${id}`, finalData);
      setShowConfirmation(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update department.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.confirm("Discard changes and go back?")) {
      navigate("/departments");
    }
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <PageHeader
        eyebrow="Administration"
        title="Edit Department"
        subtitle="Update the department record, approval routing, and processor assignments."
      />

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      <div className="mt-6 space-y-6">
        <SectionCard
          title="Department Details"
          subtitle="Maintain the core information used throughout the workflow."
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                icon={<FiBriefcase />}
                label="Department Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Field
                icon={<FiHash />}
                label="GL Code"
                name="glCode"
                value={formData.glCode}
                onChange={handleChange}
                required
              />

              <div className="md:col-span-2">
                <SelectField
                  icon={<FiSettings />}
                  label="Approval Type"
                  name="approvalType"
                  value={formData.approvalType}
                  onChange={handleChange}
                  disabled
                >
                  <option value="EXPENSE_APPROVAL">Expense Approval</option>
                </SelectField>
              </div>
            </div>

            <SectionCard
              title="Approval Steps"
              subtitle="Define the ordered approval workflow for this department."
            >
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Choose <strong>DEPARTMENT</strong> scope if the approver is within the department.
                Choose <strong>COMPANY</strong> scope if the approver is outside the department but within the company.
              </div>

              <div className="space-y-4">
                {formData.approvalSteps.map((step, index) => (
                  <div
                    key={index}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                          <FiGitBranch />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Step {index + 1}
                          </div>
                          <div className="text-xs text-slate-500">
                            Set the org role and scope for this stage.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeApprovalStep(index)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        icon={<FiShield />}
                        label="Org Role"
                        value={step.orgRoleId || ""}
                        onChange={(e) =>
                          handleApprovalStepChange(index, "orgRoleId", e.target.value)
                        }
                      >
                        <option value="">Select Org Role</option>
                        {orgRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.orgRoleCode} - {role.orgRoleDescription}
                          </option>
                        ))}
                      </SelectField>

                      <SelectField
                        icon={<FiUsers />}
                        label="Scope"
                        value={step.scope || ""}
                        onChange={(e) =>
                          handleApprovalStepChange(index, "scope", e.target.value)
                        }
                      >
                        <option value="">-- Select Scope --</option>
                        <option value="DEPARTMENT">DEPARTMENT</option>
                        <option value="COMPANY">COMPANY</option>
                      </SelectField>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={addApprovalStep}
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  <FiPlus />
                  Add Step
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Processor(s)"
              subtitle="Manage the processor roles assigned to this department."
            >
              <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                Choose <strong>DEPARTMENT</strong> scope if the processor is within the department.
                Choose <strong>COMPANY</strong> scope if the processor is outside the department but within the company.
              </div>

              {processors.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No processor selected.
                </div>
              )}

              <div className="space-y-4">
                {processors.map((proc, index) => (
                  <div
                    key={index}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                          <FiUsers />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Processor {index + 1}
                          </div>
                          <div className="text-xs text-slate-500">
                            Define the org role and scope for this processor.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setProcessors((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        icon={<FiShield />}
                        label="Org Role"
                        value={proc.orgRoleId || ""}
                        onChange={(e) =>
                          handleProcessorChange(index, "orgRoleId", e.target.value)
                        }
                      >
                        <option value="">Select Org Role</option>
                        {orgRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.orgRoleCode} - {role.orgRoleDescription}
                          </option>
                        ))}
                      </SelectField>

                      <SelectField
                        icon={<FiUsers />}
                        label="Scope"
                        value={proc.scope || ""}
                        onChange={(e) =>
                          handleProcessorChange(index, "scope", e.target.value)
                        }
                      >
                        <option value="">-- Select Scope --</option>
                        <option value="DEPARTMENT">DEPARTMENT</option>
                        <option value="COMPANY">COMPANY</option>
                      </SelectField>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setProcessors((prev) => [
                      ...prev,
                      { orgRoleId: null, scope: "" },
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  <FiPlus />
                  Add Processor
                </button>
              </div>
            </SectionCard>

            <div className="flex justify-center gap-3 pt-2">
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
                {loading ? "Updating..." : "Update Department"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {showConfirmation && (
        <ConfirmationPopup
          message="Department updated successfully!"
          onConfirm={() => navigate("/departments")}
        />
      )}
    </div>
  );
};

function Field({
  icon,
  label,
  name,
  value,
  onChange,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <span className="text-slate-400">{icon}</span>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
      </div>
    </div>
  );
}

function SelectField({ icon, label, children, disabled = false, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
        disabled
          ? "border-slate-200 bg-slate-100"
          : "border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100"
      }`}>
        <span className="text-slate-400">{icon}</span>
        <select
          {...props}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

export default EditDepartment;
