import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApiClient from "../utils/ApiClient";
import ConfirmationPopup from "../components/ConfirmationPopup"; // ✅ Import ConfirmationPopup

const EditUser = () => {
    const { id } = useParams(); // ✅ Get user ID from URL
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        roleIds: [],
        departmentIds: [],
        companyId: "",
    });

    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMetadata();
        fetchUserDetails();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [rolesRes, deptRes] = await Promise.all([
                ApiClient.get("/roles"),
                ApiClient.get("/departments"),
            ]);
            setRoles(rolesRes.data);
            setDepartments(deptRes.data);
        } catch (err) {
            setError("Failed to load roles or departments.");
        }
    };

    const fetchUserDetails = async () => {
        try {
            const response = await ApiClient.get(`/users/${id}`);
            const userData = response.data;
    
            setFormData((prevState) => ({
                ...prevState,
                name: userData.name || "",
                username: userData.username || "",
                email: userData.email || "",
                password: "", // ✅ Keep password empty unless updating
                roleIds: userData.roles ? userData.roles.map((role) => role.id) : [],
                departmentIds: userData.departments ? userData.departments.map((dept) => dept.id) : [],
                companyId: userData.company ? userData.company.id : null, // ✅ Safely handle missing `company`
            }));
        } catch (err) {
            setError("Failed to load user details.");
        }
    };
    
    

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMultiSelect = (e, field) => {
        const selectedValues = Array.from(e.target.selectedOptions, (option) =>
            Number(option.value)
        );
        setFormData({ ...formData, [field]: selectedValues });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await ApiClient.put(`/users/${id}`, formData);
            setShowPopup(true); // ✅ Show confirmation popup
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update user.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
            navigate("/users");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Edit User</h1>

            {error && <p className="text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
                <div className="mb-4">
                    <label className="block text-sm font-medium">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Password (Optional)</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave empty to keep existing password"
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Roles</label>
                    <select
                        name="roleIds"
                        multiple
                        value={formData.roleIds.length > 0 ? formData.roleIds : []} // ✅ Ensure roles are preselected
                        onChange={(e) => handleMultiSelect(e, "roleIds")}
                        required
                        className="w-full border p-2 rounded"
                    >
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>

                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Departments</label>
                    <select
                        name="departmentIds"
                        multiple
                        value={formData.departmentIds.length > 0 ? formData.departmentIds : []} // ✅ Ensure departments are preselected
                        onChange={(e) => handleMultiSelect(e, "departmentIds")}
                        required
                        className="w-full border p-2 rounded"
                    >
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>

                </div>

                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                    >
                        Back
                    </button>
                    &nbsp;
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        {loading ? "Updating..." : "Update User"}
                    </button>
                </div>
            </form>

            {/* ✅ Confirmation Popup */}
            {showPopup && (
                <ConfirmationPopup
                    message="User updated successfully!"
                    onConfirm={() => navigate("/users")}
                />
            )}
        </div>
    );
};

export default EditUser;
