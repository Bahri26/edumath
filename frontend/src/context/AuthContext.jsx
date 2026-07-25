import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { registerAuthFailureHandler, getBackendOrigin } from '../services/api';
import { useToast } from './ToastContext';

export const AuthContext = createContext();

const readStoredToken = () => {
  const direct = localStorage.getItem('token');
  if (direct) return direct;
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser)?.token : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout] = useState(24 * 60 * 60 * 1000); // 24 saat
  const timeoutRef = useRef(null);
  const { showToast } = useToast();

  // Session timer başlat
  const startSessionTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      logoutRef.current?.();
      showToast?.('Oturum süreniz doldu. Lütfen yeniden giriş yapın.', 'info', 4000);
    }, sessionTimeout);
  }, [sessionTimeout, showToast]);

  const logoutRef = useRef(null);

  const logout = useCallback((reason) => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const apiOrigin = getBackendOrigin();
        const logoutUrl = apiOrigin ? `${apiOrigin}/api/auth/logout` : '/api/auth/logout';
        fetch(logoutUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      } catch { /* ignore */ }
    }

    setUser(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    localStorage.clear();
    sessionStorage.clear();

    if (reason === 'unauthorized') {
      showToast?.('Oturumunuz sonlandı. Lütfen tekrar giriş yapın.', 'info', 4000);
    } else if (reason === 'logout') {
      showToast?.('Çıkış yapıldı.', 'success', 2500);
    }

    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }, [showToast]);

  logoutRef.current = logout;

  // Uygulama ilk açıldığında localStorage'dan kullanıcıyı geri yükle
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = readStoredToken();
    const loginTime = localStorage.getItem('loginTime');

    if (storedUser && storedToken) {
      const now = Date.now();
      const timeElapsed = now - (loginTime ? parseInt(loginTime, 10) : now);

      if (timeElapsed > sessionTimeout) {
        localStorage.clear();
        sessionStorage.clear();
      } else {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem('token', storedToken);
          localStorage.setItem('user', JSON.stringify({ ...parsed, token: storedToken }));
          setUser({ ...parsed, token: storedToken });
          startSessionTimer();
        } catch {
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    } else if (storedUser && !storedToken) {
      // Kullanıcı kaydı var ama token yok → yarım oturumu temizle
      localStorage.clear();
      sessionStorage.clear();
    }
    setLoading(false);
  }, [sessionTimeout, startSessionTimer]);

  // Kullanıcı aktivitesi saptanırsa timer reset et
  useEffect(() => {
    if (!user) return undefined;

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
  }, [user, startSessionTimer]);

  const login = (userData, token) => {
    if (!token) {
      console.warn('login çağrıldı ama token yok');
      return;
    }

    const nextUser = { ...(userData || {}), token };
    setUser(nextUser);

    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('token', token);
    localStorage.setItem('loginTime', Date.now().toString());
    localStorage.setItem('lastActivity', Date.now().toString());

    startSessionTimer();
  };

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
