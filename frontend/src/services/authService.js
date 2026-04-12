// src/services/authService.js

import apiClient from './api'; // Hazırladığınız temel API istemcisi
// Not: axios kurulu olmalıdır (npm install axios)

// API uç noktaları
const AUTH_URL = '/auth'; // Örn: http://localhost:5000/api/auth

// -----------------------------------------------------------------
// 1. Kayıt Olma İşlemi
// -----------------------------------------------------------------
const register = async (userData) => {
    const response = await apiClient.post(AUTH_URL + '/register', userData);
    const payload = response.data || {};
    const token = payload.token || payload.data?.token;
    const user = payload.user || payload.data?.user;
    if (token && user) {
        localStorage.setItem('user', JSON.stringify({ token, ...user }));
        localStorage.setItem('token', token);
        if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
    }
    return payload;
};

// -----------------------------------------------------------------
// 2. Giriş Yapma İşlemi
// -----------------------------------------------------------------
const login = async (email, password) => {
    const response = await apiClient.post(AUTH_URL + '/login', { email, password });
    const payload = response.data || {};
    const token = payload.token || payload.data?.token;
    const user = payload.user || payload.data?.user;
    if (token && user) {
        localStorage.setItem('user', JSON.stringify({ token, ...user }));
        localStorage.setItem('token', token);
        if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
    }
    return payload;
};

// -----------------------------------------------------------------
// 3. Çıkış Yapma İşlemi
// -----------------------------------------------------------------
const logout = () => {
    // Token'ı silerek oturumu sonlandır
    localStorage.removeItem('user');
};

const authService = {
    register,
    login,
    logout,
};

export default authService;