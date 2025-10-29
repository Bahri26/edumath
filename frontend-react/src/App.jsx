// frontend-react/src/App.jsx (GÜNCEL VE TAM HALİ)

import React from 'react';
import { Routes, Route } from 'react-router-dom'; 

// Ana Yerleşim
import Layout from './components/Layout'; 

// Korumalı Yol Bileşenleri
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';

// Genel (Public) Sayfalar
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';

// Korumalı Genel Sayfalar
import ProfilePage from './pages/ProfilePage';

// Öğretmen Sayfaları
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionPool from './pages/teacher/QuestionPool';
import TeacherExams from './pages/teacher/TeacherExams';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherSurveys from './pages/teacher/TeacherSurveys';

// --- SINIFLAR İÇİN 2 YENİ İMPORT ---
import TeacherClasses from './pages/teacher/TeacherClasses';     // 12-kartlı ana sayfa
import ClassGradeDetail from './pages/teacher/ClassGradeDetail'; // CRUD detay sayfası

// 404 Sayfası
import NotFound from './pages/NotFound'; 


function App() {
  return (
    // <BrowserRouter> main.jsx'te olduğu için burada KULLANILMAZ
    <Routes>
      
      {/* Layout (Navbar/Footer) olan tüm sayfalar */}
      <Route path="/" element={<Layout />}>

        {/* === PUBLIC ROTALAR (Herkes erişebilir) === */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* === KORUMALI ROTALAR (Giriş yapan herkes) === */}
        {/* Not: ProfilePage'i de korumaya alabiliriz, şimdilik böyle kaldı */}
        <Route path="profile" element={<ProfilePage />} />

        {/* === ÖĞRETMEN ROTALARI (Sadece 'teacher' rolü) === */}
        <Route element={<RoleProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/question-pool" element={<QuestionPool />} />
          <Route path="/teacher/exams" element={<TeacherExams />} />
          
          {/* --- GÜNCELLENEN SINIF ROTALARI --- */}
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/classes/:gradeLevel" element={<ClassGradeDetail />} />
          
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/surveys" element={<TeacherSurveys />} />
        </Route>

        {/* === 404 Sayfası === */}
        <Route path="*" element={<NotFound />} />

      </Route>
    </Routes>
  );
}

export default App;