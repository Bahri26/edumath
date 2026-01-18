import apiClient from './api';

// ✅ ÖĞRETMEN İSTATİSTİKLERİNİ GETİR
export const getTeacherStats = async () => {
  try {
    const response = await apiClient.get('/teacher/stats');
    return response.data;
  } catch (error) {
    console.error('Teacher stats error:', error);
    // Hata durumunda sıfır değerler döndür
    return {
      totalStudents: 0,
      totalQuestions: 0,
      totalSurveys: 0,
      classAverage: 0,
      topTopic: 'Belirtilmedi',
      activeExams: 0
    };
  }
};

// ✅ SINIF RAPORLARINI GETİR
export const getClassReports = async () => {
  try {
    const response = await apiClient.get('/teacher/reports');
    return response.data;
  } catch (error) {
    console.error('Class reports error:', error);
    throw error;
  }
};

// ✅ ÖĞRETMENİN SORULARINI GETİR
export const getMyQuestions = async () => {
  try {
    const response = await apiClient.get('/teacher/questions');
    return response.data;
  } catch (error) {
    console.error('My questions error:', error);
    throw error;
  }
};

// ✅ ÖĞRETMENİN BRANŞINA GÖRE SORU BANKASI (onaylı branş gerekli)
export const getSubjectQuestions = async (params = {}) => {
  try {
    const response = await apiClient.get('/teacher/subject/questions', { params });
    return response.data; // { success, data, total, page, totalPages }
  } catch (error) {
    console.error('Subject questions error:', error);
    throw error;
  }
};

// ✅ ÖĞRETMENİN ANKETLERİNİ GETİR
export const getMySurveys = async () => {
  try {
    const response = await apiClient.get('/teacher/surveys');
    return response.data;
  } catch (error) {
    console.error('My surveys error:', error);
    throw error;
  }
};

// ✅ SINIF ÖĞRENCİLERİNİ GETİR
export const getClassStudents = async () => {
  try {
    const response = await apiClient.get('/teacher/students');
    return response.data;
  } catch (error) {
    console.error('Class students error:', error);
    throw error;
  }
};

// ✅ ÖĞRENCİ DETAYLARINI GETİR
export const getStudentDetails = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Student details error:', error);
    throw error;
  }
};

// ✅ DASHBOARD ÖZETİNİ GETİR
export const getDashboardSummary = async () => {
  try {
    const response = await apiClient.get('/teacher/dashboard-summary');
    return response.data;
  } catch (error) {
    console.error('Dashboard summary error:', error);
    throw error;
  }
};

// ✅ ÖĞRETMENİN SINAVLARINI GETİR
export const getMyExams = async () => {
  try {
    const response = await apiClient.get('/teacher/my-exams');
    return response.data;
  } catch (error) {
    console.error('My exams error:', error);
    throw error;
  }
};
