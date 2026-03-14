import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

const HomePage = lazy(() => import('./pages/common/HomePage'));
const ProfilePage = lazy(() => import('./pages/common/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/common/SettingsPage'));
const SurveysPage = lazy(() => import('./pages/common/SurveysPage'));
const TakeSurveyPage = lazy(() => import('./pages/common/TakeSurveyPage'));
const SurveyStatsPage = lazy(() => import('./pages/common/SurveyStatsPage'));
const StudentsPage = lazy(() => import('./pages/common/StudentsPage'));
const TeachersPage = lazy(() => import('./pages/common/TeachersPage'));
const CurriculumPage = lazy(() => import('./pages/common/CurriculumPage'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentExamList = lazy(() => import('./pages/student/StudentExamList'));
const StudentExamPage = lazy(() => import('./pages/student/StudentExamPage'));
const StudentResultPage = lazy(() => import('./pages/student/StudentResultPage'));
const LearningPathPage = lazy(() => import('./pages/student/LearningPathPage'));
const TopicPage = lazy(() => import('./pages/student/TopicPage'));
const SolveQuestionPage = lazy(() => import('./pages/student/SolveQuestionPage'));
const ShopPage = lazy(() => import('./pages/student/ShopPage'));

const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const CreateExamPage = lazy(() => import('./pages/teacher/CreateExamPage'));
const ExamListPage = lazy(() => import('./pages/teacher/ExamListPage'));
const QuestionBankPage = lazy(() => import('./pages/teacher/QuestionBankPage'));
const CreateQuestionPage = lazy(() => import('./pages/teacher/CreateQuestionPage'));
const EditQuestionPage = lazy(() => import('./pages/teacher/EditQuestionPage'));
const AddQuestionPage = lazy(() => import('./pages/teacher/AddQuestionPage'));
const TeacherAnalysisPage = lazy(() => import('./pages/teacher/TeacherAnalysisPage'));
const CreateSurveyPage = lazy(() => import('./pages/teacher/CreateSurveyPage'));
const LevelThresholdsPage = lazy(() => import('./pages/teacher/LevelThresholdsPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ApprovalsPage = lazy(() => import('./pages/admin/ApprovalsPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const AnnouncementsPage = lazy(() => import('./pages/admin/AnnouncementsPage'));
const ReportsManagementPage = lazy(() => import('./pages/admin/ReportsManagementPage'));
const AlertsManagementPage = lazy(() => import('./pages/admin/AlertsManagementPage'));
const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-center text-gray-500">
      Sayfa yukleniyor...
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        
        {/* TÜM SİSTEM TEK LAYOUT İÇİNDE */}
        <Route element={<MainLayout />}>
          
          {/* 1. HERKESE AÇIK SAYFALAR */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />

          {/* 2. ÖĞRENCİ SAYFALARI (role_id = 3) */}
          <Route element={<ProtectedRoute allowedRoles={[3]} />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-exams" element={<StudentExamList />} />
            <Route path="/learning-path" element={<LearningPathPage />} />
            <Route path="/learning/:topicName" element={<TopicPage />} />
            <Route path="/question/:id" element={<SolveQuestionPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/take-survey/:id" element={<TakeSurveyPage />} />
            <Route path="/exam-result/:examId" element={<StudentResultPage />} />
            <Route path="/take-exam/:examId" element={<StudentExamPage />} />
          </Route>
          
          {/* 3. ÖĞRETMEN SAYFALARI (role_id = 2) */}
          <Route element={<ProtectedRoute allowedRoles={[2]} />}>
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher-analysis" element={<TeacherAnalysisPage />} />
            <Route path="/create-survey" element={<CreateSurveyPage />} />
            <Route path="/create-exam" element={<CreateExamPage />} />
            <Route path="/exams" element={<ExamListPage />} />
            <Route path="/exams/level-thresholds" element={<LevelThresholdsPage />} />
            <Route path="/exams/:examId" element={<AddQuestionPage />} />
            <Route path="/add-questions/:examId" element={<AddQuestionPage />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/create-question" element={<CreateQuestionPage />} />
            <Route path="/edit-question/:id" element={<EditQuestionPage />} />
            <Route path="/survey-stats/:surveyId" element={<SurveyStatsPage />} />
          </Route>

          {/* 4. ADMIN SAYFALARI (role_id = 1) */}
          <Route element={<ProtectedRoute allowedRoles={[1]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/approvals" element={<ApprovalsPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/announcements" element={<AnnouncementsPage />} />
            <Route path="/admin/reports" element={<ReportsManagementPage />} />
            <Route path="/admin/alerts" element={<AlertsManagementPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/admin/logs" element={<AuditLogsPage />} />
          </Route>

          {/* 5. ORTAK KORUNMUŞ SAYFALAR */}
          <Route element={<ProtectedRoute />}>
             <Route path="/profile" element={<ProfilePage />} />
             <Route path="/settings" element={<SettingsPage />} />
             <Route path="/surveys" element={<SurveysPage />} />
          </Route>

        </Route>

      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;