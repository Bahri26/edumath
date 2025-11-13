import React from 'react';
import { Routes, Route } from 'react-router-dom'; 
import { Toaster } from 'react-hot-toast';

// Kids temalı yeni layout'a yönlendirme
import Layout from './components/layout/Layout.jsx'; 
import RoleProtectedRoute from "./components/features/auth/RoleProtectedRoute";

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionPool from './pages/teacher/QuestionPool';
import ExamList from './pages/teacher/ExamList';
import CreateExam from './pages/teacher/CreateExam';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherSurveys from './pages/teacher/TeacherSurveys';
import TeacherSurveyResults from './pages/teacher/TeacherSurveyResults';
import TeacherClasses from './pages/teacher/TeacherClasses';
import ClassGradeDetail from './pages/teacher/ClassGradeDetail';

import NotFound from './pages/NotFound'; 
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExams from './pages/student/StudentExams';
import StudentResults from './pages/student/StudentResults';
import StudentExamInterface from './pages/student/StudentExamInterface';
import StudentSurveys from './pages/student/StudentSurveys';
import StudentSurveyFill from './pages/student/StudentSurveyFill';
import InteractiveLearning from './pages/student/InteractiveLearning';
import ExercisesPage from './pages/student/ExercisesPage';
import ExercisePlayer from './pages/student/ExercisePlayer';
import AnalyticsPage from './pages/student/AnalyticsPage';
import StreakPage from './pages/student/StreakPage';

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route element={<RoleProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/questions" element={<QuestionPool />} />
          <Route path="/teacher/question-pool" element={<QuestionPool />} />
          <Route path="/teacher/questions/edit/:examId" element={<QuestionPool />} />
          
          <Route path="/teacher/exams" element={<ExamList />} />
          <Route path="/teacher/exams/create" element={<CreateExam />} />
          
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/classes/:gradeLevel" element={<ClassGradeDetail />} />
          
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/surveys" element={<TeacherSurveys />} />
          <Route path="/teacher/surveys/:id/results" element={<TeacherSurveyResults />} />
        </Route>

        <Route path="/student/dashboard" element={<StudentDashboard />} /> 
        <Route path="/student/exams" element={<StudentExams />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/surveys" element={<StudentSurveys />} />
        <Route path="/student/surveys/:id" element={<StudentSurveyFill />} />
        <Route path="/student/exam/:examId" element={<StudentExamInterface />} />
        <Route path="/student/interactive" element={<InteractiveLearning />} />
        <Route path="/student/exercises" element={<ExercisesPage />} />
        <Route path="/student/exercise/:id" element={<ExercisePlayer />} />
        <Route path="/student/analytics" element={<AnalyticsPage />} />
        <Route path="/student/streak" element={<StreakPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
