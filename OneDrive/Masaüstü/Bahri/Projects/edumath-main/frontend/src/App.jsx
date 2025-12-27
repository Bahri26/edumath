import StudentExamAnalysis from './pages/student/StudentExamAnalysis';
import TeacherExamReport from './pages/teacher/TeacherExamReport';
import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// --- 1. LAYOUTS (ÇERÇEVELER) ---
import LandingPage from './pages/LandingPage';
import TeacherDashboardLayout from './pages/TeacherDashboardLayout';
import StudentDashboardLayout from './pages/StudentDashboardLayout';

// --- 2. ORTAK SAYFALAR (COMMON) ---
import NotFound from './pages/common/NotFound';
import SettingsPage from './pages/common/SettingsPage';
import ExamsPage from './pages/common/ExamsPage';
import SurveysPage from './pages/common/SurveysPage'; // 🚨 GÜNCEL: Ortak Anket Sayfası
import ProfilePage from './pages/common/ProfilePage';

// --- 3. ÖĞRETMEN SAYFALARI ---
import TeacherHome from './pages/teacher/TeacherHome';
import QuestionBank from './pages/teacher/QuestionBank';
import TeacherExamsPage from './pages/teacher/TeacherExamsPage';
import TeacherMyExams from './pages/teacher/TeacherMyExams';
import TeacherExerciseCreator from './pages/teacher/TeacherExerciseCreator';
import TeacherReports from './pages/teacher/TeacherReports';
// import TeacherSurveys... -> ARTIK GEREK YOK (Ortak sayfayı kullanacağız)

// --- 4. ÖĞRENCİ SAYFALARI ---
import StudentHome from './pages/student/StudentHome';
import StudentCourses from './pages/student/StudentCourses';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentPracticeExercises from './pages/student/StudentPracticeExercises';
import StudentCalendar from './pages/student/StudentCalendar';
import StudentLeaderboard from './pages/student/StudentLeaderboard';
import StudentSettings from './pages/student/StudentSettings';
// import StudentSurveys... -> ARTIK GEREK YOK (Ortak sayfayı kullanacağız)

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Routes>
          {/* =========================================================
              ANA SAYFA (LANDING PAGE)
             ========================================================= */}
          <Route path="/" element={<LandingPage />} />

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
            <Route path="my-exams" element={<TeacherMyExams />} />
            <Route path="exercises" element={<TeacherExerciseCreator />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="surveys" element={<SurveysPage role="teacher" />} />
            <Route path="settings" element={<SettingsPage role="teacher" />} />
            <Route path="profile" element={<ProfilePage role="teacher" />} />
             {/* Öğretmen sınav raporu */}
             <Route path="exams/:examId/report" element={<TeacherExamReport />} />
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

             {/* Öğrenci sınav analiz */}
             <Route path="exams/:examId/analysis" element={<StudentExamAnalysis />} />

            {/* 🚨 GÜNCEL: Ortak Anket Sayfası (Rol: Student) */}
            <Route path="surveys" element={<SurveysPage role="student" />} />
            
            {/* Diğer Ortak Sayfalar */}
            <Route path="quizzes" element={<ExamsPage role="student" />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="profile" element={<ProfilePage role="student" />} />
          </Route>

          {/* =========================================================
              404 - SAYFA BULUNAMADI
             ========================================================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;