import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';
import '../assets/styles/Auth.css';

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [birthDate, setBirthDate] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { register, user } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 5);
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

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    
    let errors = [];
    if (value.length < 8) errors.push('En az 8 karakter');
    if (!/[A-Z]/.test(value)) errors.push('Büyük harf');
    if (!/[a-z]/.test(value)) errors.push('Küçük harf');
    if (!/[0-9]/.test(value)) errors.push('Rakam');
    
    setPasswordError(errors.length > 0 ? `Eksikler: ${errors.join(', ')}` : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Comprehensive validation
    if (!firstName || !lastName || !email || !password || !birthDate) {
      setError('Lütfen tüm alanları doldur! 📝');
      setLoading(false);
      return;
    }

    if (firstName.length < 2 || lastName.length < 2) {
      setError('Ad ve soyad en az 2 karakter olmalıdır! ✏️');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin! 📧');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır! 🔒');
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Şifre büyük harf, küçük harf ve rakam içermelidir! 🔐');
      setLoading(false);
      return;
    }

    if (role === 'student' && !gradeLevel) {
      setError('Öğrenciler sınıf seçmeli! 🏫');
      setLoading(false);
      return;
    }
    
    try {
      await register(firstName, lastName, email, password, role, birthDate, role === 'student' ? gradeLevel : null);
      setSuccess('Kayıt başarılı! Hoş geldin! ');
    } catch (err) {
      setError(err.message || 'Kayıt başarısız!  Tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    if (user.roles?.isTeacher) {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user.roles?.isStudent) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="kids-auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-emoji">🎉</div>
          <h1 className="auth-title">Aramıza Katıl!</h1>
          <p className="auth-subtitle">Matematik dünyasına hoş geldin</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-error" style={{background: 'var(--gradient-success)'}}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="role-toggle">
            <button type="button" className={'role-btn ' + (role === 'student' ? 'active' : '')} onClick={() => setRole('student')}>
              <span className="role-emoji">🎓</span>Öğrenci
            </button>
            <button type="button" className={'role-btn ' + (role === 'teacher' ? 'active' : '')} onClick={() => setRole('teacher')}>
              <span className="role-emoji">👩‍🏫</span>Öğretmen
            </button>
          </div>

          <div className="form-group">
            <label className="form-label"> Ad</label>
            <input type="text" className="form-input" placeholder="Adın" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label"> Soyad</label>
            <input type="text" className="form-input" placeholder="Soyadın" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} />
          </div>

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
                placeholder="Güçlü bir şifre seç" 
                value={password} 
                onChange={handlePasswordChange} 
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
            {password && (
              <div className="password-strength-container">
                <div className="password-strength-bar">
                  <div 
                    className={`password-strength-fill strength-${passwordStrength}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="password-strength-text">
                  {passwordStrength === 0 && 'Çok Zayıf 😰'}
                  {passwordStrength === 1 && 'Zayıf 😟'}
                  {passwordStrength === 2 && 'Orta 😐'}
                  {passwordStrength === 3 && 'İyi 😊'}
                  {passwordStrength === 4 && 'Güçlü 😃'}
                  {passwordStrength === 5 && 'Çok Güçlü 🔥'}
                </span>
              </div>
            )}
            {passwordError && <span className="input-hint-text">{passwordError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label"> Doğum Tarihi</label>
            <input type="date" className="form-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={loading} />
          </div>

          {role === 'student' && (
            <div className="form-group">
              <label className="form-label"> Sınıf Seviyesi</label>
              <select className="form-select" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} disabled={loading}>
                <option value="">Sınıfını seç</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                  <option key={grade} value={grade}>{grade}. Sınıf</option>
                ))}
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-auth" 
            disabled={loading || emailError || (password && passwordStrength < 2)}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Kayıt Yapılıyor...
              </>
            ) : (
              'Kayıt Ol 🎉'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="auth-link">Giriş Yap! </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
