import api from './api';

const API_URL = '/questions'; // api instance baseURL already '/api'

/**
 * Backend'e POST isteği göndererek yeni bir soru oluşturur.
 * @param {object} questionData - Yeni soru için veriler.
 * @returns {Promise<object>} Sunucudan dönen oluşturulmuş soru verisi.
 */
export const createQuestion = async (questionData) => api.post(API_URL, questionData).then(r => r.data);

/**
 * Backend'den tüm soruları getirir.
 * @returns {Promise<object>} Sunucudan dönen sorular.
 */
export const getQuestions = async (params = {}) => api.get(API_URL, { params }).then(r => r.data);


/**
 * Backend'den belirli bir soruyu ID'ye göre getirir.
 * @param {string} questionId - Getirilecek sorunun ID'si.
 * @returns {Promise<object>} Sunucudan dönen soru verisi.
 */
export const getQuestionById = async (questionId) => api.get(`${API_URL}/${questionId}`).then(r => r.data);

/**
 * Backend'de bir soruyu günceller.
 * @param {string} questionId - Güncellenecek sorunun ID'si.
 * @param {object} questionData - Güncellenmiş soru verileri.
 * @returns {Promise<object>} Sunucudan dönen güncellenmiş soru verisi.
 */
export const updateQuestion = async (questionId, questionData) => api.put(`${API_URL}/${questionId}`, questionData).then(r => r.data);

/**
 * Backend'den bir soruyu siler.
 * @param {string} questionId - Silinecek sorunun ID'si.
 * @returns {Promise<object>} Sunucudan dönen onay mesajı.
 */
export const deleteQuestion = async (questionId) => api.delete(`${API_URL}/${questionId}`).then(r => r.data);