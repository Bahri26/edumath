const Question = require('../models/Question');
const { collectTopicStats } = require('./studentAnalyticsService');
const localText = require('./localTextService');
const { isLocalAi } = require('../config/aiProvider');

/**
 * Öğrenci cevabını yerel istatistik + soru bankası ile analiz eder.
 */
async function analyzeAndSuggest(studentAnswer, topic, studentId) {
  const { weakTopics, entries } = await collectTopicStats(studentId);
  const analysis = localText.buildAnswerAnalysis({
    answer: studentAnswer,
    topic: topic || 'Matematik',
    weakTopics,
  });

  const matchQuery = topic ? { topic: { $regex: topic, $options: 'i' } } : {};
  const suggested = await Question.aggregate([
    { $match: matchQuery },
    { $sample: { size: 1 } },
  ]);
  const suggestedQuestion = suggested[0] || null;

  if (!isLocalAi()) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const { DEFAULT_GEMINI_FLASH } = require('../constants/geminiDefaults');
      const key = process.env.GEMINI_API_KEY;
      if (key) {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH,
        });
        const result = await model.generateContent([
          'Sen bir matematik öğretmenisin. Öğrencinin cevabını analiz et ve eksikleri belirt.',
          `Öğrenci cevabı: ${studentAnswer}\nKonu: ${topic}`,
        ]);
        return {
          analysis: result.response.text(),
          suggestedQuestion,
          topicStats: entries,
          provider: 'gemini',
        };
      }
    } catch (e) {
      console.warn('analyzeAndSuggest gemini fallback:', e?.message);
    }
  }

  return {
    analysis,
    suggestedQuestion,
    topicStats: entries,
    weakTopics,
    provider: 'local',
  };
}

module.exports = { analyzeAndSuggest };
