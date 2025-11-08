import axios from 'axios';

const API_URL = '/api/questions'; // Soru ile ilgili API çağrıları için temel URL

/**
 * Backend'e POST isteği göndererek yeni bir soru oluşturur.
 * @param {object} questionData - Yeni soru için veriler.
 * @returns {Promise<object>} Sunucudan dönen oluşturulmuş soru verisi.
 */
export const createQuestion = async (questionData) => {
  // Backend endpoint'i POST isteği için '/api/questions'
  const response = await axios.post(API_URL, questionData);
  return response.data;
};

/**
 * Backend'den tüm soruları getirir.
 * @returns {Promise<object>} Sunucudan dönen sorular.
 */
export const getQuestions = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};


/**
 * Backend'den belirli bir soruyu ID'ye göre getirir.
 * @param {string} questionId - Getirilecek sorunun ID'si.
 * @returns {Promise<object>} Sunucudan dönen soru verisi.
 */
export const getQuestionById = async (questionId) => {
  const response = await axios.get(`${API_URL}/${questionId}`);
  return response.data;
};

/**
 * Backend'de bir soruyu günceller.
 * @param {string} questionId - Güncellenecek sorunun ID'si.
 * @param {object} questionData - Güncellenmiş soru verileri.
 * @returns {Promise<object>} Sunucudan dönen güncellenmiş soru verisi.
 */
export const updateQuestion = async (questionId, questionData) => {
  const response = await axios.put(`${API_URL}/${questionId}`, questionData);
  return response.data;
};

/**
 * Backend'den bir soruyu siler.
 * @param {string} questionId - Silinecek sorunun ID'si.
 * @returns {Promise<object>} Sunucudan dönen onay mesajı.
 */
export const deleteQuestion = async (questionId) => {
  const response = await axios.delete(`${API_URL}/${questionId}`);
  return response.data;
};