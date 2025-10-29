// frontend-react/src/contexts/AuthContext.jsx (GÜNCEL HALİ)

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

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

  // --- LOGIN ---
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      const { token, user: userData } = response.data;

      // Token ve user'ı ayarla
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData)); // <-- KULLANICIYI DA SAKLA
      setToken(token);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('AuthContext login hatası:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Giriş sırasında bir hata oluştu.');
    }
  };

  // --- LOGOUT ---
  const logout = () => {
    localStorage.removeItem('token');
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

// Hook
export const useAuth = () => {
  return useContext(AuthContext);
};