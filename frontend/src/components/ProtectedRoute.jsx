import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getHomePathForRole } from '../utils/roleRoutes';
import { useTranslation } from '../i18n/useTranslation';

const readToken = () => {
  const direct = localStorage.getItem('token');
  if (direct) return direct;
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser)?.token : null;
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, logout } = useContext(AuthContext);
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const token = readToken();
  if (!user || !token) {
    if (user && !token) {
      try {
        logout?.('unauthorized');
      } catch {
        /* ignore */
      }
    }
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
