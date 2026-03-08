import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiFile,
} from "react-icons/fi";
import { MdApproval, MdOutlineReport } from "react-icons/md";

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isVisaOpen, setIsVisaOpen] = useState(false);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRoles((user.roles || []).map((role) => role.name));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const hasRole = (role) => userRoles.includes(role);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className="hidden md:flex md:w-72 md:shrink-0 md:px-4 md:pb-4">
        <div className="mt-24 flex h-[calc(100vh-7rem)] w-full flex-col rounded-[28px] border border-white/50 bg-slate-900 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
          <SidebarContent
            isAdminOpen={isAdminOpen}
            setIsAdminOpen={setIsAdminOpen}
            isApprovalOpen={isApprovalOpen}
            setIsApprovalOpen={setIsApprovalOpen}
            isVisaOpen={isVisaOpen}
            setIsVisaOpen={setIsVisaOpen}
            closeSidebar={closeSidebar}
            hasRole={hasRole}
          />
        </div>
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] transform bg-slate-900 text-white shadow-2xl transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <div>
              <div className="text-sm font-semibold text-white">Navigation</div>
              <div className="text-xs text-white/60">Expense Management</div>
            </div>
            <button
              onClick={toggleSidebar}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80"
            >
              ✕
            </button>
          </div>

          <SidebarContent
            isAdminOpen={isAdminOpen}
            setIsAdminOpen={setIsAdminOpen}
            isApprovalOpen={isApprovalOpen}
            setIsApprovalOpen={setIsApprovalOpen}
            isVisaOpen={isVisaOpen}
            setIsVisaOpen={setIsVisaOpen}
            closeSidebar={closeSidebar}
            hasRole={hasRole}
          />
        </div>
      </aside>
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
  closeSidebar,
  hasRole,
}) => (
  <div className="flex-1 overflow-y-auto px-4 py-5">
    <div className="mb-4 px-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Main
      </div>
    </div>

    <div className="space-y-1">
      <NavItem to="/dashboard" icon={<FiHome />} onClick={closeSidebar}>
        Home
      </NavItem>
    </div>

    {hasRole("Admin") && (
      <SidebarGroup
        title="Administration"
        icon={<FiUsers />}
        open={isAdminOpen}
        setOpen={setIsAdminOpen}
      >
        <SubNavItem to="/users" onClick={closeSidebar}>
          User Maintenance
        </SubNavItem>
        <SubNavItem to="/orgRoles" onClick={closeSidebar}>
          Org Roles Maintenance
        </SubNavItem>
        <SubNavItem to="/departments" onClick={closeSidebar}>
          Department Maintenance
        </SubNavItem>
        <SubNavItem to="/types" onClick={closeSidebar}>
          Type Maintenance
        </SubNavItem>
        <SubNavItem to="/adminPasswordReset" onClick={closeSidebar}>
          Password Reset
        </SubNavItem>
      </SidebarGroup>
    )}

    {hasRole("Default") && (
      <SidebarGroup
        title="Requests"
        icon={<FiFile />}
        open={isVisaOpen}
        setOpen={setIsVisaOpen}
      >
        <SubNavItem to="/visa/applyVisa" onClick={closeSidebar}>
          New Request
        </SubNavItem>
        <SubNavItem to="/visa/visas" onClick={closeSidebar}>
          Request Status
        </SubNavItem>
      </SidebarGroup>
    )}

    {(hasRole("Default") || hasRole("Reports")) && (
      <SidebarGroup
        title={hasRole("Processor") ? "Processing" : "Approval"}
        icon={<MdApproval />}
        open={isApprovalOpen}
        setOpen={setIsApprovalOpen}
      >
        <SubNavItem to="/approval/pending" onClick={closeSidebar}>
          {hasRole("Processor") ? "Process Requests" : "Pending Approvals"}
        </SubNavItem>
        <SubNavItem to="/approval/history" onClick={closeSidebar}>
          {hasRole("Processor") ? "Request History" : "Approval History"}
        </SubNavItem>
      </SidebarGroup>
    )}

    {hasRole("Reports") && (
      <div className="mt-2">
        <NavItem to="/reports" icon={<MdOutlineReport />} onClick={closeSidebar}>
          Reports
        </NavItem>
      </div>
    )}
  </div>
);

function NavItem({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{children}</span>
    </NavLink>
  );
}

function SidebarGroup({ title, icon, open, setOpen, children }) {
  return (
    <div className="mt-2">
      <button
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          {title}
        </span>
        <span>{open ? <FiChevronUp /> : <FiChevronDown />}</span>
      </button>

      {open && (
        <div className="mt-2 ml-4 space-y-1 border-l border-white/10 pl-4">
          {children}
        </div>
      )}
    </div>
  );
}

function SubNavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 text-sm transition ${
          isActive
            ? "bg-white/12 text-white"
            : "text-white/60 hover:bg-white/6 hover:text-white/85"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default Sidebar;