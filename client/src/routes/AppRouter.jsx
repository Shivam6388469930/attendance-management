import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import Login from '../pages/auth/Login';
import Unauthorized from '../pages/auth/Unauthorized';
import Dashboard from '../pages/employee/Dashboard';
import AttendanceHistory from '../pages/employee/AttendanceHistory';
import CorrectionRequest from '../pages/employee/CorrectionRequest';
import CorrectionRequests from '../pages/hr/CorrectionRequests';
import AttendanceView from '../pages/hr/AttendanceView';
import UserManagement from '../pages/admin/UserManagement';
import RoleAssignment from '../pages/admin/RoleAssignment';
import AttendanceRules from '../pages/admin/AttendanceRules';
import AuditLogs from '../pages/admin/AuditLogs';
import PageWrapper from '../components/layout/PageWrapper';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Shared Routes (all roles) */}
      <Route element={<ProtectedRoute allowedRoles={['employee', 'hr', 'admin']} />}>
        <Route element={<PageWrapper />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<AttendanceHistory />} />
        </Route>
      </Route>

      {/* Employee-only Routes */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<PageWrapper />}>
          <Route path="/corrections" element={<CorrectionRequest />} />
        </Route>
      </Route>

      {/* HR Routes */}
      <Route element={<ProtectedRoute allowedRoles={['hr', 'admin']} />}>
        <Route element={<PageWrapper />}>
          <Route path="/hr/requests" element={<CorrectionRequests />} />
          <Route path="/hr/attendance" element={<AttendanceView />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<PageWrapper />}>
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/roles" element={<RoleAssignment />} />
          <Route path="/admin/rules" element={<AttendanceRules />} />
          <Route path="/admin/logs" element={<AuditLogs />} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;