// frontend-react/src/pages/Login.jsx (TAM VE GÜNCEL HALİ)

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; 
// Yönlendirme için 'Navigate' import edildi
import { Link, Navigate } from 'react-router-dom'; 
//import '../assets/styles/Accounts.css'; 
import '../index.css'

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 'user' state'i de AuthContext'ten alındı
  const { login, user } = useAuth(); 

  // --- 1. KONTROL: KULLANICI ZATEN GİRİŞ YAPMIŞ MI? ---
  if (user) {
    // 'user' varsa (giriş yapılmışsa), onu ilgili dashboard'a yönlendir.
    if (user.roles?.isTeacher) {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user.roles?.isStudent) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/" replace />; // Diğer roller için ana sayfa
  }

  // --- 2. FORM GÖNDERME ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!email || !password) {
      setError('Lütfen e-posta ve şifre alanlarını doldurun.');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password); 
      // Başarılı olursa, 'user' state'i dolacak ve bileşen
      // yeniden render olunca üstteki 'if (user)' bloğuna girecek.
    } catch (err) {
      setError(err.message || 'Giriş Başarız. Bilgilerinizi kontrol edin.');
    } finally {
        setLoading(false);
    }
  };

  // --- 3. RENDER (Kullanıcı giriş yapmamışsa) ---
  return (
    <div className="accountPage"> 
      <div className="accountContainer card"> 
        <div className="cardBody">
            <h2 className="accountHeader">
                <i className="fas fa-sign-in-alt me-2 text-primary"></i>
                Giriş Yap
            </h2>
            <form onSubmit={handleSubmit}>
                
                {error && <div className="alert alert-danger mb-4">{error}</div>}
                
                <div className="mb-3">
                    <label className="form-label" htmlFor="emailInput">E-posta Adresi</label>
                    <input
                      type="email"
                      id="emailInput"
                      className="form-control"
                      placeholder="adiniz@alanadi.com"
                      value={email}
                      // --- DÜZELTME BURADA ---
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                    />
                </div>

                <div className="mb-4">
                    <label className="form-label" htmlFor="passwordInput">Şifre</label>
                    <input
                      type="password"
                      id="passwordInput"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} // Bu zaten doğruydu
                      required
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary w-100" 
                    disabled={loading}
                >
                    {loading ? 'Yükleniyor...' : (
                        <>
                            {/* Resimdeki ikon fa-arrow-right, ancak fa-sign-in-alt daha yaygın */}
                            <i className="fas fa-sign-in-alt me-2"></i> GİRİŞ YAP
                        </>
                    )}
                </button>
            </form>

            <p className="accountFooterText">
                Hesabın yok mu? 
                <Link to="/register" className="ms-2 fw-bold text-success">Kaydol</Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default Login;