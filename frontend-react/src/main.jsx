// frontend-react/src/main.jsx (DOĞRU HALİ)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import burada
import { AuthProvider } from './contexts/AuthContext'; // AuthContext
import { I18nProvider } from './contexts/I18nContext'; // I18n Context
import App from './App';
import './index.css'; // Global stiller

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. YÖNLENDİRİCİ (ANA) */}
    <BrowserRouter>
      {/* AuthProvider, Router'ın İÇİNDE olmalı ki hook'ları kullanabilsin */}
      <AuthProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);