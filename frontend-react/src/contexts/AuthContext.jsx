// frontend-react/src/contexts/AuthContext.jsx (GÜNCEL HALİ)

import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
export const AuthContext = createContext(null);

// Backend API adresiniz
const API_URL = 'http://localhost:8000/api/auth'; 

export const AuthProvider = ({ children }) => {
  // state'leri localStorage'dan okuyarak başlat
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Başlangıçta 'true' olmalı

  // --- GÜNCELLENEN useEffect ---
  // Bu useEffect, uygulama ilk yüklendiğinde (veya sayfa yenilendiğinde) çalışır
  useEffect(() => {
    // 1. Token varsa, axios'un default header'ına ayarla
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // 2. localStorage'dan user'ı yükle
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 3. Yükleme tamamlandı, korumalı rotalar artık çalışabilir.
    setLoading(false);
  }, [token]); // Token değiştiğinde de çalışabilir, ama asıl amaç ilk yüklemedir.

  // --- GLOBAL 401 / UNAUTHORIZED EVENT DİNLEYİCİSİ ---
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const detail = e.detail || {};
      // Token süresi dolmuş veya geçersiz ise otomatik logout
      if (detail.expired || /geçersiz token|süresi doldu|expired/i.test(detail.message || '')) {
        logout();
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // --- LOGIN ---
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      const { token, accessToken, refreshToken, user: userData } = response.data;

      // Token ve user'ı ayarla
      // Backende hem token hem accessToken dönüyor olabilir; öncelik accessToken
      const effectiveAccess = accessToken || token;
      localStorage.setItem('token', effectiveAccess);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(userData)); // <-- KULLANICIYI DA SAKLA
      setToken(effectiveAccess);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${effectiveAccess}`;
    } catch (error) {
      console.error('AuthContext login hatası:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Giriş sırasında bir hata oluştu.');
    }
  };

  // --- LOGOUT ---
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // <-- KULLANICIYI DA SİL
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // --- REGISTER ---
  const register = async (
    firstName, lastName, email, password, role, birthDate, gradeLevel
  ) => {
    try {
      const userData = {
        firstName, lastName, email, password, role, birthDate, gradeLevel
      };

      const response = await axios.post(`${API_URL}/register`, userData);

      if (response.status === 201) {
        console.log(response.data.message);
        // Kayıttan hemen sonra otomatik giriş yap
        await login(email, password);
      }
    } catch (error) {
      console.error('AuthContext register hatası:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  // Context'in "value" prop'u
  const value = {
    user,
    token,
    loading, // Bu 'loading' state'i RoleProtectedRoute için çok önemlidir
    login,
    logout,
    register
  };
  
  return (
    <AuthContext.Provider value={value}>
      {/* Sadece yükleme (ilk token kontrolü) bittikten sonra 
        alt bileşenleri (App.jsx'i) render et.
      */}
      {!loading ? children : <p>Yükleniyor...</p>}
    </AuthContext.Provider>
  );
};