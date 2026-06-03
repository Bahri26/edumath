const localText = require('../services/localTextService');
const { isLocalAi, isOllamaAi } = require('../config/aiProvider');

exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Mesaj boş olamaz.' });
    }

    if (isLocalAi()) {
      return res.json({
        reply: localText.chatReply(message),
        provider: 'local',
      });
    }

    if (isOllamaAi()) {
      try {
        const ollama = require('../services/ollamaService');
        const reply = await ollama.generateText(
          `Sen EduMath eğitim asistanısın. Kısa ve Türkçe yanıt ver.\n\nSoru: ${message}`
        );
        return res.json({ reply, provider: 'ollama' });
      } catch (e) {
        return res.json({
          reply: localText.chatReply(message),
          provider: 'local-fallback',
        });
      }
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const { DEFAULT_GEMINI_FLASH } = require('../constants/geminiDefaults');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH,
    });

    const prompt = `
      Sen "Edumath" adında bir eğitim platformunun yardımsever ve neşeli yapay zeka asistanısın.
      Görevin öğrencilere matematik konularında rehberlik etmek, siteyi tanıtmak ve motive etmek.
      Cevapların kısa, anlaşılır ve Türkçe olsun. Matematik sorularını adım adım çöz.
      
      Öğrencinin sorusu: ${message}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ reply: text, provider: 'gemini' });
  } catch (error) {
    console.error('AI Hatası:', error);
    res.json({
      reply: localText.chatReply(req.body?.message || ''),
      provider: 'local-fallback',
    });
  }
};
