const { GoogleGenerativeAI } = require("@google/generative-ai");
const { DEFAULT_GEMINI_FLASH } = require('../constants/geminiDefaults');

// API Anahtarını al
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body; // Frontend'den gelen mesaj

    if (!message) {
      return res.status(400).json({ message: "Mesaj boş olamaz." });
    }

    // Modeli seç (Gemini 1.5 Flash hızlı ve ekonomiktir)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH,
    });

    // AI'ya kimlik kazandır (System Prompt)
    const prompt = `
      Sen "Edumath" adında bir eğitim platformunun yardımsever ve neşeli yapay zeka asistanısın.
      Görevin öğrencilere matematik konularında rehberlik etmek, siteyi tanıtmak ve motive etmek.
      Cevapların kısa, anlaşılır ve Türkçe olsun. Matematik sorularını adım adım çöz.
      
      Öğrencinin sorusu: ${message}
    `;

    // AI'dan cevap iste
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Cevabı Frontend'e gönder
    res.json({ reply: text });

  } catch (error) {
    console.error("AI Hatası:", error);
    res.status(500).json({ reply: "Üzgünüm, şu an bağlantımda bir sorun var. Biraz sonra tekrar dener misin? 🤖" });
  }
};