import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { registerAuthFailureHandler } from '../services/api';
import { useToast } from './ToastContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout] = useState(24 * 60 * 60 * 1000); // 24 saat
  const timeoutRef = useRef(null);
  const { showToast } = useToast();

  // Uygulama ilk açıldığında localStorage'dan kullanıcıyı geri yükle
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const loginTime = localStorage.getItem('loginTime');

    if (storedUser && storedToken) {
      const now = Date.now();
      const timeElapsed = now - (loginTime ? parseInt(loginTime) : now);
      
      // Session zaman aşımı kontrolü
      if (timeElapsed > sessionTimeout) {
        localStorage.clear();
        sessionStorage.clear();
      } else {
        setUser(JSON.parse(storedUser));
        startSessionTimer();
      }
    }
    setLoading(false);
  }, [sessionTimeout]);

  // Session timer başlat
  const startSessionTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      logout();
      showToast?.('Oturum süreniz doldu. Lütfen yeniden giriş yapın.', 'info', 4000);
    }, sessionTimeout);
  };

  // Kullanıcı aktivitesi saptanırsa timer reset et
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      startSessionTimer();
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [user, sessionTimeout]);

  // 🚨 LOGIN FONKSİYONU (Token Kaydetme)
  const login = (userData, token) => {
    // 1. Verileri State'e at
    setUser(userData);
    
    // 2. Verileri Tarayıcı Hafızasına (LocalStorage) kaydet
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('loginTime', Date.now().toString());
    localStorage.setItem('lastActivity', Date.now().toString());
    
    // Timer başlat
    startSessionTimer();
  };

  const logout = useCallback((reason) => {
    // Backend refresh token revoke
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        }).catch(() => {});
      } catch {}
    }

    // Tüm session verilerini temizle
    setUser(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    localStorage.clear();
    sessionStorage.clear();

    if (reason === 'unauthorized') {
      showToast?.('Oturumunuz sonlandı. Lütfen tekrar giriş yapın.', 'info', 4000);
    } else if (reason === 'logout') {
      showToast?.('Çıkış yapıldı.', 'success', 2500);
    }

    // Hızlı ana sayfaya git
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }, [showToast]);

  // API katmanından gelen 401 -> tek noktadan logout
  useEffect(() => {
    registerAuthFailureHandler(() => logout('unauthorized'));
    return () => registerAuthFailureHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, sessionTimeout }}>
      {children}
    </AuthContext.Provider>
  );
};