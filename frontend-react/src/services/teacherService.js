// frontend-react/src/services/teacherService.js
import api from './api';

const TEACHER_API_URL = '/teacher';

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async () => {
  const response = await api.get(`${TEACHER_API_URL}/dashboard-stats`);
  return response.data;
};

/**
 * Get all students across teacher's classes
 */
export const getMyStudents = async () => {
  const response = await api.get(`${TEACHER_API_URL}/students`);
  return response.data;
};

/**
 * Remove a student from a class
 */
export const removeStudentFromClass = async (studentId, classId) => {
  const response = await api.post(`${TEACHER_API_URL}/students/remove`, {
    studentId,
    classId
  });
  return response.data;
};

/**
 * Seed demo data for testing (development only)
 */
export const seedDemoData = async () => {
  const response = await api.post(`${TEACHER_API_URL}/seed-demo-data`);
  return response.data;
};
