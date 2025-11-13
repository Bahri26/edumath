import api from './api';

// Teacher perspective: list all students across teacher's classes
export async function getTeacherStudents() {
  return api.get('/teacher/students').then(r => r.data);
}

// Öğrencinin kendi sonuçlarını getir
export async function getStudentResults() {
  return api.get('/results/my-results').then(r => r.data);
}
