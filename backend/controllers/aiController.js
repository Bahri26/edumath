const { isLocalAi, isOllamaAi } = require('../config/aiProvider');
const localText = require('../services/localTextService');
const localQuestions = require('../services/localQuestionService');
const {
  assertTeacherCanAccessStudentUser,
  resolveSelfStudentUserId,
} = require('../utils/teacherStudentAccess');
const {
  assertSafeAiUserText,
  HINT_FIELD_MAX_LEN,
  ANALYSIS_ANSWER_MAX_LEN,
} = require('../utils/aiPromptSafety');
const {
  buildInteractivePracticeQuestions,
  buildFallbackPracticeQuestions,
} = require('../services/practiceQuestionBank');

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
    let analysis = '';
    if (isLocalAi()) {
      analysis = localText.buildExamAnalysis({
        studentName: 'Öğrenci',
        correct,
        total,
        topicReport,
        slowQuestions,
      });
    } else {
      try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `Bir öğrencinin matematik sınavı sonuçları:\nToplam: ${correct}/${total} doğru.\nKonu bazlı: ${JSON.stringify(topicReport)}\nYavaş çözülen sorular: ${slowQuestions.join(", ")}\nKısa bir analiz ve 2 öneri ver.`;
        const result = await model.generateContent(prompt);
        analysis = result.response.text();
      } catch (e) {
        analysis = localText.buildExamAnalysis({
          studentName: 'Öğrenci',
          correct,
          total,
          topicReport,
          slowQuestions,
        });
      }
    }
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
    let summary = '';
    if (isLocalAi()) {
      summary = localText.buildTeacherSummary({ topicReport, allScores, allSlow });
    } else {
      try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `Bir matematik sınavında tüm öğrencilerin sonuçları:\nKonu bazlı başarı: ${JSON.stringify(topicReport)}\nÖğrenci skorları: ${JSON.stringify(allScores)}\nYavaş çözülen sorular: ${JSON.stringify(allSlow)}\nÖğretmen için kısa bir özet ve öneriler ver.`;
        const result = await model.generateContent(prompt);
        summary = result.response.text();
      } catch (e) {
        summary = localText.buildTeacherSummary({ topicReport, allScores, allSlow });
      }
    }
    res.json({ topicReport, allScores, allSlow, summary });
  } catch (error) {
    res.status(500).json({ message: "Teacher report oluşturulamadı.", error: error.message });
  }
};

// 8. SORU ÇÖZERKEN İPUCU VEREN AI
exports.getHint = async (req, res) => {
  const { questionText, studentAnswer, questionId, topic, subject } = req.body || {};
  try {
    if (!questionText && !questionId) {
      return res.status(400).json({ message: 'Soru metni veya soru ID gerekli.' });
    }

    let resolvedText = String(questionText || '').trim();
    let resolvedTopic = String(topic || '').trim();
    let resolvedSubject = String(subject || '').trim();

    if (questionId && (!resolvedText || !resolvedTopic || !resolvedSubject)) {
      try {
        const Question = require('../models/Question');
        const q = await Question.findById(questionId).select('text topic subject');
        if (q) {
          if (!resolvedText) resolvedText = q.text || '';
          if (!resolvedTopic) resolvedTopic = q.topic || '';
          if (!resolvedSubject) resolvedSubject = q.subject || '';
        }
      } catch {
        /* yardimci sorgu basarisiz olursa hint yine cikarilir */
      }
    }

    const safeQuestion = assertSafeAiUserText(resolvedText, {
      maxLength: HINT_FIELD_MAX_LEN,
      required: Boolean(!questionId),
      emptyMessage: 'Soru metni gerekli.',
    });
    if (!safeQuestion.ok) {
      return res.status(safeQuestion.status).json({ message: safeQuestion.message });
    }
    resolvedText = safeQuestion.text || resolvedText;

    const safeAnswer = assertSafeAiUserText(studentAnswer, {
      maxLength: HINT_FIELD_MAX_LEN,
    });
    if (!safeAnswer.ok) {
      return res.status(safeAnswer.status).json({ message: safeAnswer.message });
    }
    const sanitizedAnswer = safeAnswer.text;

    let hintText;
    if (isLocalAi()) {
      hintText = localText.buildHint({ questionText: resolvedText, studentAnswer: sanitizedAnswer });
    } else {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `Bir öğrenci şu soruyu çözüyor: ${resolvedText || '(soru metni alınamadı)'}\n` +
        `Öğrencinin cevabı: ${sanitizedAnswer || 'Henüz cevap yok'}\n` +
        `Kısa, yol gösterici bir ipucu ver. Cevabı açıkça söyleme. 1-3 cümle yeterli.`;
      const result = await model.generateContent(prompt);
      hintText = result.response.text();
    }

    // Öğrenci-rol kontrolü; öğretmen test ederken de event yazma
    if (req.user && req.user.role === 'student') {
      try {
        const LearningEvent = require('../models/LearningEvent');
        await LearningEvent.create({
          userId: req.user.id,
          type: 'hint',
          subject: resolvedSubject || '',
          topic: resolvedTopic || '',
          meta: {
            questionId: questionId || null,
            questionPreview: (resolvedText || '').slice(0, 160),
            studentAnswer: String(sanitizedAnswer || '').slice(0, 160),
            hintPreview: String(hintText || '').slice(0, 200),
          },
        });
      } catch (logErr) {
        console.warn('hint event yazılamadı:', logErr?.message);
      }
    }

    res.json({ hint: hintText });
  } catch (error) {
    const status = Number(error?.status || 0);
    const msg = String(error?.message || '');
    if (status === 429 || /quota|resource.?exhausted/i.test(msg)) {
      return res.status(429).json({
        message: 'AI kotası dolu, ipucu üretilemedi.',
        hint: 'Birazdan tekrar dene.',
      });
    }
    console.error('getHint hatası:', msg);
    res.status(500).json({ message: 'İpucu üretilemedi.', error: msg });
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

    const safeAnswer = assertSafeAiUserText(answer, {
      maxLength: ANALYSIS_ANSWER_MAX_LEN,
      required: true,
      emptyMessage: 'Cevap metni gerekli.',
    });
    if (!safeAnswer.ok) {
      return res.status(safeAnswer.status).json({ message: safeAnswer.message });
    }

    const access = await assertTeacherCanAccessStudentUser(
      req.user.id,
      studentId,
      req.user.role,
    );
    if (!access.allowed) {
      return res.status(access.status || 403).json({ message: access.message });
    }

    const result = await analyzeAndSuggest(safeAnswer.text, topic, studentId);
    res.json(result);
  } catch (error) {
    console.error("analyzeAndSuggest Hatası:", error);
    res.status(500).json({ message: "Cevap analiz edilemedi.", error: error.message });
  }
};
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");
const pathLib = require('path');
const { recognizeText } = require('../services/ocrImageService');
const { cleanOcrText } = require('../services/questionImageParseService');
const { generatePatternQuestions } = require('../services/aiQuestionGeneratorService');
const { generateContentAsJson } = require('../services/geminiJsonGeneration');
const { buildMebPromptBlock } = require('../constants/mebCurriculumContext');
const {
  fetchQuestionPoolSamples,
  formatSamplesForPrompt,
} = require('../services/questionPoolSamplesService');
const { LEARNING_OUTCOME_BY_LABEL } = require('../constants/patternTopics');

// API Anahtarınızı .env dosyasından çekiyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { DEFAULT_GEMINI_FLASH, DEFAULT_GEMINI_COMPLEX } = require('../constants/geminiDefaults');
const MODEL_NAME = process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH;
const COMPLEX_MODEL_NAME =
  process.env.GEMINI_COMPLEX_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_COMPLEX;

// Yardımcı Fonksiyon: Dosya işleme (Resim için)
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
}

function buildDefaultParsedQuestion(overrides = {}) {
  return {
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    solution: '',
    subject: 'Matematik',
    classLevel: '9. Sınıf',
    difficulty: 'Orta',
    ...overrides,
  };
}

function normalizeOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return ['', '', '', ''];
  }

  return options.slice(0, 4).concat(Array(4).fill('')).slice(0, 4).map((value) => String(value || '').trim());
}

function parseStructuredQuestionText(content, defaults = {}) {
  const fallback = buildDefaultParsedQuestion(defaults);
  const normalized = String(content || '').replace(/\r/g, '\n');
  if (!normalized.trim()) {
    return fallback;
  }

  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const optionRegexes = [
    /^\*?\s*A[\)\.\:]\s*(.+)$/i,
    /^\*?\s*B[\)\.\:]\s*(.+)$/i,
    /^\*?\s*C[\)\.\:]\s*(.+)$/i,
    /^\*?\s*D[\)\.\:]\s*(.+)$/i,
  ];

  const questionTextLines = [];
  const options = ['', '', '', ''];
  let correctAnswer = '';
  let inOptions = false;

  for (const line of lines) {
    const answerMatch = line.match(/^(?:Doğru\s*Cevap|Cevap|Answer)\s*[:=]\s*([A-D])/i);
    if (answerMatch) {
      const index = 'ABCD'.indexOf(answerMatch[1].toUpperCase());
      if (index >= 0 && options[index]) {
        correctAnswer = options[index];
      }
      continue;
    }

    const markedOption = line.match(/^\*\s*([A-D])[\)\.\:]\s*(.+)$/i);
    if (markedOption) {
      const index = 'ABCD'.indexOf(markedOption[1].toUpperCase());
      options[index] = markedOption[2].trim();
      correctAnswer = options[index];
      inOptions = true;
      continue;
    }

    let matched = false;
    for (let index = 0; index < optionRegexes.length; index += 1) {
      const optionMatch = line.match(optionRegexes[index]);
      if (optionMatch) {
        options[index] = optionMatch[1].trim();
        inOptions = true;
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    if (!inOptions) {
      questionTextLines.push(line);
    }
  }

  if (!correctAnswer) {
    const tailMatch = normalized.match(/\(([A-D])\)\s*$/m);
    if (tailMatch) {
      const index = 'ABCD'.indexOf(tailMatch[1].toUpperCase());
      if (index >= 0 && options[index]) {
        correctAnswer = options[index];
      }
    }
  }

  const text = questionTextLines.join(' ').trim();
  return buildDefaultParsedQuestion({
    ...defaults,
    text,
    options: normalizeOptions(options),
    correctAnswer: correctAnswer || options[0] || '',
  });
}

async function extractTextFromImageWithOcr(filePath) {
  try {
    const raw = await recognizeText(filePath);
    return cleanOcrText(raw);
  } catch (primaryError) {
    console.warn('smartParse OCR failed:', primaryError?.message);
    return '';
  }
}

// ------------------------------------------------------------------
// 1. 📸 FOTOĞRAFTAN SORU ÇÖZÜMÜ (Vision)
// ------------------------------------------------------------------
exports.solveFromImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Lütfen bir resim yükleyin." });

    let solution;
    if (isLocalAi()) {
      const ocrText = await extractTextFromImageWithOcr(req.file.path);
      solution = localText.buildImageSolution(ocrText);
    } else {
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
      solution = result.response.text();
    }

    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    res.json({ solution, provider: isLocalAi() ? 'local-ocr' : 'gemini' });
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

    const { parseQuestionFromImage } = require('../services/questionImageParseService');
    const result = await parseQuestionFromImage(req.file.path, req.file.mimetype);
    return res.json({
      success: true,
      data: result.data,
      meta: {
        parseMode: result.parseMode,
        layout: result.layout || result.data?.assessmentMeta?.parseLayout || {},
        autoFilled: Boolean(
          result.data?.text?.trim() || result.data?.options?.some((option) => String(option).trim())
        ),
        multiCount: Array.isArray(result.multiItems) ? result.multiItems.length : 0,
      },
      multiItems: result.multiItems || [],
      message: result.message,
      ocrPreview: result.ocrPreview || '',
    });
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
    const {
      topic,
      difficulty,
      count,
      classLevel,
      subject: subjectRaw,
    } = req.body;

    if (!topic || !difficulty || !classLevel || !count) {
      return res.status(400).json({ message: 'Eksik alan: topic, difficulty, classLevel, count gerekli.' });
    }

    const { generateQuestionsFromPool } = require('../services/poolBasedQuestionGeneratorService');
    const subject =
      typeof subjectRaw === 'string' && subjectRaw.trim() ? subjectRaw.trim() : 'Matematik';

    // Yerel motor: MongoDB havuz → ml-service → JS şablon (dış AI yok)
    const result = await generateQuestionsFromPool({
      topic,
      difficulty,
      count,
      classLevel,
      subject,
    });

    return res.json({
      questions: result.questions.map((q) => ({
        ...q,
        explanation: q.explanation || q.solution || '',
        type: 'multiple-choice',
        subject,
        topic,
        classLevel,
        difficulty,
      })),
      hint: result.hint,
      generator: result.generator,
      pipeline: result.pipeline || 'db-ml-js',
      poolSampleCount: result.poolSampleCount,
    });
  } catch (error) {
    console.error('Soru Üretme Hatası:', error);
    const msg = String(error?.message || '');
    const status = Number(error?.status || error?.statusCode || 0);
    const quotaLike = status === 429 || /429|\bquota\b|resource.?exhausted/i.test(msg);
    if (quotaLike) {
      return res.status(429).json({
        message: 'Gemini kota/billing limiti nedeniyle soru üretilemedi.',
        hint:
          'Google AI Studio / Cloud Console tarafinda proje faturalandirmasi acik olmali ve backend GEMINI_API_KEY bu projeye ait olmali. Hata "free_tier" diyorsa anahtar ucretli projeye bagli degil demektir.',
        detail: msg,
      });
    }

    res.status(500).json({ message: 'Soru üretilemedi.', detail: msg });
  }
};

// ------------------------------------------------------------------
// 3. 🤖 EKSİK KAPATMA / ALIŞTIRMA (Student Dashboard)
// ------------------------------------------------------------------
exports.generatePracticeQuestions = async (req, res) => {
  try {
    const { weakTopics, studentId: requestedStudentId } = req.body;
    const role = req.user?.role;
    const targetStudentId = resolveSelfStudentUserId(
      role,
      req.user?.id,
      requestedStudentId,
    );

    if (role === 'teacher') {
      const access = await assertTeacherCanAccessStudentUser(
        req.user.id,
        targetStudentId,
        role,
      );
      if (!access.allowed) {
        return res.status(access.status || 403).json({ message: access.message });
      }
    }

    if (!weakTopics || weakTopics.length === 0) {
      if (isLocalAi() && targetStudentId) {
        const { getWeakTopics } = require('../services/studentAnalyticsService');
        const inferred = await getWeakTopics(targetStudentId);
        if (inferred.length) {
          const local = await localQuestions.generateLocalPractice({
            weakTopics: inferred,
            studentId: targetStudentId,
            count: 5,
          });
          return res.json(local);
        }
      }
      return res.status(200).json({ questions: [], message: "Eksik konu bulunamadı." });
    }

    if (isLocalAi()) {
      const local = await localQuestions.generateLocalPractice({
        weakTopics,
        studentId: targetStudentId,
        count: 5,
      });
      return res.json(local);
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

    const interactiveQuestions = buildInteractivePracticeQuestions(weakTopics || []);
    let normalizedQuestions = [];

    try {
      const result = await model.generateContent(prompt);
      const questions = JSON.parse(result.response.text());
      normalizedQuestions = (Array.isArray(questions) ? questions : []).map((question, index) => ({
        ...question,
        id: `practice-${index + 1}`,
        type: question.type || 'multiple-choice',
        options: Array.isArray(question.options) ? question.options : Object.values(question.options || {}),
        explanation: question.explanation || '',
      }));
    } catch (aiError) {
      console.warn('Practice AI fallback used:', aiError?.message || aiError);
      normalizedQuestions = buildFallbackPracticeQuestions(weakTopics || []);
    }

    res.json({ questions: [...interactiveQuestions, ...normalizedQuestions].slice(0, 5) });

  } catch (error) {
    console.error("Alıştırma Üretme Hatası:", error);
    res.status(200).json({ questions: buildFallbackPracticeQuestions(req.body?.weakTopics || []).slice(0, 5), message: "AI geçici olarak kullanılamadı, yerel alıştırmalar gösterildi." });
  }
};

// ------------------------------------------------------------------
// 4. 📊 PERFORMANS ANALİZİ
// ------------------------------------------------------------------
exports.analyzePerformance = async (req, res) => {
  try {
    const { examHistory, studentName } = req.body;
    if (isLocalAi()) {
      return res.json({
        analysis: localText.buildPerformanceAnalysis({ studentName, examHistory }),
        provider: 'local',
      });
    }
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

    if (isLocalAi()) {
      let topics = weakTopics;
      if ((!topics || !topics.length) && req.user?.id) {
        const { getWeakTopics } = require('../services/studentAnalyticsService');
        topics = await getWeakTopics(req.user.id);
      }
      return res.json({
        plan: localText.buildStudyPlan({ goal, hoursPerDay, daysLeft, weakTopics: topics }),
        provider: 'local',
      });
    }

    const model = genAI.getGenerativeModel({ model: COMPLEX_MODEL_NAME });
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

    const { parseStructuredQuestionText: parseText } = require('../services/questionImageParseService');
    const data = await parseText(content);

    if (!isLocalAi() && !isOllamaAi() && process.env.GEMINI_API_KEY) {
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
          model: COMPLEX_MODEL_NAME,
          generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
        });
        const prompt = `Aşağıdaki metinden tek soruyu ayrıştır ve JSON döndür (LaTeX ifadelerini $...$ olarak yaz):\n\n${content}`;
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        const llm = JSON.parse(raw);
        // Güvenli birleştirme
        data.text = llm.text || data.text;
        if (Array.isArray(llm.options) && llm.options.length) {
          data.options = normalizeOptions(llm.options);
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

    const { layout, assessmentMeta, ...questionFields } = data;
    return res.json({
      success: true,
      data: { ...questionFields, assessmentMeta },
      meta: { layout: layout || assessmentMeta?.parseLayout || {} },
    });
  } catch (error) {
    console.error('smartParseText Hatası:', error);
    res.status(500).json({ message: 'Metin akıllı parse edilemedi.', error: error.message });
  }
};

// ------------------------------------------------------------------
// 10. 🤖 MEB UYUMLU ORUNTU SORUSU URETIMI (Teacher)
// POST /api/ai/generate-pattern-pack
// ------------------------------------------------------------------
exports.generatePatternQuestionPack = async (req, res) => {
  try {
    const {
      classLevel = '5. Sınıf',
      difficulty = 'Orta',
      count = 5,
      topic = 'Örüntüler',
      subject = 'Matematik',
      googleGrounding,
    } = req.body || {};

    const result = await generatePatternQuestions({
      classLevel,
      difficulty,
      count: Number(count) || 5,
      topic,
      subject,
      googleGrounding,
    });

    res.json({
      success: true,
      generator: result.generator,
      count: result.questions.length,
      questions: result.questions,
      ...(result.hint ? { hint: result.hint } : {}),
    });
  } catch (error) {
    console.error('generatePatternQuestionPack Hatası:', error);
    res.status(500).json({ message: 'AI soru paketi uretilemedi.', error: error.message });
  }
};
