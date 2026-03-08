import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiArrowLeft,
  FiBriefcase,
  FiHash,
  FiShield,
  FiSettings,
  FiGitBranch,
  FiUsers,
  FiAlertTriangle,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

const AddDepartment = () => {
  const [formData, setFormData] = useState({
    name: "",
    glCode: "",
    companyName: "",
    approvalType: "EXPENSE_APPROVAL",
    approvalSteps: [],
  });

  const [orgRoles, setOrgRoles] = useState([]);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFinanceWarning, setShowFinanceWarning] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [processors, setProcessors] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.company?.name) {
      setCompanyName(user.company.name);
      setFormData((prev) => ({ ...prev, companyName: user.company.name }));
      fetchOrgRoles(user.company.name, user.company.id);
      fetchCompanyParameters(user.company.name);
    }
  }, []);

  const fetchOrgRoles = async (companyName, companyId) => {
    try {
      const response = await ApiClient.get(`/org-roles?companyName=${companyName}`);
      const roles = response.data || [];
      setOrgRoles(roles);

      const finance = roles.find(
        (r) =>
          r.orgRoleDescription?.toLowerCase() === "finance" &&
          r.status === "ACTIVE"
      );

      if (!finance) {
        setShowFinanceWarning(true);
        return;
      }

      const defaultApprovers = roles
        .filter((r) => r.isDefault === 1 && r.status === "ACTIVE")
        .sort((a, b) => parseFloat(a.amountLimit) - parseFloat(b.amountLimit));

      const approvalSteps = defaultApprovers.map((role, index) => ({
        orgRoleId: role.id,
        scope: "",
        sequenceOrder: index + 1,
      }));

      setFormData((prev) => ({
        ...prev,
        approvalSteps,
      }));

      await fetchDefaultProcessor(companyId, roles);
    } catch (err) {
      setError("Failed to load organization roles.");
    }
  };

  const fetchCompanyParameters = async (companyName) => {
    try {
      const res = await ApiClient.get(`/config/parameters/${companyName}`);
      const params = res.data || [];

      const defaultProcessorParam = params.find(
        (p) => p.propertyId === "default_processor"
      );
      if (!defaultProcessorParam) return;

      const processorRole = orgRoles.find(
        (r) =>
          r.orgRoleDescription?.toLowerCase() ===
            defaultProcessorParam.propertyValue?.toLowerCase() &&
          r.status === "ACTIVE"
      );

      if (processorRole) {
        setProcessors([{ orgRoleId: processorRole.id, scope: "COMPANY" }]);
      }
    } catch (err) {
      console.error("Failed to fetch company parameters", err);
    }
  };

  const fetchDefaultProcessor = async (companyId, roles) => {
    try {
      const response = await ApiClient.get(
        `/config/parameters/by-key/id/${companyId}/default_processor`
      );
      const defaultProcessorValue = response.data?.propertyValue;
      if (!defaultProcessorValue) return;

      const matchingRole = roles.find(
        (r) =>
          r.orgRoleDescription?.toLowerCase() ===
          defaultProcessorValue.toLowerCase()
      );

      if (matchingRole) {
        setProcessors([{ orgRoleId: matchingRole.id, scope: "COMPANY" }]);
      }
    } catch {
      console.warn("Default processor parameter not found.");
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
    if (field === "orgRoleId") {
      const selectedRole = orgRoles.find((r) => r.id.toString() === value);
      if (
        selectedRole &&
        selectedRole.orgRoleDescription?.toLowerCase() === "finance approver"
      ) {
        setError(
          "Finance cannot be added to the approval workflow. It will be added automatically."
        );
        return;
      }
    }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setPendingRequest(formData);
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    const invalidStep = pendingRequest.approvalSteps.find(
      (step) => !step.orgRoleId || !step.scope
    );

    if (invalidStep) {
      setError(
        "Please complete all approval steps. Scope and Org Role must be selected."
      );
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const finalData = {
        ...pendingRequest,
        userId: localStorage.getItem("userId"),
        username: user.name,
        processors,
      };
      await ApiClient.post("/departments", finalData);
      navigate("/departments");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleProcessorChange = (index, field, value) => {
    setProcessors((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const roleLabel = (roleId) => {
    const role = orgRoles.find((r) => String(r.id) === String(roleId));
    return role
      ? `${role.orgRoleCode} - ${role.orgRoleDescription}`
      : "Select Org Role";
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <PageHeader
        eyebrow="Administration"
        title="Add Department"
        subtitle="Create a department and configure its approval workflow and processor routing."
      />

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      {showFinanceWarning && (
        <ErrorModal
          message="'Finance Approver' org role is either deactivated or not yet existing. Please contact your administrator."
          onClose={() => setShowFinanceWarning(false)}
        />
      )}

      <div className="mt-6 space-y-6">
        <SectionCard
          title="Department Details"
          subtitle="Set up the core department information used throughout the workflow."
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
                >
                  <option value="EXPENSE_APPROVAL">Expense Approval</option>
                </SelectField>
              </div>
            </div>

            <SectionCard
              title="Approval Steps"
              subtitle="Choose the org roles and scope that define the approval sequence."
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
                            Define the approver and scope for this step.
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
              subtitle="Define who will process this department after the approval path."
            >
              <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                Choose <strong>DEPARTMENT</strong> scope if the processor is within the department.
                Choose <strong>COMPANY</strong> scope if the processor is not within the department but within the company.
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
                            Select the org role and scope for this processor.
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
                        value={proc.scope || "COMPANY"}
                        onChange={(e) =>
                          handleProcessorChange(index, "scope", e.target.value)
                        }
                      >
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
                      { orgRoleId: null, scope: "COMPANY" },
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
                onClick={() => navigate("/departments")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                <FiArrowLeft />
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <FiSave />
                {loading ? "Creating..." : "Create Department"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to create this department?"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {showFinanceWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FiAlertTriangle className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Finance Org Role Missing
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  'Finance Approver' org role is either deactivated or not yet existing.
                  Please contact your administrator.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="rounded-2xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
                onClick={() => navigate("/departments")}
              >
                OK
              </button>
            </div>
          </div>
        </div>
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

function SelectField({ icon, label, children, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <span className="text-slate-400">{icon}</span>
        <select
          {...props}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

export default AddDepartment;
