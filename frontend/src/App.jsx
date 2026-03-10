import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Sayfaları
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Common Sayfaları
import HomePage from './pages/common/HomePage';
import ProfilePage from './pages/common/ProfilePage';
import SettingsPage from './pages/common/SettingsPage';
import SurveysPage from './pages/common/SurveysPage';
import TakeSurveyPage from './pages/common/TakeSurveyPage';
import SurveyStatsPage from './pages/common/SurveyStatsPage';
import StudentsPage from './pages/common/StudentsPage';
import TeachersPage from './pages/common/TeachersPage';
import CurriculumPage from './pages/common/CurriculumPage';

// Student Sayfaları
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExamList from './pages/student/StudentExamList';
import StudentExamPage from './pages/student/StudentExamPage';
import StudentResultPage from './pages/student/StudentResultPage';
import LearningPathPage from './pages/student/LearningPathPage';
import TopicPage from './pages/student/TopicPage'; // topicName route
import SolveQuestionPage from './pages/student/SolveQuestionPage';
import ShopPage from './pages/student/ShopPage';

// Teacher Sayfaları
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExamPage from './pages/teacher/CreateExamPage';
import ExamListPage from './pages/teacher/ExamListPage';
import QuestionBankPage from './pages/teacher/QuestionBankPage';
import CreateQuestionPage from './pages/teacher/CreateQuestionPage';
import EditQuestionPage from './pages/teacher/EditQuestionPage';
import AddQuestionPage from './pages/teacher/AddQuestionPage';
import TeacherAnalysisPage from './pages/teacher/TeacherAnalysisPage';
import CreateSurveyPage from './pages/teacher/CreateSurveyPage';
import LevelThresholdsPage from './pages/teacher/LevelThresholdsPage';

// Admin Sayfaları
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ReportsManagementPage from './pages/admin/ReportsManagementPage';
import AlertsManagementPage from './pages/admin/AlertsManagementPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </Router>
  );
}

export default App;