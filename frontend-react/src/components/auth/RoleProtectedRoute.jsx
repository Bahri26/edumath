// frontend-react/src/components/auth/RoleProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import useAuthReady from '../../hooks/useAuthReady.js';

/**
 * Reusable route guard for role-based protection.
 * Usage:
 * <RoleProtectedRoute roles={['teacher']}><TeacherDashboard/></RoleProtectedRoute>
 */
export default function RoleProtectedRoute({ roles = [], children, fallback = null }) {
  const { user, loading } = React.useContext(AuthContext);
  const authReady = useAuthReady();

  // Still initializing auth or waiting for readiness
  if (loading || !authReady) {
    return fallback || <div style={{ padding: 24 }}>Yükleniyor...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, allow any authenticated user
  if (!roles.length) {
    return children;
  }

  const roleMap = {
    teacher: user.roles?.isTeacher || user.isTeacher,
    student: user.roles?.isStudent || user.isStudent,
    admin: user.roles?.isAdmin || user.isStaff || user.isAdmin,
  };

  const authorized = roles.some(r => roleMap[r]);
  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}
