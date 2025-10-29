// frontend-react/src/main.jsx (DOĞRU HALİ)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import burada
import { AuthProvider } from './contexts/AuthContext'; // AuthContext
import App from './App';
import './index.css'; // Global stiller

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. YÖNLENDİRİCİ (ANA) */}
    <BrowserRouter>
      {/* AuthProvider, Router'ın İÇİNDE olmalı ki hook'ları kullanabilsin */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);