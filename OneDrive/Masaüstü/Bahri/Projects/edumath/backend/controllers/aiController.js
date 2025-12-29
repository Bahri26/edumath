const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");

// API Anahtarınızı .env dosyasından çekiyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MODEL SEÇİMİ: Gemini 3.0 Pro (En güçlü model)
const MODEL_NAME = "gemini-1.5-pro"; // Not: 3.0 Preview erişiminde sorun yaşarsan 'gemini-1.5-pro' yapabilirsin.

// Yardımcı Fonksiyon: Dosya işleme (Resim için)
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
}

// ------------------------------------------------------------------
// 1. 📸 FOTOĞRAFTAN SORU ÇÖZÜMÜ (Vision)
// ------------------------------------------------------------------
exports.solveFromImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Lütfen bir resim yükleyin." });

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);

    const prompt = `
      Sen uzman bir matematik öğretmenisin. 
      Görevin:
      1. Bu resimdeki soruyu metne dök (OCR).
      2. Soruyu adım adım, pedagojik bir dille çöz.
      3. Matematiksel ifadeleri LaTeX formatında yaz (örn: $x^2$).
      4. Cevabı net bir şekilde belirt.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    // Geçici dosyayı temizle
    try { fs.unlinkSync(req.file.path); } catch(e) {}

    res.json({ solution: response.text() });

  } catch (error) {
    console.error("AI Vision Hatası:", error);
    res.status(500).json({ message: "Görsel analiz edilemedi.", error: error.message });
  }
};

// ------------------------------------------------------------------
// 2. 📝 SORU HAVUZU İÇİN SORU ÜRETME (Teacher Dashboard)
// ------------------------------------------------------------------
exports.generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty, count, classLevel } = req.body;

    const schema = {
      description: "Matematik soru listesi",
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "Soru metni, LaTeX içerir" },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "4 adet seçenek (A, B, C, D)"
          },
          correctAnswer: { type: SchemaType.STRING, description: "Doğru cevabın tam metni" },
          subject: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING },
          classLevel: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Sorunun çözüm adımları" }
        },
        required: ["text", "options", "correctAnswer", "subject", "difficulty", "explanation"]
      }
    };

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3
      },
    });

    const prompt = `
      Konu: ${topic}
      Zorluk: ${difficulty}
      Sınıf: ${classLevel}
      Adet: ${count}
      Bu kriterlere uygun matematik soruları oluştur. Seçenekler string array olsun.
    `;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    // Frontend formatına uyum
    const formattedData = parsedData.map(q => ({
      ...q,
      type: "multiple-choice",
      subject: topic,
      classLevel: classLevel
    }));

    res.json(formattedData);

  } catch (error) {
    console.error("Soru Üretme Hatası:", error);
    res.status(500).json({ message: "Soru üretilemedi." });
  }
};

// ------------------------------------------------------------------
// 3. 🤖 EKSİK KAPATMA / ALIŞTIRMA (Student Dashboard)
// ------------------------------------------------------------------
exports.generatePracticeQuestions = async (req, res) => {
  try {
    const { weakTopics } = req.body;

    if (!weakTopics || weakTopics.length === 0) {
      return res.status(200).json({ questions: [], message: "Eksik konu bulunamadı." });
    }

    const schema = {
      description: "Telafi alıştırma soruları",
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Öğrenciye konuyu öğreten detaylı açıklama" }
        },
        required: ["text", "options", "correctAnswer", "explanation"]
      }
    };

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const prompt = `
      Öğrenci şu konularda başarısız oldu: ${weakTopics.join(", ")}.
      Bu zayıf noktaları hedefleyen, öğretici nitelikte 5 adet orta seviye soru hazırla.
    `;

    const result = await model.generateContent(prompt);
    const questions = JSON.parse(result.response.text());

    res.json({ questions });

  } catch (error) {
    console.error("Alıştırma Üretme Hatası:", error);
    res.status(500).json({ message: "Alıştırma hazırlanamadı." });
  }
};

// ------------------------------------------------------------------
// 4. 📊 PERFORMANS ANALİZİ
// ------------------------------------------------------------------
exports.analyzePerformance = async (req, res) => {
  try {
    const { examHistory, studentName } = req.body;
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Öğrenci Adı: ${studentName || "Öğrenci"}
      Sınav Geçmişi: ${JSON.stringify(examHistory)}
      Bir eğitim koçu gibi davran. Gelişimi yorumla, eksikleri bul, 3 tavsiye ver. Markdown formatında yaz.
    `;
    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (error) {
    res.status(500).json({ message: "Analiz yapılamadı." });
  }
};

// 5. 📅 KİŞİSELLEŞTİRİLMİŞ ÇALIŞMA PLANI (Study Plan) - EKSİK OLAN PARÇA
// ------------------------------------------------------------------
exports.createStudyPlan = async (req, res) => {
  try {
    const { goal, hoursPerDay, daysLeft, weakTopics } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Planlama için Pro daha iyidir

    const prompt = `
      Öğrenci Hedefi: ${goal}
      Sınava Kalan Gün: ${daysLeft}
      Günlük Çalışma Saati: ${hoursPerDay}
      Zayıf Olduğu Konular: ${weakTopics ? weakTopics.join(", ") : "Genel tekrar"}

      Görevin: Bu öğrenci için gün gün ayrılmış, gerçekçi ve motive edici bir çalışma programı hazırla.
      Zayıf konularına öncelik ver. Her gün için mola sürelerini de ekle.
      Çıktıyı Markdown formatında, tablolar veya maddeler kullanarak şık bir şekilde ver.
    `;

    const result = await model.generateContent(prompt);
    res.json({ plan: result.response.text() });

  } catch (error) {
    console.error("Plan Oluşturma Hatası:", error);
    res.status(500).json({ message: "Plan oluşturulamadı." });
  }
};