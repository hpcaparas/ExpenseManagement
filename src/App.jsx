import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import UserManagement from "./pages/UserManagement";
import DepartmentManagement from "./pages/DepartmentManagement";
import TypeManagement from "./pages/TypeManagement";
import AddType from "./pages/AddType";
import EditType from "./pages/EditType";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import AddDepartment from "./pages/AddDepartment";
import EditDepartment from "./pages/EditDepartment";
import Layout from "./components/Layout";
import ApplyVisa from "./pages/ApplyVisa";
import Visa from "./pages/VisaList";
import PendingApproval from "./pages/PendingApproval";
import ApprovalHistory from "./pages/ApprovalHistory";
import VisaReports from "./pages/VisaReports";
import PasswordReset from "./pages/PasswordReset";
import OrgRoleMaint from "./pages/OrgRoleManagement";
import AddOrgRole from "./pages/AddOrgRole";
import EditOrgRole from "./pages/EditOrgRole";
import EditVisa from "./pages/EditVisa";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={ <Layout> <LandingPage /> </Layout>}/>
        <Route path="/adminPasswordReset" element={ <Layout><PasswordReset /></Layout>}/>
        <Route path="/reports" element={ <Layout><VisaReports /></Layout>}/>
        <Route path="/approval/pending" element={<Layout><PendingApproval /></Layout>}/>
        <Route path="/approval/history" element={<Layout><ApprovalHistory /></Layout>}/>
        <Route path="/visa/visas" element={<Layout><Visa /></Layout>}/>
        <Route path="/visa/applyVisa" element={<Layout><ApplyVisa /></Layout>}/>
        <Route path="/users" element={<Layout><UserManagement /></Layout>}/>
        <Route path="/users/add" element={<Layout><AddUser /></Layout>}/>
        <Route path="/users/edit/:id" element={<Layout><EditUser/></Layout>}/>
        <Route path="/types" element={<Layout><TypeManagement /></Layout>}/>
        <Route path="/types/add" element={<Layout><AddType /></Layout>}/>
        <Route path="/types/edit/:id" element={<Layout><EditType /></Layout>}/>
        <Route path="/departments" element={<Layout><DepartmentManagement /></Layout>}/>
        <Route path="/departments/add" element={<Layout><AddDepartment /></Layout>}/>
        <Route path="/departments/edit/:id" element={<Layout><EditDepartment /></Layout>}/>
        <Route path="/orgRoles" element={<Layout><OrgRoleMaint /></Layout>}/>
        <Route path="/orgRoles/addOrgRole" element={<Layout><AddOrgRole /></Layout>}/>
        <Route path="/orgRoles/editOrgRole/:id" element={<Layout><EditOrgRole /></Layout>}/>
        <Route path="/visa/edit/:id" element={<Layout><EditVisa /></Layout>}/>
      </Routes>
    </Router>
  );
}

export default App;
