import React, { Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// --- 1. LAYOUTS (ÇERÇEVELER) ---
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TeacherDashboardLayout = lazy(() => import('./pages/TeacherDashboardLayout'));
const StudentDashboardLayout = lazy(() => import('./pages/StudentDashboardLayout'));

// --- 2. ORTAK SAYFALAR (COMMON) ---
const NotFound = lazy(() => import('./pages/common/NotFound'));
const SettingsPage = lazy(() => import('./pages/common/SettingsPage'));
const ExamsPage = lazy(() => import('./pages/common/ExamsPage'));
const SurveysPage = lazy(() => import('./pages/common/SurveysPage')); // 🚨 GÜNCEL: Ortak Anket Sayfası
const ProfilePage = lazy(() => import('./pages/common/ProfilePage'));
const ResetPassword = lazy(() => import('./pages/common/ResetPassword'));

// --- 3. ÖĞRETMEN SAYFALARI ---
const TeacherHome = lazy(() => import('./pages/teacher/TeacherHome'));
const QuestionBank = lazy(() => import('./pages/teacher/QuestionBank'));
const TeacherExamsPage = lazy(() => import('./pages/teacher/TeacherExamsPage'));
const TeacherExerciseCreator = lazy(() => import('./pages/teacher/TeacherExerciseCreator'));
const TeacherReports = lazy(() => import('./pages/teacher/TeacherReports'));
// import TeacherSurveys... -> ARTIK GEREK YOK (Ortak sayfayı kullanacağız)

// --- 4. ÖĞRENCİ SAYFALARI ---
const StudentHome = lazy(() => import('./pages/student/StudentHome'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const StudentPracticeExercises = lazy(() => import('./pages/student/StudentPracticeExercises'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const StudentLeaderboard = lazy(() => import('./pages/student/StudentLeaderboard'));
const StudentSettings = lazy(() => import('./pages/student/StudentSettings'));
const AdminResetRequests = lazy(() => import('./pages/admin/AdminResetRequests'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
// import StudentSurveys... -> ARTIK GEREK YOK (Ortak sayfayı kullanacağız)

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
          <ErrorBoundary>
          <Routes>
          {/* =========================================================
              ANA SAYFA (LANDING PAGE)
             ========================================================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* =========================================================
              ÖĞRETMEN PANELİ ROTALARI (/teacher)
             ========================================================= */}
          <Route path="/teacher" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboardLayout />
            </ProtectedRoute>
          }>
            {/* Varsayılan: /teacher -> /teacher/overview */}
            <Route index element={<Navigate to="overview" replace />} />
            
            <Route path="overview" element={<TeacherHome />} />

            <Route path="questions" element={<QuestionBank />} />
            <Route path="exams" element={<TeacherExamsPage />} />
            <Route path="exercises" element={<TeacherExerciseCreator />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="surveys" element={<SurveysPage role="teacher" />} />
            <Route path="settings" element={<SettingsPage role="teacher" />} />
            <Route path="profile" element={<ProfilePage role="teacher" />} />
          </Route>

          {/* =========================================================
              ÖĞRENCİ PANELİ ROTALARI (/student)
             ========================================================= */}
          <Route path="/student" element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboardLayout />
            </ProtectedRoute>
          }>
            {/* Varsayılan: /student -> /student/home */}
            <Route index element={<Navigate to="home" replace />} />
            
            <Route path="home" element={<StudentHome />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="exercises" element={<StudentPracticeExercises />} />
            <Route path="leaderboard" element={<StudentLeaderboard />} />
            <Route path="calendar" element={<StudentCalendar />} />

            {/* 🚨 GÜNCEL: Ortak Anket Sayfası (Rol: Student) */}
            <Route path="surveys" element={<SurveysPage role="student" />} />
            
            {/* Diğer Ortak Sayfalar */}
            <Route path="quizzes" element={<ExamsPage role="student" />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="profile" element={<ProfilePage role="student" />} />
          </Route>

          {/* =========================================================
              ADMIN ROTALARI (/admin)
             ========================================================= */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="reset-requests" element={<AdminResetRequests />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* =========================================================
              404 - SAYFA BULUNAMADI
             ========================================================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </ErrorBoundary>
        </Suspense>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;