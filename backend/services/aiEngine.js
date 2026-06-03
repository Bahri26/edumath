const { getAiProvider, isLocalAi, isGeminiAi, isOllamaAi } = require('../config/aiProvider');
const localText = require('./localTextService');

let geminiClient = null;

function getGeminiClient() {
  if (!isGeminiAi()) return null;
  if (geminiClient) return geminiClient;
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const key = String(process.env.GEMINI_API_KEY || '').trim();
  if (!key) return null;
  geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
}

async function generateText(prompt, { model } = {}) {
  if (isLocalAi()) {
    return localText.chatReply(prompt) || 'Yerel analiz tamamlandı.';
  }
  if (isOllamaAi()) {
    const ollama = require('./ollamaService');
    return ollama.generateText(prompt, { model });
  }
  const genAI = getGeminiClient();
  if (!genAI) return localText.chatReply(prompt);
  const { DEFAULT_GEMINI_FLASH } = require('../constants/geminiDefaults');
  const m = genAI.getGenerativeModel({
    model: model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH,
  });
  const result = await m.generateContent(prompt);
  return result.response.text();
}

module.exports = {
  getAiProvider,
  isLocalAi,
  isGeminiAi,
  isOllamaAi,
  getGeminiClient,
  generateText,
};
