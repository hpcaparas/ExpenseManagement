import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUploadCloud,
  FiCreditCard,
  FiFileText,
  FiUsers,
  FiImage,
  FiBriefcase,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import ErrorModal from "../components/ErrorModal";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import Lottie from "lottie-react";
import loadingAnimation from "../images/lottie/lottie-loading-money.json";
import imageCompression from "browser-image-compression";

const ApplyVisa = () => {
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const [formData, setFormData] = useState({
    userId: "",
    departmentId: "",
    typeId: "",
    priceWithTax: "",
    tax: "",
    remarks: "",
    image: null,
    purchaseMethodId: "",
  });

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [purchaseMethods, setPurchaseMethods] = useState([]);
  const [approverSelections, setApproverSelections] = useState({});
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setFormData((prev) => ({ ...prev, userId: currentUser.id }));

      const [deptRes, typeRes, methodRes] = await Promise.all([
        ApiClient.get(`/departments/company?companyName=${currentUser.company?.name}`),
        ApiClient.get("/types"),
        ApiClient.get(`/purchase-methods?companyName=${currentUser.company?.name}`),
      ]);

      setDepartments(deptRes.data || []);
      setTypes(typeRes.data || []);
      setPurchaseMethods(methodRes.data || []);
    } catch (err) {
      setErrorMessage("Failed to load metadata.");
    }
  };

  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;

    setFormData((prev) => ({ ...prev, departmentId }));
    setWorkflowSteps([]);
    setApproverSelections({});

    if (!departmentId) return;

    try {
      const response = await ApiClient.get(
        `/departments/${departmentId}/workflow?approvalType=EXPENSE_APPROVAL`
      );

      const workflow = response.data || {};
      const steps = Array.isArray(workflow) ? workflow : workflow.steps || [];

      const updatedApproverSelections = {};

      for (const step of steps) {
        if (!step.users || step.users.length === 0) {
          setErrorMessage(
            `No approver found for org role ${step.orgRoleCode}. Please contact your administrator.`
          );
          return;
        }

        if (step.users.length === 1) {
          updatedApproverSelections[step.sequenceOrder] = step.users[0].id;
        }
      }

      setWorkflowSteps(steps);
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedBlob = await imageCompression(file, options);
      const fileName = `receipt_${Date.now()}.jpg`;
      const optimizedFile = new File([compressedBlob], fileName, {
        type: "image/jpeg",
      });

      setCompressedFile(optimizedFile);
      setPreview(URL.createObjectURL(optimizedFile));
    } catch (error) {
      console.error("Image compression failed:", error);
      setErrorMessage("Failed to compress image. Please try again.");
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

    const priceWithTax = Number(formData.priceWithTax);
    const finalSteps = [];

    for (const step of workflowSteps) {
      const stepAmountLimit = Number(step.amountLimit || 0);
      const isProcessor = step.stepType === "PROCESSING";

      if (isProcessor || priceWithTax > stepAmountLimit) {
        finalSteps.push({
          orgRoleId: step.orgRoleId,
          scope: step.scope,
          stepType: step.stepType,
          selectedUserId:
            step.users.length === 1
              ? step.users[0].id
              : approverSelections[step.sequenceOrder],
        });
      }
    }

    const formPayload = new FormData();

    Object.keys(pendingRequest).forEach((key) => {
      formPayload.append(key, pendingRequest[key]);
    });

    formPayload.append("approvalSteps", JSON.stringify(finalSteps));

    try {
      await ApiClient.post("/visa", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/visa/visas");
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to apply for Expense.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDepartmentName =
    departments.find((d) => String(d.id) === String(formData.departmentId))?.name || "Not selected";

  const selectedTypeName =
    types.find((t) => String(t.id) === String(formData.typeId))?.name || "Not selected";

  const selectedPurchaseMethod =
    purchaseMethods.find((m) => String(m.id) === String(formData.purchaseMethodId))?.description ||
    "Not selected";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Expense Application"
        title="Apply for Expense"
        subtitle="Create a new expense request, attach your receipt, and route it through the correct approval workflow."
      />

      {errorMessage && (
        <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="rounded-[28px] border border-white/10 bg-slate-900/90 px-8 py-6 shadow-2xl">
            <Lottie
              animationData={loadingAnimation}
              loop
              className="h-40 w-40"
            />
            <p className="mt-2 text-center text-sm text-white/80">
              Submitting your expense request...
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <SectionCard
          title="Expense Details"
          subtitle="Provide the purchase information and assign the proper approval flow."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <PremiumField
              label="Name"
              icon={<FiUsers />}
              value={currentUser?.name || ""}
              disabled
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Method of Purchase
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {purchaseMethods.map((method) => {
                  const active = formData.purchaseMethodId === String(method.id);

                  return (
                    <label
                      key={method.id}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        active
                          ? "border-blue-400 bg-blue-50 shadow-[0_8px_25px_rgba(59,130,246,0.12)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="purchaseMethodId"
                          value={method.id}
                          checked={active}
                          onChange={handleChange}
                          required
                          className="h-4 w-4 accent-blue-600"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {method.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            Select how the purchase was made
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <PremiumSelect
              label="Department"
              name="departmentId"
              icon={<FiBriefcase />}
              value={formData.departmentId}
              onChange={handleDepartmentChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </PremiumSelect>

            <PremiumSelect
              label="Type"
              name="typeId"
              icon={<FiCreditCard />}
              value={formData.typeId}
              onChange={handleChange}
              required
            >
              <option value="">Select Purchase Type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </PremiumSelect>

            <PremiumField
              label="Price With Tax"
              name="priceWithTax"
              type="number"
              value={formData.priceWithTax}
              onChange={handleChange}
              required
            />

            <PremiumField
              label="Tax"
              name="tax"
              type="number"
              value={formData.tax}
              onChange={handleChange}
              required
            />

            <div className="md:col-span-2">
              <PremiumTextarea
                label="Remarks / Receipt Name"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                required
                maxLength={250}
                helperText={`${formData.remarks.length}/250 characters`}
              />
            </div>
          </div>

          {workflowSteps.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FiUsers />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Approval Routing
                  </h3>
                  <p className="text-sm text-slate-500">
                    Choose an approver only when multiple users match the same org role.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {workflowSteps.map(
                  (step) =>
                    step.users.length > 1 && (
                      <div
                        key={step.sequenceOrder}
                        className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4"
                      >
                        <div className="mb-3">
                          <div className="text-sm font-semibold text-slate-900">
                            Step {step.sequenceOrder} · {step.orgRoleDescription}
                          </div>
                          <p className="mt-1 text-sm text-amber-700">
                            Multiple users share this org role in the selected department or company.
                            Please choose one approver.
                          </p>
                        </div>

                        <PremiumSelect
                          label="Select Approver"
                          value={approverSelections[step.sequenceOrder] || ""}
                          onChange={(e) =>
                            handleApproverChange(step.sequenceOrder, e.target.value)
                          }
                          required
                        >
                          <option value="">Select Approver</option>
                          {step.users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </PremiumSelect>
                      </div>
                    )
                )}
              </div>
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Receipt Upload"
            subtitle="Upload a clear image of your receipt for validation and audit."
          >
            <label className="group block cursor-pointer rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                <FiUploadCloud className="text-2xl" />
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-900">
                  Upload Receipt
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Include tax, vendor name, date, and other key purchase details.
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {preview ? (
              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <FiImage className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Receipt Preview
                  </span>
                </div>
                <img
                  src={preview}
                  alt="Preview"
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <FiFileText />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No receipt uploaded yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Your uploaded image preview will appear here.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Request Summary"
            subtitle="Review the key details before submitting."
          >
            <SummaryRow label="Employee" value={currentUser?.name || "-"} />
            <SummaryRow label="Department" value={selectedDepartmentName} />
            <SummaryRow label="Purchase Method" value={selectedPurchaseMethod} />
            <SummaryRow label="Type" value={selectedTypeName} />
            <SummaryRow
              label="Price With Tax"
              value={formData.priceWithTax ? Number(formData.priceWithTax).toFixed(2) : "-"}
            />
            <SummaryRow
              label="Tax"
              value={formData.tax ? Number(formData.tax).toFixed(2) : "-"}
            />
            <SummaryRow
              label="Workflow Steps"
              value={workflowSteps.length ? `${workflowSteps.length} step(s)` : "Not loaded"}
              noBorder
            />

            <div className="mt-6">
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(37,99,235,0.32)]"
              >
                Submit Expense Request
              </button>
            </div>
          </SectionCard>
        </div>
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

function PremiumField({
  label,
  icon,
  helperText,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100"
        }`}
      >
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <input
          {...props}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function PremiumSelect({ label, icon, children, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
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

function PremiumTextarea({
  label,
  helperText,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        {...props}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      {helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value, noBorder = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 ${
        noBorder ? "" : "border-b border-slate-200"
      }`}
    >
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">
        {value}
      </span>
    </div>
  );
}

export default ApplyVisa;