import apiClient from './api';

// ✅ YENİ ANKET OLUŞTUR (Öğretmen)
export const createSurvey = async (surveyData) => {
  try {
    const response = await apiClient.post('/surveys', surveyData);
    return response.data;
  } catch (error) {
    console.error('Create survey error:', error);
    throw error;
  }
};

// ✅ ÖĞRETMENİN ANKETLERİNİ GETİR
export const getMySurveys = async () => {
  try {
    // Backend GET /surveys returns teacher's own surveys when role=teacher
    const response = await apiClient.get('/surveys');
    const arr = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return { surveys: arr };
  } catch (error) {
    console.error('Get my surveys error:', error);
    throw error;
  }
};

// ✅ ANKET DETAYINI GETİR
export const getSurveyById = async (surveyId) => {
  try {
    const response = await apiClient.get(`/surveys/${surveyId}`);
    return response.data;
  } catch (error) {
    console.error('Get survey by id error:', error);
    throw error;
  }
};

// ✅ ANKET İSTATİSTİKLERİNİ GETİR
export const getSurveyStats = async (surveyId) => {
  try {
    const response = await apiClient.get(`/surveys/${surveyId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Get survey stats error:', error);
    throw error;
  }
};

// ✅ ANKETİ SİL (Öğretmen)
export const deleteSurvey = async (surveyId) => {
  try {
    const response = await apiClient.delete(`/surveys/${surveyId}`);
    return response.data;
  } catch (error) {
    console.error('Delete survey error:', error);
    throw error;
  }
};

// ✅ ÖĞRENCİNİN CEVAPLAYABİLECEĞİ ANKETLERİ GETİR
export const getAvailableSurveys = async () => {
  try {
    const response = await apiClient.get('/surveys/student/available');
    return response.data;
  } catch (error) {
    console.error('Get available surveys error:', error);
    throw error;
  }
};

// ✅ ANKETE CEVAP VER (Öğrenci)
export const submitSurveyResponse = async (surveyId, answers) => {
  try {
    const response = await apiClient.post(`/surveys/${surveyId}/respond`, { answers });
    return response.data;
  } catch (error) {
    console.error('Submit survey response error:', error);
    throw error;
  }
};

// ✅ ÖĞRENCİNİN TAMAMLADIĞI ANKETLERİ GETİR
export const getMyCompletedSurveys = async () => {
  try {
    const response = await apiClient.get('/surveys/student/my-surveys');
    return response.data;
  } catch (error) {
    console.error('Get my completed surveys error:', error);
    throw error;
  }
};
