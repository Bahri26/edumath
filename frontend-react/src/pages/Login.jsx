import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';
import '../assets/styles/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const { login, user } = useAuth();

  if (user) {
    if (user.roles?.isTeacher) {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user.roles?.isStudent) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Geçerli bir e-posta adresi girin');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailError('');

    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun! 📝');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Giriş başarısız! 😔 Bilgilerini kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kids-auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-emoji">🚀</div>
          <h1 className="auth-title">Hoş Geldin!</h1>
          <p className="auth-subtitle">Matematik macerana devam et</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">📧 E-posta</label>
            <div className="input-wrapper">
              <input
                type="email"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                placeholder="ornek@email.com"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
              />
              {emailError && <span className="input-error-text">{emailError}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">🔒 Şifre</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth" disabled={loading || emailError}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Giriş Yapılıyor...
              </>
            ) : (
              'Giriş Yap 🚀'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Hesabın yok mu?{' '}
          <Link to="/register" className="auth-link">
            Hemen Kayıt Ol! 
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
