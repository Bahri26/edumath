// frontend-react/src/components/auth/RoleProtectedRoute.jsx (YENİ DOSYA)

import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Bu bileşen, bir yolun sadece belirli bir role sahip kullanıcılar 
 * tarafından erişilmesini sağlar (örn: sadece 'teacher').
 */
function RoleProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // 1. AuthContext hâlâ kullanıcıyı yüklüyorsa
  if (loading) {
    return <div>Yükleniyor...</div>; // Veya bir yüklenme animasyonu
  }

  // 2. Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Kullanıcının rolünü kontrol et
  // allowedRoles dizisi ['teacher'] ise, kullanıcının rollerinde 'isTeacher: true' olmalı.
  const userHasRole = allowedRoles.some(role => {
    if (role === 'teacher') return user.roles?.isTeacher;
    if (role === 'student') return user.roles?.isStudent;
    if (role === 'admin') return user.roles?.isAdmin;
    return false;
  });

  // 4. Kullanıcının yetkisi varsa, alt bileşeni (Outlet) göster
  if (userHasRole) {
    return <Outlet />; // Bu, App.jsx'teki <TeacherDashboard /> gibi bileşenleri render eder
  }

  // 5. Kullanıcının yetkisi yoksa (örn: öğrenci, öğretmen paneline girmeye çalışırsa)
  // Onu ana sayfaya veya bir "Yetkisiz Erişim" sayfasına yönlendir
  return <Navigate to="/" replace />; 
}

export default RoleProtectedRoute;