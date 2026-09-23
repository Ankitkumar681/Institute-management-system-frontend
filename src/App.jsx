import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AttendanceDesk from './pages/AttendanceDesk';
import ManageClassrooms from './pages/ManageClassrooms';
import ManageStudents from './pages/ManageStudents';
import ManageStaff from './pages/ManageStaff';
import StudentDirectory from './pages/StudentDirectory';
import { CoreDashboard, UnauthorizedPage } from './pages/DashboardViews';
import SuperAdminSchools from './pages/SuperAdminSchools';
import StaffDirectory from './pages/StaffDirectory';
import ManageAssignments from './pages/ManageAssignments';
import OnboardInstitute from './pages/OnboardInstitute'; 
import ForgotPassword from './pages/ForgotPassword';
import AcademicYearManager from './pages/AcademicYearManager';
import CohortPromotionManager from './pages/CohortPromotionManager';

const WrappedDashboard = ({ Component }) => (
  <DashboardLayout>
    <Component />
  </DashboardLayout>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Base Entries */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Secure Base Access Scope */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'staff', 'class_teacher', 'student']} />}>
            <Route path="/dashboard" element={<WrappedDashboard Component={CoreDashboard} />} />
            <Route path="/attendance" element={<WrappedDashboard Component={AttendanceDesk} />} />
          </Route>

          {/* Directory Access */}
          <Route element={<ProtectedRoute allowedRoles={['institute_admin', 'staff', 'class_teacher']} />}>
            <Route path="/students" element={<WrappedDashboard Component={StudentDirectory} />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['institute_admin', 'staff']} />}>
            <Route path="/staff" element={<WrappedDashboard Component={StaffDirectory} />} />
          </Route>
          {/* Institute Admin Tools Management */}
          <Route element={<ProtectedRoute allowedRoles={['institute_admin']} />}>
          <Route path="/admin/academic-years" element={<WrappedDashboard Component={AcademicYearManager} />} />
          <Route path="/admin/promote-cohorts" element={<WrappedDashboard Component={CohortPromotionManager} />} />
            <Route path="/classrooms" element={<WrappedDashboard Component={ManageClassrooms} />} />
            <Route path="/students/onboard" element={<WrappedDashboard Component={ManageStudents} />} />
            <Route path="/staff/onboard" element={<WrappedDashboard Component={ManageStaff} />} />
            <Route path="/staff/assignments" element={<WrappedDashboard Component={ManageAssignments} />} />
          </Route>
          {/* Super Admin Restricted Boundary */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/institutes" element={<WrappedDashboard Component={SuperAdminSchools} />} />
            <Route path="/institutes/onboard" element={<WrappedDashboard Component={OnboardInstitute} />} />
          </Route>
          {/* Fallback Parameter Rule */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
