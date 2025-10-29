// frontend-react/src/pages/Register.jsx (GÜNCEL HALİ)

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { Link, Navigate } from 'react-router-dom'; 
import '../assets/styles/Accounts.css'; 

function Register() {
  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); 
  
  // --- YENİ EKLENEN STATE'LER ---
  const [birthDate, setBirthDate] = useState(''); // Doğum tarihi için
  const [gradeLevel, setGradeLevel] = useState(''); // Sınıf düzeyi için (1-12)
  // --- YENİ STATE'LER BİTİŞ ---

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); 
  const [loading, setLoading] = useState(false); 

  const { register, user } = useAuth(); // Yönlendirme için user'ı da al

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(null); 
    setSuccess(null);
    setLoading(true);

    // --- GÜNCELLENEN DOĞRULAMA ---
    if (!firstName || !lastName || !email || !password || !birthDate) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      setLoading(false);
      return;
    }
    if (role === 'student' && !gradeLevel) {
      setError('Öğrenciler için sınıf düzeyi seçmek zorunludur.');
      setLoading(false);
      return;
    }
    // --- DOĞRULAMA BİTİŞ ---
    
    try {
      // --- GÜNCELLENEN REGISTER ÇAĞRISI ---
      await register(
        firstName, 
        lastName, 
        email, 
        password, 
        role, 
        birthDate, // YENİ
        role === 'student' ? gradeLevel : null // YENİ (Öğrenci değilse null yolla)
      ); 
      
      setSuccess('Kayıt başarılı! Yönlendiriliyorsunuz... ✅');
      // Otomatik login (AuthContext'te) başarılı olduğunda 'user' state'i dolacak
      // ve aşağıdaki <Navigate> componenti yönlendirmeyi yapacak.

    } catch (err) {
      // AuthContext'ten fırlatılan hatayı yakala
      setError(err.message || 'Kayıt başarısız oldu. Bilgilerinizi kontrol edin.');
    } finally {
        setLoading(false); 
    }
  };

  // Eğer AuthContext'teki 'user' state'i dolduysa (otomatik login başarılı olduysa)
  // Kullanıcıyı dashboard'a yönlendir.
  if (user) {
    // Ayrı dashboardlarınız olacağı için:
    if (user.roles?.isTeacher) {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user.roles?.isStudent) {
      return <Navigate to="/student/dashboard" replace />;
    }
    // Genel bir dashboard varsa:
    return <Navigate to="/dashboard" replace />;
  }


  return (
    <div className="accountPage">
      <div className="accountContainer card">
        <div className="cardBody">
            <h2 className="accountHeader">
                <i className="fas fa-user-plus me-2 text-success"></i>
                Yeni Hesap Oluştur
            </h2>
            <form onSubmit={handleSubmit}>
                
                {error && <div className="alert alert-danger mb-4">{error}</div>}
                {success && <div className="alert alert-success mb-4">{success}</div>}

                {/* Rol Seçimi Toggle */}
                <div className="userTypeToggle mb-4">
                    <input 
                        type="radio" value="student" id="roleStudent"
                        checked={role === 'student'} 
                        onChange={(e) => setRole(e.target.value)} 
                    /> 
                    <label htmlFor="roleStudent" className="d-flex align-items-center justify-content-center">
                        <i className="fas fa-user-graduate"></i> Öğrenci
                    </label>
                    
                    <input 
                        type="radio" value="teacher" id="roleTeacher"
                        checked={role === 'teacher'} 
                        onChange={(e) => setRole(e.target.value)} 
                    /> 
                    <label htmlFor="roleTeacher" className="d-flex align-items-center justify-content-center">
                        <i className="fas fa-chalkboard-teacher"></i> Öğretmen
                    </label>
                </div>
                
                {/* İsim Alanları */}
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label" htmlFor="firstNameInput">Ad</label>
                        <input type="text" id="firstNameInput" className="form-control"
                          placeholder="Adınız" value={firstName}
                          onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label" htmlFor="lastNameInput">Soyad</label>
                        <input type="text" id="lastNameInput" className="form-control"
                          placeholder="Soyadınız" value={lastName}
                          onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                </div>

                {/* --- YENİ ALAN: DOĞUM TARİHİ --- */}
                <div className="mb-3">
                    <label className="form-label" htmlFor="birthDateInput">Doğum Tarihi</label>
                    <input
                      type="date" 
                      id="birthDateInput"
                      className="form-control"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                </div>

                {/* --- YENİ ALAN: SINIF DÜZEYİ (Koşullu) --- */}
                {/* Sadece rol 'student' ise bu alanı göster */}
                {role === 'student' && (
                  <div className="mb-3">
                      <label className="form-label" htmlFor="gradeLevelInput">Sınıf Düzeyi</label>
                      <select 
                        id="gradeLevelInput" 
                        className="form-select"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        required={role === 'student'} // Öğrenciyse zorunlu yap
                      >
                        <option value="">Lütfen sınıf seçin...</option>
                        {[...Array(12).keys()].map(i => (
                          <option key={i + 1} value={i + 1}>{i + 1}. Sınıf</option>
                        ))}
                      </select>
                  </div>
                )}
                
                {/* E-posta ve Şifre */}
                <div className="mb-3">
                    <label className="form-label" htmlFor="regEmailInput">E-posta Adresi</label>
                    <input type="email" id="regEmailInput" className="form-control"
                      placeholder="adiniz@alanadi.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="mb-4">
                    <label className="form-label" htmlFor="regPasswordInput">Şifre</label>
                    <input type="password" id="regPasswordInput" className="form-control"
                      placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-success w-100" disabled={loading}>
                    {loading ? 'Kaydediliyor...' : 'KAYDOL'}
                </button>
            </form>

            <p className="accountFooterText">
                Zaten hesabın var mı? 
                <Link to="/login" className="ms-2 fw-bold text-primary">Giriş Yap</Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default Register;