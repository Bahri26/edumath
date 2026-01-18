
// 7. GELİŞMİŞ SINAV SONUCU DEĞERLENDİRME & ANALİZ
exports.examResultAnalysis = async (req, res) => {
  try {
    const { answers, examId, studentId } = req.body;
    if (!answers || !Array.isArray(answers) || !studentId) {
      return res.status(400).json({ message: "Eksik parametre." });
    }
    let total = 0, correct = 0, totalTime = 0;
    let feedbacks = [], topicStats = {}, slowQuestions = [];
    for (const ans of answers) {
      const isCorrect = ans.answer === ans.correctAnswer;
      if (isCorrect) correct++;
      total++;
      // Süre (ms cinsinden bekleniyor)
      if (ans.timeMs) totalTime += ans.timeMs;
      // Konu istatistiği
      const topic = ans.topic || "Bilinmeyen";
      if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;
      // Yavaş çözülen sorular
      if (ans.timeMs && ans.timeMs > 60000) slowQuestions.push(ans.questionId);
      feedbacks.push({
        questionId: ans.questionId,
        isCorrect,
        feedback: isCorrect ? "Doğru cevap!" : `Yanlış. Doğru cevap: ${ans.correctAnswer}`,
        timeMs: ans.timeMs || null,
        topic
      });
    }
    const score = Math.round((correct / total) * 100);
    // Konu bazlı başarı
    const topicReport = Object.entries(topicStats).map(([topic, stat]) => ({
      topic,
      correct: stat.correct,
      total: stat.total,
      percent: Math.round((stat.correct / stat.total) * 100)
    }));
    // Genel analiz için LLM ile özet
    let analysis = "";
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `Bir öğrencinin matematik sınavı sonuçları:\nToplam: ${correct}/${total} doğru.\nKonu bazlı: ${JSON.stringify(topicReport)}\nYavaş çözülen sorular: ${slowQuestions.join(", ")}\nKısa bir analiz ve 2 öneri ver.`;
      const result = await model.generateContent(prompt);
      analysis = result.response.text();
    } catch (e) { analysis = "AI analiz başarısız."; }
    res.json({ score, correct, total, totalTimeMs: totalTime, feedbacks, topicReport, slowQuestions, analysis });
  } catch (error) {
    res.status(500).json({ message: "Sınav sonucu analiz edilemedi.", error: error.message });
  }
};

// 9. TEACHER REPORT: Öğretmen için detaylı rapor
exports.teacherReport = async (req, res) => {
  try {
    const { examResults } = req.body; // [{studentId, answers: [{questionId, answer, correctAnswer, topic, timeMs}]}]
    if (!examResults || !Array.isArray(examResults)) {
      return res.status(400).json({ message: "Eksik parametre." });
    }
    let allStats = {}, allSlow = {}, allScores = [];
    for (const result of examResults) {
      let correct = 0, total = 0, totalTime = 0, topicStats = {};
      for (const ans of result.answers) {
        const isCorrect = ans.answer === ans.correctAnswer;
        if (isCorrect) correct++;
        total++;
        if (ans.timeMs) totalTime += ans.timeMs;
        const topic = ans.topic || "Bilinmeyen";
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total++;
        if (isCorrect) topicStats[topic].correct++;
        if (ans.timeMs && ans.timeMs > 60000) {
          if (!allSlow[result.studentId]) allSlow[result.studentId] = [];
          allSlow[result.studentId].push(ans.questionId);
        }
      }
      const score = Math.round((correct / total) * 100);
      allScores.push({ studentId: result.studentId, score, totalTimeMs: totalTime });
      for (const [topic, stat] of Object.entries(topicStats)) {
        if (!allStats[topic]) allStats[topic] = { total: 0, correct: 0 };
        allStats[topic].total += stat.total;
        allStats[topic].correct += stat.correct;
      }
    }
    // Konu bazlı genel başarı
    const topicReport = Object.entries(allStats).map(([topic, stat]) => ({
      topic,
      correct: stat.correct,
      total: stat.total,
      percent: Math.round((stat.correct / stat.total) * 100)
    }));
    // LLM ile özet
    let summary = "";
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `Bir matematik sınavında tüm öğrencilerin sonuçları:\nKonu bazlı başarı: ${JSON.stringify(topicReport)}\nÖğrenci skorları: ${JSON.stringify(allScores)}\nYavaş çözülen sorular: ${JSON.stringify(allSlow)}\nÖğretmen için kısa bir özet ve öneriler ver.`;
      const result = await model.generateContent(prompt);
      summary = result.response.text();
    } catch (e) { summary = "AI özet başarısız."; }
    res.json({ topicReport, allScores, allSlow, summary });
  } catch (error) {
    res.status(500).json({ message: "Teacher report oluşturulamadı.", error: error.message });
  }
};

// 8. SORU ÇÖZERKEN İPUCU VEREN AI
exports.getHint = async (req, res) => {
  try {
    const { questionText, studentAnswer } = req.body;
    if (!questionText) return res.status(400).json({ message: "Soru metni gerekli." });
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Bir öğrenci şu soruyu çözüyor: ${questionText}\nÖğrencinin cevabı: ${studentAnswer || "Henüz cevap yok"}\nKısa, yol gösterici bir ipucu ver. Cevabı açıkça söyleme.`;
    const result = await model.generateContent(prompt);
    res.json({ hint: result.response.text() });
  } catch (error) {
    res.status(500).json({ message: "İpucu üretilemedi.", error: error.message });
  }
};
// 6. 🧑‍🎓 ÖĞRENCİ CEVABI ANALİZ & KİŞİSELLEŞTİRİLMİŞ SORU ÖNERİSİ
const { analyzeAndSuggest } = require("../services/studentAIService");

// POST /api/ai/analyze-and-suggest
exports.analyzeAndSuggest = async (req, res) => {
  try {
    const { answer, studentId } = req.body;
    const topic = "Örüntüler";
    if (!answer || !studentId) {
      return res.status(400).json({ message: "Eksik parametre." });
    }
    const result = await analyzeAndSuggest(answer, topic, studentId);
    res.json(result);
  } catch (error) {
    console.error("analyzeAndSuggest Hatası:", error);
    res.status(500).json({ message: "Cevap analiz edilemedi.", error: error.message });
  }
};
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");
const pathLib = require('path');

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
// 1.b 🧠 AKILLI GÖRSEL PARSE (Vision -> Structured JSON)
// UI: SmartPasteModal /ai/smart-parse
// Dönen veri: { text, options[4], correctAnswer, solution, subject, classLevel, difficulty }
// ------------------------------------------------------------------
exports.smartParse = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Lütfen bir resim yükleyin." });

    const imageUrl = `/uploads/temp/${pathLib.basename(req.file.path)}`;
    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);

    const schema = {
      description: "Tek bir soru şeması",
      type: SchemaType.OBJECT,
      properties: {
        text: { type: SchemaType.STRING, description: "LaTeX içerebilen soru metni" },
        options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "4 adet seçenek" },
        correctAnswer: { type: SchemaType.STRING, description: "Doğru cevabın metni" },
        solution: { type: SchemaType.STRING, description: "Adım adım çözüm, LaTeX destekli" },
        subject: { type: SchemaType.STRING },
        classLevel: { type: SchemaType.STRING },
        difficulty: { type: SchemaType.STRING },
      },
      required: ["text", "options", "correctAnswer"],
    };

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    const instruction = `
      Aşağıdaki görseldeki soruyu tespit et ve aşağıdaki alanlarla JSON döndür:
      - text: Soru metni (LaTeX ifadelerini $...$ içinde ver)
      - options: 4 adet kısa seçenek (string array)
      - correctAnswer: Doğru cevabın tam metni (seçeneklerden biri)
      - solution: Kısa, adım adım çözüm (LaTeX destekli)
      - subject: Konu (örn: Matematik)
      - classLevel: (örn: 9. Sınıf)
      - difficulty: Kolay/Orta/Zor (tahmin)
      JSON dışında metin ekleme.
    `;

    let data;
    try {
      const result = await model.generateContent([instruction, imagePart]);
      const raw = result.response.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = {}; }
      data = {
        text: parsed.text || "",
        options: Array.isArray(parsed.options) && parsed.options.length > 0
          ? parsed.options.slice(0, 4).concat(Array(4).fill("")).slice(0, 4)
          : ["", "", "", ""],
        correctAnswer: parsed.correctAnswer || "",
        solution: parsed.solution || "",
        subject: parsed.subject || "Matematik",
        classLevel: parsed.classLevel || "9. Sınıf",
        difficulty: parsed.difficulty || "Orta",
        imagePath: imageUrl,
      };
    } catch (aiErr) {
      // AI KEY eksik/invalid ise kullanıcıya manuel düzenleme için fallback ver
      console.warn('smartParse AI error, fallback to manual:', aiErr?.message);
      data = {
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        solution: "",
        subject: "Matematik",
        classLevel: "9. Sınıf",
        difficulty: "Orta",
        imagePath: imageUrl,
      };
    }

    // Dosyayı sakla (temp klasörde erişilebilir), temizleme yok
    return res.json({ success: true, data });
  } catch (error) {
    console.error("smartParse Hatası:", error);
    try { fs.unlinkSync(req.file?.path); } catch(e) {}
    res.status(500).json({ message: "Görsel akıllı parse edilemedi.", error: error.message });
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

// ------------------------------------------------------------------
// 1.c 🧠 AKILLI METİN PARSE (Copy-Paste -> Structured JSON)
// UI: SmartPasteModal /ai/smart-parse-text
// Beklenen body: { content: string }
// Dönen veri: { text, options[4], correctAnswer, solution, subject, classLevel, difficulty }
// ------------------------------------------------------------------
exports.smartParseText = async (req, res) => {
  try {
    const content = (req.body?.content || '').toString();
    if (!content.trim()) {
      return res.status(400).json({ message: 'İçerik boş. Lütfen soruyu yapıştırın.' });
    }

    // Basit yerel ayrıştırıcı (AI anahtarı yoksa güvenli fallback)
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const optionRegexes = [
      /^\*?\s*A[\).\:]\s*(.+)$/i,
      /^\*?\s*B[\).\:]\s*(.+)$/i,
      /^\*?\s*C[\).\:]\s*(.+)$/i,
      /^\*?\s*D[\).\:]\s*(.+)$/i,
    ];

    let questionTextLines = [];
    let options = ['', '', '', ''];
    let correctAnswer = '';
    let inOptions = false;

    for (const line of lines) {
      // Answer hints
      const ansMatch = line.match(/^(?:Doğru\s*Cevap|Cevap|Answer)\s*[:=]\s*([A-D])/i);
      if (ansMatch) {
        const idx = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
        if (idx >= 0 && options[idx]) correctAnswer = options[idx];
        continue;
      }
      // Marked with * at option line
      const starOpt = line.match(/^\*\s*([A-D])[\).\:]\s*(.+)$/i);
      if (starOpt) {
        const idx = 'ABCD'.indexOf(starOpt[1].toUpperCase());
        options[idx] = starOpt[2].trim();
        correctAnswer = options[idx];
        inOptions = true;
        continue;
      }
      // Options A-D
      let matched = false;
      for (let i = 0; i < 4; i++) {
        const m = line.match(optionRegexes[i]);
        if (m) {
          options[i] = m[1].trim();
          inOptions = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      // Non-option lines
      if (!inOptions) questionTextLines.push(line);
    }

    const text = questionTextLines.join(' ').trim();
    // If correctAnswer still empty, try to match by trailing marker like (C)
    if (!correctAnswer) {
      const tail = content.match(/\(([A-D])\)\s*$/m);
      if (tail) {
        const idx = 'ABCD'.indexOf(tail[1].toUpperCase());
        if (idx >= 0 && options[idx]) correctAnswer = options[idx];
      }
    }

    const data = {
      text,
      options: options.map(o => o || ''),
      correctAnswer: correctAnswer || options[0] || '',
      solution: '',
      subject: 'Matematik',
      classLevel: '9. Sınıf',
      difficulty: 'Orta',
    };

    // Eğer GEMINI_API_KEY varsa, daha iyi ayrıştırma için LLM kullanmayı dene
    if (process.env.GEMINI_API_KEY) {
      try {
        const schema = {
          description: 'Tek bir soru şeması',
          type: SchemaType.OBJECT,
          properties: {
            text: { type: SchemaType.STRING },
            options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            correctAnswer: { type: SchemaType.STRING },
            solution: { type: SchemaType.STRING },
            subject: { type: SchemaType.STRING },
            classLevel: { type: SchemaType.STRING },
            difficulty: { type: SchemaType.STRING },
          },
          required: ['text', 'options', 'correctAnswer'],
        };
        const model = genAI.getGenerativeModel({
          model: MODEL_NAME,
          generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
        });
        const prompt = `Aşağıdaki metinden tek soruyu ayrıştır ve JSON döndür (LaTeX ifadelerini $...$ olarak yaz):\n\n${content}`;
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        const llm = JSON.parse(raw);
        // Güvenli birleştirme
        data.text = llm.text || data.text;
        if (Array.isArray(llm.options) && llm.options.length) {
          data.options = llm.options.slice(0, 4).concat(Array(4).fill('')).slice(0, 4);
        }
        data.correctAnswer = llm.correctAnswer || data.correctAnswer;
        data.solution = llm.solution || data.solution;
        data.subject = llm.subject || data.subject;
        data.classLevel = llm.classLevel || data.classLevel;
        data.difficulty = llm.difficulty || data.difficulty;
      } catch (e) {
        // LLM başarısız ise yerel parse ile devam
        console.warn('LLM parse başarısız, yerel ayrıştırma kullanıldı:', e.message);
      }
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('smartParseText Hatası:', error);
    res.status(500).json({ message: 'Metin akıllı parse edilemedi.', error: error.message });
  }
};