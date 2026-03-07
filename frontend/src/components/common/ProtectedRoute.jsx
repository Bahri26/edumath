import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    // 1. LocalStorage'dan kullanıcı bilgisini al (String olarak gelir)
        const storedUser = localStorage.getItem('edumath_user');
    
    // 2. Kullanıcı hiç giriş yapmamışsa -> Login sayfasına at
    if (!storedUser) {
        return <Navigate to="/login" replace />;
    }

    let parsed = null;
    try {
        parsed = storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        parsed = null;
    }

    // Normalize to an object that has `role_id` if possible.
    // Support two shapes:
    //  - legacy: { user_id, full_name, role_id, ... }
    //  - current: { user: { user_id, full_name, role_id }, token, role }
    const authUser = parsed && parsed.user ? parsed.user : parsed;

    // If no parsed user found, force logout
    if (!authUser) return <Navigate to="/login" replace />;

    // Resolve role_id: prefer numeric role_id, otherwise map role string to id
    let roleId = typeof authUser.role_id !== 'undefined' ? authUser.role_id : null;
    if (!roleId && parsed && parsed.role) {
        const roleStr = parsed.role;
        if (roleStr === 'admin') roleId = 1;
        else if (roleStr === 'teacher') roleId = 2;
        else roleId = 3; // default to student
    }

    // If allowedRoles provided, check membership
    if (allowedRoles && !allowedRoles.includes(roleId)) {
        // Redirect user to their correct dashboard based on roleId
        if (roleId === 1) return <Navigate to="/admin-dashboard" replace />;
        if (roleId === 2) return <Navigate to="/teacher-dashboard" replace />;
        if (roleId === 3) return <Navigate to="/student-dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    // 4. Her şey yolundaysa sayfayı göster
    return <Outlet />;
};

export default ProtectedRoute;
