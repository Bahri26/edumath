// frontend-react/src/components/auth/ProtectedRoute.jsx
// Basit kimlik doğrulama koruması: kullanıcı yoksa login'e yönlendirir.
// Kullanım:
// <Route element={<ProtectedRoute/>}> <Route path="/student/dashboard" ... /> </Route>
// İsteğe bağlı: <ProtectedRoute redirectTo="/login" fallback={<Spinner/>}>

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import useAuthReady from '../../hooks/useAuthReady.js';

export default function ProtectedRoute({ redirectTo = '/login', fallback = null }) {
  const { user, loading } = React.useContext(AuthContext);
  const authReady = useAuthReady();

  if (loading || !authReady) {
    return fallback || <div style={{ padding: 24 }}>Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
