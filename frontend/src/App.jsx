import React, { Suspense, lazy } from 'react';
import {
  BookOpen, FileText, CheckCircle, Trophy, LayoutGrid, Users, BarChart2,
  Calendar, Target, MessageSquare,
} from 'lucide-react';
import DashboardLayout from './pages/DashboardLayout';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// --- 1. LAYOUTS (ÇERÇEVELER) ---
const LandingPage = lazy(() => import('./pages/LandingPage'));
// DashboardLayout artık ortak kullanılacak

// --- 2. ORTAK SAYFALAR (COMMON) ---
const NotFound = lazy(() => import('./pages/common/NotFound'));
const SettingsPage = lazy(() => import('./pages/common/SettingsPage'));
const ExamsPage = lazy(() => import('./pages/common/ExamsPage'));
const SurveysPage = lazy(() => import('./pages/common/SurveysPage')); // 🚨 GÜNCEL: Ortak Anket Sayfası
const ProfilePage = lazy(() => import('./pages/common/ProfilePage'));
const ResetPassword = lazy(() => import('./pages/common/ResetPassword'));
const AudienceLandingPage = lazy(() => import('./pages/AudienceLandingPage'));

// --- 3. ÖĞRETMEN SAYFALARI ---
const TeacherHome = lazy(() => import('./pages/teacher/TeacherHome'));
const QuestionBank = lazy(() => import('./pages/teacher/QuestionBank'));
const TeacherExamsPage = lazy(() => import('./pages/teacher/TeacherExamsPage'));
const TeacherExerciseCreator = lazy(() => import('./pages/teacher/TeacherExerciseCreator'));
const SkillTreeBuilder = lazy(() => import('./pages/teacher/SkillTreeBuilder'));
const StudentProgressDashboard = lazy(() => import('./pages/teacher/StudentProgressDashboard'));
const TeacherReports = lazy(() => import('./pages/teacher/TeacherReports'));
const PatternTemplateBuilder = lazy(() => import('./pages/teacher/PatternTemplateBuilder'));
// import TeacherSurveys... -> ARTIK GEREK YOK (Ortak sayfayı kullanacağız)

// --- 4. ÖĞRENCİ SAYFALARI ---
const StudentHome = lazy(() => import('./pages/student/StudentHome'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const StudentStudyHub = lazy(() => import('./pages/student/StudentStudyHub'));
const SkillTree = lazy(() => import('./pages/student/SkillTree'));
const LessonQuiz = lazy(() => import('./pages/student/LessonQuiz'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const StudentLeaderboard = lazy(() => import('./pages/student/StudentLeaderboard'));
const StudentMessaging = lazy(() => import('./pages/student/StudentMessaging'));
const StudentPracticeExercises = lazy(() => import('./pages/student/StudentPracticeExercises'));

// --- 5. YÖNETİCİ SAYFALARI ---
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
        <Suspense fallback={(
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-3" role="status" aria-live="polite">
            <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 dark:text-slate-300">Yükleniyor…</span>
          </div>
        )}>
          <ErrorBoundary>
          <Routes>
          {/* =========================================================
              ANA SAYFA (LANDING PAGE)
             ========================================================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/students" element={<AudienceLandingPage audience="student" />} />
          <Route path="/teachers" element={<AudienceLandingPage audience="teacher" />} />
          <Route path="/research" element={<AudienceLandingPage audience="research" />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* =========================================================
              ÖĞRETMEN PANELİ ROTALARI (/teacher)
             ========================================================= */}
          <Route path="/teacher" element={
            <ProtectedRoute requiredRole="teacher">
              <DashboardLayout
                role="teacher"
                navMenuItems={[
                  { id: 'overview', label: 'Ana Sayfa', icon: BookOpen, path: '/teacher/overview' },
                  { id: 'questions', label: 'Soru Bankası', icon: FileText, path: '/teacher/questions' },
                  { id: 'exams', label: 'Sınavlar', icon: CheckCircle, path: '/teacher/exams' },
                  { id: 'exercises', label: 'Egzersizler', icon: Trophy, path: '/teacher/exercises' },
                  { id: 'skill-tree', label: 'Kazanım Ağacı', icon: LayoutGrid, path: '/teacher/skill-tree' },
                  { id: 'student-progress', label: 'Öğrenci İlerleme', icon: Users, path: '/teacher/student-progress' },
                  { id: 'reports', label: 'Raporlar', icon: BarChart2, path: '/teacher/reports' },
                  { id: 'surveys', label: 'Anketler', icon: FileText, path: '/teacher/surveys' },
                ]}
              />
            </ProtectedRoute>
          }>
            {/* Varsayılan: /teacher -> /teacher/overview */}
            <Route index element={<Navigate to="overview" replace />} />
            
            <Route path="overview" element={<TeacherHome />} />

            <Route path="questions" element={<QuestionBank />} />
            <Route path="exams" element={<TeacherExamsPage />} />
            <Route path="exercises" element={<TeacherExerciseCreator />} />
            <Route path="skill-tree" element={<SkillTreeBuilder />} />
            <Route path="student-progress" element={<StudentProgressDashboard />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="pattern-builder" element={<PatternTemplateBuilder />} />
            <Route path="surveys" element={<SurveysPage role="teacher" />} />
            <Route path="settings" element={<SettingsPage role="teacher" />} />
            <Route path="profile" element={<ProfilePage role="teacher" />} />
          </Route>

          {/* =========================================================
              ÖĞRENCİ PANELİ ROTALARI (/student)
             ========================================================= */}
          <Route path="/student" element={
            <ProtectedRoute requiredRole="student">
              <DashboardLayout
                role="student"
                navMenuItems={[
                  { id: 'home', label: 'Ana Sayfa', icon: BookOpen, path: '/student/home' },
                  { id: 'courses', label: 'Derslerim', icon: BookOpen, path: '/student/courses' },
                  { id: 'assignments', label: 'Ödevler', icon: CheckCircle, path: '/student/assignments' },
                  { id: 'exercises', label: 'Çalışma Merkezi', icon: Trophy, path: '/student/exercises' },
                  { id: 'practice', label: 'AI Antrenman', icon: Target, path: '/student/practice' },
                  { id: 'skill-tree', label: 'Konu Ağacı', icon: LayoutGrid, path: '/student/skill-tree' },
                  { id: 'quizzes', label: 'Sınavlar', icon: FileText, path: '/student/quizzes' },
                  { id: 'surveys', label: 'Anketler', icon: FileText, path: '/student/surveys' },
                  { id: 'messages', label: 'Mesajlar', icon: MessageSquare, path: '/student/messages' },
                  { id: 'leaderboard', label: 'Sıralama', icon: Trophy, path: '/student/leaderboard' },
                  { id: 'calendar', label: 'Takvim', icon: Calendar, path: '/student/calendar' },
                ]}
              />
            </ProtectedRoute>
          }>
            {/* Varsayılan: /student -> /student/home */}
            <Route index element={<Navigate to="home" replace />} />
            
            <Route path="home" element={<StudentHome />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="exercises" element={<StudentStudyHub />} />
            <Route path="skill-tree" element={<SkillTree />} />
            <Route path="lesson/:lessonId" element={<LessonQuiz />} />
            <Route path="leaderboard" element={<StudentLeaderboard />} />
            <Route path="calendar" element={<StudentCalendar />} />
            <Route path="practice" element={<StudentPracticeExercises />} />
            <Route path="messages" element={<StudentMessaging />} />

            {/* 🚨 GÜNCEL: Ortak Anket Sayfası (Rol: Student) */}
            <Route path="surveys" element={<SurveysPage role="student" />} />
            
            {/* Diğer Ortak Sayfalar */}
            <Route path="quizzes" element={<ExamsPage role="student" />} />
            <Route path="settings" element={<SettingsPage role="student" />} />
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