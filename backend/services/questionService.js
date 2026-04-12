// services/questionService.js

const Question = require('../models/Question');

// 1. Tüm Soruları Getir
const getAllQuestions = async (filter = {}) => {
  // Filtre varsa (örn: sadece matematik soruları) uygular, yoksa hepsini getirir.
  // .populate('teacherId', 'name') -> Soruyu ekleyen öğretmenin sadece ismini getirir.
  // .sort({ createdAt: -1 }) -> En yeni eklenen en üstte görünür.
  return await Question.find(filter)
    .populate('teacherId', 'name email') 
    .sort({ createdAt: -1 });
};

// 2. Tek Bir Soruyu Getir (ID'ye göre)
const getQuestionById = async (id) => {
  return await Question.findById(id).populate('teacherId', 'name');
};

// 3. Yeni Soru Oluştur
const createQuestion = async (questionData) => {
  return await Question.create(questionData);
};

// 4. Soru Güncelle
const updateQuestion = async (id, updateData) => {
  return await Question.findByIdAndUpdate(id, updateData, { new: true });
};

// 5. Soru Sil
const deleteQuestion = async (id) => {
  return await Question.findByIdAndDelete(id);
};

module.exports = {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
};