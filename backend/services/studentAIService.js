const { GoogleGenerativeAI } = require("@google/generative-ai");
const Question = require("../models/Question");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Öğrenci cevabını analiz eder ve uygun yeni soru önerir.
 * @param {string} studentAnswer - Öğrencinin cevabı
 * @param {string} topic - Soru konusu
 * @param {string} studentId - Öğrenci ID
 * @returns {Promise<{analysis: string, suggestedQuestion: object}>}
 */
async function analyzeAndSuggest(studentAnswer, topic, studentId) {
  // 1. Cevabı analiz et
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = `Sen bir matematik öğretmenisin. Öğrencinin verdiği cevabı analiz et ve eksik/hatalı noktaları belirt. Sonra aynı konuda yeni bir soru öner.`;

  const result = await model.generateContent([
    prompt,
    `Öğrenci cevabı: ${studentAnswer}\nKonu: ${topic}`
  ]);
  const response = await result.response;
  const analysisText = response.text();

  // 2. Aynı konudan yeni soru öner (veritabanından veya LLM'den)
  // Burada örnek olarak veritabanından rastgele bir soru çekiyoruz
  const suggested = await Question.aggregate([
    { $match: { subject: topic } },
    { $sample: { size: 1 } }
  ]);
  const suggestedQuestion = suggested[0] || null;

  return {
    analysis: analysisText,
    suggestedQuestion
  };
}

module.exports = { analyzeAndSuggest };