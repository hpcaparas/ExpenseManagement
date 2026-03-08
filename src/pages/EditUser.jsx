import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiShield,
  FiBriefcase,
  FiUsers,
  FiSave,
  FiArrowLeft,
} from "react-icons/fi";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup";
import InfoTooltip from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import fieldHelpMessages from "../config/fieldHelpMessages";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    roleIds: [],
    departmentIds: [],
    companyId: "",
    orgRoleIds: [],
  });

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [orgRoles, setOrgRoles] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const init = async () => {
      const companyId = await fetchUserDetails();
      if (companyId) fetchMetadata(companyId);
    };
    init();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await ApiClient.get(`/users/${id}`);
      const userData = response.data;
      const companyId = userData.company ? userData.company.id : null;

      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        username: userData.username || "",
        email: userData.email || "",
        password: "",
        roleIds: userData.roles?.map((r) => r.id) || [],
        orgRoleIds: userData.orgRoles?.map((r) => r.id) || [],
        departmentIds: userData.departments?.map((d) => d.id) || [],
        companyId: companyId,
      }));

      return companyId;
    } catch (err) {
      setError("Failed to load user details.");
    }
  };

  const fetchMetadata = async (companyId) => {
    try {
      const [rolesRes, deptRes] = await Promise.all([
        ApiClient.get(`/roles/company/${companyId}`),
        ApiClient.get("/departments"),
      ]);

      setRoles(rolesRes.data || []);
      setDepartments(deptRes.data || []);

      const companyName = JSON.parse(localStorage.getItem("user")).company.name;
      const orgRoleRes = await ApiClient.get(
        `/org-roles?companyName=${companyName}`
      );

      setOrgRoles(orgRoleRes.data || []);
    } catch (err) {
      setError("Failed to load roles, departments or org roles.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (o) => Number(o.value));
    setFormData({ ...formData, [field]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await ApiClient.put(`/users/${id}`, formData);
      setShowPopup(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (
      window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")
    ) {
      navigate("/users");
    }
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <PageHeader
        eyebrow="Administration"
        title="Edit User"
        subtitle="Update user information, permissions, and organizational roles."
      />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <SectionCard title="User Details">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              icon={<FiUser />}
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />

            <InputField
              icon={<FiUser />}
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />

            <InputField
              icon={<FiMail />}
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <SelectMulti
            icon={<FiShield />}
            label="Permission"
            tooltip={fieldHelpMessages.userRole}
            options={roles}
            value={formData.roleIds}
            field="roleIds"
            onChange={handleMultiSelect}
            labelKey="description"
          />

          <SelectMulti
            icon={<FiUsers />}
            label="Org Role"
            tooltip={fieldHelpMessages.orgRole}
            options={orgRoles}
            value={formData.orgRoleIds}
            field="orgRoleIds"
            onChange={handleMultiSelect}
            labelKey="orgRoleDescription"
          />

          <SelectMulti
            icon={<FiBriefcase />}
            label="Department"
            tooltip={fieldHelpMessages.department}
            options={departments}
            value={formData.departmentIds}
            field="departmentIds"
            onChange={handleMultiSelect}
            labelKey="name"
          />

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
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </SectionCard>

      {showPopup && (
        <ConfirmationPopup
          message="User updated successfully!"
          onConfirm={() => navigate("/users")}
        />
      )}
    </div>
  );
};

const InputField = ({ icon, label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-slate-400">{icon}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-transparent outline-none"
      />
    </div>
  </div>
);

const SelectMulti = ({
  icon,
  label,
  tooltip,
  options,
  value,
  field,
  onChange,
  labelKey,
}) => (
  <div>
    <label className="flex items-center gap-2 font-semibold text-slate-700">
      {label}
      <InfoTooltip message={tooltip} />
    </label>

    <div className="mt-1 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2">
      <span className="mt-1 text-slate-400">{icon}</span>
      <select
        multiple
        value={value}
        onChange={(e) => onChange(e, field)}
        className="h-32 w-full bg-transparent outline-none"
      >
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item[labelKey]}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default EditUser;
