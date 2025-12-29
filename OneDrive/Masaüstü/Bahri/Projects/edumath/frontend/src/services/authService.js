// src/services/authService.js

import apiClient from './api'; // Hazırladığınız temel API istemcisi
// Not: axios kurulu olmalıdır (npm install axios)

// API uç noktaları
const AUTH_URL = '/auth'; // Örn: http://localhost:5000/api/auth

// -----------------------------------------------------------------
// 1. Kayıt Olma İşlemi
// -----------------------------------------------------------------
const register = async (userData) => {
    // POST /api/auth/register adresine istek at
    const response = await apiClient.post(AUTH_URL + '/register', userData);

    // Başarılı olursa (201 Created), token ve kullanıcı objesini kaydet
    if (response.data.data.token) {
        // Backend'den gelen user objesi (token dahil)
        localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    // Geriye tüm cevabı dön
    return response.data;
};

// -----------------------------------------------------------------
// 2. Giriş Yapma İşlemi
// -----------------------------------------------------------------
const login = async (email, password) => {
    // POST /api/auth/login adresine istek at
    const response = await apiClient.post(AUTH_URL + '/login', { email, password });
    
    // Başarılı olursa (200 OK), token ve kullanıcı objesini kaydet
    if (response.data.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
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