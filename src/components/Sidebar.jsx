import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiFile,
} from "react-icons/fi";
import { MdApproval, MdOutlineReport } from "react-icons/md";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isVisaOpen, setIsVisaOpen] = useState(false);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRoles(user.roles.map((role) => role.name)); // Extract role names
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Function to check if user has a role
  const hasRole = (role) => userRoles.includes(role);

  return (
    <>
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex flex-col bg-gray-900 text-white h-full w-64 pt-16 p-4 z-20 relative">
        <SidebarContent
          isAdminOpen={isAdminOpen}
          setIsAdminOpen={setIsAdminOpen}
          isApprovalOpen={isApprovalOpen}
          setIsApprovalOpen={setIsApprovalOpen}
          isVisaOpen={isVisaOpen}
          setIsVisaOpen={setIsVisaOpen}
          hasRole={hasRole}
        />
      </div>

      {/* Sidebar for Mobile (conditionally shown) */}
      <div
        className={`fixed inset-0 bg-gray-900 text-white w-64 h-full z-30 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 text-white text-xl"
        >
          ✕
        </button>
        <SidebarContent
          isAdminOpen={isAdminOpen}
          setIsAdminOpen={setIsAdminOpen}
          isApprovalOpen={isApprovalOpen}
          setIsApprovalOpen={setIsApprovalOpen}
          isVisaOpen={isVisaOpen}
          setIsVisaOpen={setIsVisaOpen}
          toggleSidebar={toggleSidebar}
          hasRole={hasRole}
        />
      </div>
    </>
  );
};

const SidebarContent = ({
  isAdminOpen,
  setIsAdminOpen,
  isApprovalOpen,
  setIsApprovalOpen,
  isVisaOpen,
  setIsVisaOpen,
  toggleSidebar, // ✅ Receive toggleSidebar function
  hasRole,
}) => (
  <div className="mt-6">
    {/* Home */}
    <Link
      to="/dashboard"
      className="flex items-center p-3 hover:bg-gray-700 rounded"
      onClick={toggleSidebar} // ✅ Close menu when clicked
    >
      <FiHome className="mr-2" />
      Home
    </Link>

    {/* Admin (Dropdown with Expand/Collapse Indicator) */}
    {hasRole("Admin") && (
      <div className="relative">
        <button
          className="flex items-center justify-between w-full p-3 hover:bg-gray-700 rounded focus:outline-none"
          onClick={() => setIsAdminOpen(!isAdminOpen)}
        >
          <span className="flex items-center">
            <FiUsers className="mr-2" />
            Admin
          </span>
          {isAdminOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {isAdminOpen && (
          <div className="ml-6 mt-2 space-y-2">
            <Link to="/users" className="block hover:text-gray-300" onClick={toggleSidebar}>
              User Maintenance
            </Link>
            <Link to="/orgRoles" className="block hover:text-gray-300" onClick={toggleSidebar}>
              Org Roles Maintenance
            </Link>
            <Link to="/departments" className="block hover:text-gray-300" onClick={toggleSidebar}>
              Department Maintenance
            </Link>
            <Link to="/types" className="block hover:text-gray-300" onClick={toggleSidebar}>
              Type Maintenance
            </Link>
            <Link to="/adminPasswordReset" className="block hover:text-gray-300" onClick={toggleSidebar}>
              Password Reset
            </Link>
          </div>
        )}
      </div>
    )}

    {/* Approval (Dropdown with Expand/Collapse Indicator) */}
    <div className="relative">
      <button
        className="flex items-center justify-between w-full p-3 hover:bg-gray-700 rounded focus:outline-none"
        onClick={() => setIsApprovalOpen(!isApprovalOpen)}
      >
        <span className="flex items-center">
          <MdApproval className="mr-2" />
          Approval
        </span>
        {isApprovalOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {isApprovalOpen && (
        <div className="ml-6 mt-2 space-y-2">
          <Link to="/approval/pending" className="block hover:text-gray-300" onClick={toggleSidebar}>
            Pending Approvals
          </Link>
          <Link to="/approval/history" className="block hover:text-gray-300" onClick={toggleSidebar}>
            Approval History
          </Link>
        </div>
      )}
    </div>

    {/* Visa (Dropdown with Expand/Collapse Indicator) */}
    {hasRole("User") && (
      <div className="relative">
        <button
          className="flex items-center justify-between w-full p-3 hover:bg-gray-700 rounded focus:outline-none"
          onClick={() => setIsVisaOpen(!isVisaOpen)}
        >
          <span className="flex items-center">
            <FiFile className="mr-2" />
            Expenses
          </span>
          {isVisaOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {isVisaOpen && (
          <div className="ml-6 mt-2 space-y-2">
            <Link to="/visa/visas" className="block hover:text-gray-300" onClick={toggleSidebar}>
              Applied Expenses
            </Link>
            <Link to="/visa/applyVisa" className="block hover:text-gray-300" onClick={toggleSidebar}>
              Apply Expense
            </Link>
          </div>
        )}
      </div>
    )}

    {/* Reports */}
    {hasRole("Finance") && (
      <Link
        to="/reports"
        className="flex items-center p-3 hover:bg-gray-700 rounded"
        onClick={toggleSidebar}
      >
        <MdOutlineReport className="mr-2" />
        Reports
      </Link>
    )}
  </div>
);

export default Sidebar;
