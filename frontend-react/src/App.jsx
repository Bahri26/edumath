import React from 'react';
import { Routes, Route } from 'react-router-dom'; 

import Layout from './components/Layout'; 
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionPool from './pages/teacher/QuestionPool';
import ExamList from './pages/teacher/ExamList';
import CreateExam from './pages/teacher/CreateExam';
import TeacherStudents from './pages/teacher/TeacherStudents';
import SurveyManagement from './pages/teacher/SurveyManagement';
import TeacherClasses from './pages/teacher/TeacherClasses';
import ClassGradeDetail from './pages/teacher/ClassGradeDetail';

import NotFound from './pages/NotFound'; 
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExamInterface from './pages/student/StudentExamInterface'

function App() {
  return (
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
          <Route path="/teacher/surveys" element={<SurveyManagement />} />
        </Route>

        <Route path="/student/dashboard" element={<StudentDashboard />} /> 
        <Route path="/student/exam/:examId" element={<StudentExamInterface />} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
