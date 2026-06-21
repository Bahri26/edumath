import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../pages/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RouteLoadingFallback from '../components/ui/RouteLoadingFallback';
import {
  useTeacherNavItems,
  useTeacherProfileExtras,
  useStudentNavItems,
  useStudentProfileExtras,
} from '../hooks/useDashboardNav';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const NotFound = lazy(() => import('../pages/common/NotFound'));
const SettingsPage = lazy(() => import('../pages/common/SettingsPage'));
const ExamsPage = lazy(() => import('../pages/common/ExamsPage'));
const SurveysPage = lazy(() => import('../pages/common/SurveysPage'));
const ProfilePage = lazy(() => import('../pages/common/ProfilePage'));
const ResetPassword = lazy(() => import('../pages/common/ResetPassword'));
const LegalPage = lazy(() => import('../pages/common/LegalPage'));
const AudienceLandingPage = lazy(() => import('../pages/AudienceLandingPage'));

const TeacherHome = lazy(() => import('../pages/teacher/TeacherHome'));
const QuestionBank = lazy(() => import('../pages/teacher/QuestionBank'));
const TeacherExamsPage = lazy(() => import('../pages/teacher/TeacherExamsPage'));
const TeacherExerciseCreator = lazy(() => import('../pages/teacher/TeacherExerciseCreator'));
const SkillTreeBuilder = lazy(() => import('../pages/teacher/SkillTreeBuilder'));
const StudentProgressDashboard = lazy(() => import('../pages/teacher/StudentProgressDashboard'));
const TeacherReports = lazy(() => import('../pages/teacher/TeacherReports'));
const PatternTemplateBuilder = lazy(() => import('../pages/teacher/PatternTemplateBuilder'));

const StudentHome = lazy(() => import('../pages/student/StudentHome'));
const StudentCourses = lazy(() => import('../pages/student/StudentCourses'));
const StudentAssignments = lazy(() => import('../pages/student/StudentAssignments'));
const StudentStudyHub = lazy(() => import('../pages/student/StudentStudyHub'));
const StudentExercisePlayer = lazy(() => import('../pages/student/StudentExercisePlayer'));
const LessonQuiz = lazy(() => import('../pages/student/LessonQuiz'));
const StudentCalendar = lazy(() => import('../pages/student/StudentCalendar'));
const StudentMessaging = lazy(() => import('../pages/student/StudentMessaging'));

const AdminResetRequests = lazy(() => import('../pages/admin/AdminResetRequests'));
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminAuditLog = lazy(() => import('../pages/admin/AdminAuditLog'));
const AdminUserActivity = lazy(() => import('../pages/admin/AdminUserActivity'));
const AdminBranchRequests = lazy(() => import('../pages/admin/AdminBranchRequests'));

function TeacherShell() {
  const navMenuItems = useTeacherNavItems();
  const profileMenuExtras = useTeacherProfileExtras();
  return (
    <DashboardLayout role="teacher" navMenuItems={navMenuItems} profileMenuExtras={profileMenuExtras} />
  );
}

function StudentShell() {
  const navMenuItems = useStudentNavItems();
  const profileMenuExtras = useStudentProfileExtras();
  return (
    <DashboardLayout role="student" navMenuItems={navMenuItems} profileMenuExtras={profileMenuExtras} />
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/students" element={<AudienceLandingPage audience="student" />} />
        <Route path="/teachers" element={<AudienceLandingPage audience="teacher" />} />
        <Route path="/research" element={<AudienceLandingPage audience="research" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/legal/:docType" element={<LegalPage />} />

        <Route
          path="/teacher"
          element={(
            <ProtectedRoute requiredRole="teacher">
              <TeacherShell />
            </ProtectedRoute>
          )}
        >
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

        <Route
          path="/student"
          element={(
            <ProtectedRoute requiredRole="student">
              <StudentShell />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentHome />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="exercises" element={<StudentStudyHub />} />
          <Route path="exercises/:exerciseId" element={<StudentExercisePlayer />} />
          <Route path="lesson/:lessonId" element={<LessonQuiz />} />
          <Route path="calendar" element={<StudentCalendar />} />
          <Route path="messages" element={<StudentMessaging />} />
          <Route path="surveys" element={<SurveysPage role="student" />} />
          <Route path="quizzes" element={<ExamsPage role="student" />} />
          <Route path="settings" element={<SettingsPage role="student" />} />
          <Route path="profile" element={<ProfilePage role="student" />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="reset-requests" element={<AdminResetRequests />} />
          <Route path="branch-requests" element={<AdminBranchRequests />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="user-activity" element={<AdminUserActivity />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
