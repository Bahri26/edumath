const { buildTopicMongoClause } = require('../constants/patternTopics');
const Question = require('../models/Question');
const { uploadFile, promoteLocalUpload, promoteAssessmentMetaAssets, toUploadRelativePath, deleteStoredAsset } = require('../services/storageService');
const { recordUserActivity } = require('../services/activityLogger');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const addAndClause = (query, clause) => {
  if (!clause) {
    return;
  }

  if (!query.$and) {
    query.$and = [];
  }

  query.$and.push(clause);
};

const applyClassLevelFilter = (query, classLevel) => {
  if (!classLevel || classLevel === 'Tümü') {
    return;
  }

  addAndClause(query, {
    $or: [
    { classLevel },
    { class_level: classLevel },
    { grade_level: classLevel },
    ],
  });
};

const mapQuestionRecord = (question) => ({
  ...question,
  classLevel: question.classLevel || question.class_level || question.grade_level || '',
});

const buildQuestionSearch = (query, search, mode = 'text') => {
  const term = String(search || '').trim();
  if (!term) {
    return null;
  }

  if (mode === 'text' && term.length >= 3) {
    addAndClause(query, { $text: { $search: term } });
    return { mode: 'text', term };
  }

  const regex = { $regex: escapeRegex(term), $options: 'i' };
  addAndClause(query, {
    $or: [
      { text: regex },
      { topic: regex },
      { learningOutcome: regex },
    ],
  });
  return { mode: 'regex', term };
};

function normalizeStoredImagePath(value) {
  return toUploadRelativePath(value);
}

function normalizeOptionPayload(options) {
  if (Array.isArray(options)) {
    return options;
  }

  if (typeof options === 'string' && options.trim()) {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      /* tek metin şık */
    }
    return [options];
  }

  return [];
}

function parseInteractionData(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  return JSON.parse(value);
}

function normalizeClassLevel(value) {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  // Normalize common Turkish character loss (Sınıf -> Sinif) from clients/codepages
  const fixed = raw.replace(/Sinif/gi, 'Sınıf');
  return fixed;
}

// --- 1. SORULARI GETİR (Filtreleme + Pagination) ---
exports.getQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty, topic, sortBy } = req.query;
    const sortByTopic = String(sortBy || '').toLowerCase() === 'topic';

    const query = {};
    
    if (subject && subject !== 'Tümü') query.subject = subject;
    applyClassLevelFilter(query, classLevel);
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;
    const topicClause0 = buildTopicMongoClause(topic, escapeRegex);
    if (topicClause0) query.topic = topicClause0;
    const searchMeta = buildQuestionSearch(query, search, 'text');

    // Eğer istek öğretmenden geliyorsa ve branşı onaylıysa, varsayılan olarak kendi branşındaki (subject) soruları göster
    // (subject filtrelenmemişse veya 'Tümü' ise)
    try {
      if (req.user && req.user.role === 'teacher') {
        const User = require('../models/User');
        const u = await User.findById(req.user.id).select('branch branchApproval');
        if (u && u.branch && u.branchApproval === 'approved') {
          const noSubjectFilter = !('subject' in req.query) || req.query.subject === 'Tümü' || !query.subject;
          if (noSubjectFilter) {
            query.subject = { $regex: `^${u.branch}$`, $options: 'i' };
          }
        }
      }
    } catch {}

    let total = await Question.countDocuments(query);
    let effectiveQuery = query;

    if (searchMeta?.mode === 'text' && total === 0) {
      effectiveQuery = {};
      if (subject && subject !== 'Tümü') effectiveQuery.subject = subject;
      applyClassLevelFilter(effectiveQuery, classLevel);
      if (difficulty && difficulty !== 'Tümü') effectiveQuery.difficulty = difficulty;
      const topicClauseSq = buildTopicMongoClause(topic, escapeRegex);
      if (topicClauseSq) effectiveQuery.topic = topicClauseSq;
      buildQuestionSearch(effectiveQuery, search, 'regex');

      try {
        if (req.user && req.user.role === 'teacher') {
          const User = require('../models/User');
          const u = await User.findById(req.user.id).select('branch branchApproval');
          if (u && u.branch && u.branchApproval === 'approved') {
            const noSubjectFilter = !('subject' in req.query) || req.query.subject === 'Tümü' || !effectiveQuery.subject;
            if (noSubjectFilter) {
              effectiveQuery.subject = { $regex: `^${u.branch}$`, $options: 'i' };
            }
          }
        }
      } catch {}

      total = await Question.countDocuments(effectiveQuery);
    }

    // Sadece özet alanlar + correctAnswer ve solution
    const projection = {
      text: 1,
      subject: 1,
      topic: 1,
      learningOutcome: 1,
      mebReference: 1,
      curriculumNote: 1,
      classLevel: 1,
      difficulty: 1,
      type: 1,
      source: 1,
      createdAt: 1,
      image: 1,
      imageKey: 1,
      imageProvider: 1,
      options: 1,
      correctAnswer: 1,
      solution: 1,
      assessmentMeta: 1,
    };
    const sort = searchMeta?.mode === 'text' && effectiveQuery.$and?.some((clause) => clause.$text)
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
      : sortByTopic
        ? { topic: 1, createdAt: -1 }
        : { createdAt: -1 };

    let questions = await Question.find(effectiveQuery, {
      ...projection,
      ...(sort.score ? { score: { $meta: 'textScore' } } : {}),
    })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Hiç sonuç yoksa, subject için daha gevşek bir eşleşme dene
    if (total === 0 && effectiveQuery.subject?.$regex && !searchMeta) {
      const looseQuery = { ...effectiveQuery, subject: { $regex: req.user?.role === 'teacher' ? req.userBranch || '' : '', $options: 'i' } };
      const looseTotal = await Question.countDocuments(looseQuery);
      if (looseTotal > 0) {
        questions = await Question.find(looseQuery, projection)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
      }
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page: page,
      total: total,
      data: questions.map(mapQuestionRecord)
    });

  } catch (error) {
    next(error);
  }
};

// --- 1.5 ÖĞRETMEN SORULARINI GETİR (Öğretmen için - Filtreleme + Pagination) ---
exports.getTeacherQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty, topic, sortBy } = req.query;
    const sortByTopic = String(sortBy || '').toLowerCase() === 'topic';

    const query = {};
    
    if (subject && subject !== 'Tümü') query.subject = subject;
    applyClassLevelFilter(query, classLevel);
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;
    const topicClauseT = buildTopicMongoClause(topic, escapeRegex);
    if (topicClauseT) query.topic = topicClauseT;
    const searchMeta = buildQuestionSearch(query, search, 'text');

    let total = await Question.countDocuments(query);
    let effectiveQuery = query;

    if (searchMeta?.mode === 'text' && total === 0) {
      effectiveQuery = {};
      if (subject && subject !== 'Tümü') effectiveQuery.subject = subject;
      applyClassLevelFilter(effectiveQuery, classLevel);
      if (difficulty && difficulty !== 'Tümü') effectiveQuery.difficulty = difficulty;
      const topicClauseT2 = buildTopicMongoClause(topic, escapeRegex);
      if (topicClauseT2) effectiveQuery.topic = topicClauseT2;
      buildQuestionSearch(effectiveQuery, search, 'regex');
      total = await Question.countDocuments(effectiveQuery);
    }

    // Tüm alanları döndür
    const sort = searchMeta?.mode === 'text' && effectiveQuery.$and?.some((clause) => clause.$text)
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
      : sortByTopic
        ? { topic: 1, createdAt: -1 }
        : { createdAt: -1 };
    const questions = await Question.find(effectiveQuery, sort.score ? { score: { $meta: 'textScore' } } : undefined)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name')
      .lean();

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page: page,
      total: total,
      data: questions.map(mapQuestionRecord)
    });

  } catch (error) {
    next(error);
  }
};
exports.createQuestion = async (req, res, next) => {
  try {
    const { text, subject, classLevel, difficulty, type, correctAnswer, solution, source, topic, learningOutcome, mebReference, curriculumNote, visualPrompt, interactiveType, interactionData, assessmentMeta } = req.body;
    const createdBy = req.user?.id || req.body.createdBy;
    const normalizedClassLevel = normalizeClassLevel(classLevel);

    const questionText = String(text || '').trim();
    const answerText = String(correctAnswer || '').trim();
    if (!questionText) {
      return res.status(400).json({ message: 'Soru metni gereklidir.' });
    }
    if (!answerText) {
      return res.status(400).json({ message: 'Doğru cevap gereklidir.' });
    }

    // Teacher branch enforcement: if teacher has approved branch, lock subject to branch
    let finalSubject = subject;
    try {
      if (req.user?.id) {
        const User = require('../models/User');
        const u = await User.findById(req.user.id).select('role branch branchApproval');
        if (u && u.role === 'teacher' && u.branch && u.branchApproval === 'approved') {
          finalSubject = u.branch;
        }
      }
    } catch {}

    // 1. Ana Resmi Bul
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    // Allow using previously uploaded image path (from smart-parse)
    let mainImagePath = '';
    let mainImageKey = '';
    let mainImageProvider = '';
    if (mainImgFile) {
      const uploaded = await uploadFile(mainImgFile, 'questions');
      mainImagePath = uploaded.url;
      mainImageKey = uploaded.key;
      mainImageProvider = uploaded.provider;
    } else if (req.body.imagePath) {
      const normalizedPath = normalizeStoredImagePath(req.body.imagePath);
      if (normalizedPath && (/\/uploads\/temp\//i.test(normalizedPath) || normalizedPath.includes('/temp/'))) {
        try {
          const promoted = await promoteLocalUpload(normalizedPath, 'questions', { allowMissing: true });
          if (promoted.url && !promoted.missing) {
            mainImagePath = promoted.url;
            mainImageKey = promoted.key;
            mainImageProvider = promoted.provider;
          } else if (promoted.missing) {
            console.warn('createQuestion: temp görsel bulunamadı, soru görselsiz kaydedilecek:', normalizedPath);
          }
        } catch (imgErr) {
          console.warn('createQuestion image promote failed:', imgErr?.message);
        }
      } else if (normalizedPath) {
        mainImagePath = normalizedPath;
      }
    }

    // 2. Şıkları İşle
    let optionsData = [];
    const optionValues = normalizeOptionPayload(req.body.options);
    if (optionValues.length > 0) {
      optionsData = optionValues.map(optText => ({ text: optText, image: '', imageKey: '', imageProvider: '' }));
    }

    // 3. Şık Resimlerini Eşleştir
    if (req.files) {
      for (const f of req.files) {
        if (f.fieldname.startsWith('optionImage_')) {
          const index = parseInt(f.fieldname.split('_')[1]);
          if (optionsData[index]) {
            const uploaded = await uploadFile(f, 'question-options');
            optionsData[index].image = uploaded.url;
            optionsData[index].imageKey = uploaded.key;
            optionsData[index].imageProvider = uploaded.provider;
          }
        }
      }
    }

    let resolvedAssessmentMeta;
    if (assessmentMeta) {
      try {
        const rawMeta = typeof assessmentMeta === 'string' ? JSON.parse(assessmentMeta) : assessmentMeta;
        resolvedAssessmentMeta = await promoteAssessmentMetaAssets(rawMeta);
      } catch (metaErr) {
        console.warn('assessmentMeta parse/promote skipped:', metaErr?.message);
        resolvedAssessmentMeta = typeof assessmentMeta === 'object' ? assessmentMeta : undefined;
      }
    }

    const newQuestion = await Question.create({
      text: questionText, subject: finalSubject, classLevel: normalizedClassLevel, difficulty, type, correctAnswer: answerText, solution, topic,
      learningOutcome,
      mebReference,
      curriculumNote,
      visualPrompt: visualPrompt || '',
      interactiveType: interactiveType || 'none',
      interactionData: parseInteractionData(interactionData),
      assessmentMeta: resolvedAssessmentMeta || undefined,
      image: mainImagePath,
      imageKey: mainImageKey,
      imageProvider: mainImageProvider,
      options: optionsData,
      source: source || 'Manuel',
      createdBy
    });

    if (req.user?.id) {
      const User = require('../models/User');
      const actor = await User.findById(req.user.id).select('name email role').lean();
      const preview = String(text || '').slice(0, 60);
      await recordUserActivity(req, {
        user: actor,
        action: 'question_create',
        category: 'content',
        summary: `Soru ekledi: ${preview}${String(text || '').length > 60 ? '…' : ''}`,
        targetType: 'question',
        targetId: newQuestion._id,
        targetLabel: preview,
        metadata: { subject: finalSubject, classLevel: normalizedClassLevel },
      });
    }

    res.status(201).json({ success: true, data: newQuestion });

  } catch (error) {
    next(error);
  }
};

// --- 3. TOPLU SORU EKLE (AI BATCH INSERT) ---
exports.batchCreateQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "Soru listesi geçersiz." });
    }

    // If teacher has approved branch, lock subject of all inserted questions to branch
    let enforcedSubject = null;
    try {
      if (req.user?.id) {
        const User = require('../models/User');
        const u = await User.findById(req.user.id).select('role branch branchApproval');
        if (u && u.role === 'teacher' && u.branch && u.branchApproval === 'approved') {
          enforcedSubject = u.branch;
        }
      }
    } catch {}

    const payload = questions.map(q => ({
      ...q,
      subject: enforcedSubject ? enforcedSubject : (q.subject || 'Matematik'),
      source: q.source || 'AI',
      createdBy: req.user?.id || q.createdBy
    }));

    const savedQuestions = await Question.insertMany(payload);

    res.status(201).json({
      success: true,
      message: `${savedQuestions.length} soru başarıyla havuza eklendi.`,
      data: savedQuestions
    });

  } catch (error) {
    next(error);
  }
};

// --- 4. GÜNCELLEME ---
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Soru bulunamadı" });

    // Temel alanları güncelle
    const fields = ['text', 'subject', 'classLevel', 'difficulty', 'type', 'correctAnswer', 'solution', 'source', 'topic', 'learningOutcome', 'mebReference', 'curriculumNote', 'visualPrompt', 'interactiveType'];
    fields.forEach(f => { if(req.body[f]) question[f] = req.body[f]; });
    if (req.body.assessmentMeta !== undefined) question.assessmentMeta = req.body.assessmentMeta;
    if (req.body.interactionData) {
      question.interactionData = parseInteractionData(req.body.interactionData);
    }

    // Ana Resim Güncellemesi
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    if (mainImgFile) {
      await deleteStoredAsset({ key: question.imageKey, provider: question.imageProvider, url: question.image });
      const uploaded = await uploadFile(mainImgFile, 'questions');
      question.image = uploaded.url;
      question.imageKey = uploaded.key;
      question.imageProvider = uploaded.provider;
    } else if (req.body.imagePath) {
      const nextImagePath = normalizeStoredImagePath(req.body.imagePath);
      if (nextImagePath !== question.image) {
        await deleteStoredAsset({ key: question.imageKey, provider: question.imageProvider, url: question.image });
        question.image = nextImagePath;
        question.imageKey = '';
        question.imageProvider = '';
      }
    }

    // Şık Güncellemesi
    const optionPayload = normalizeOptionPayload(req.body.options);
    if (optionPayload.length > 0) {
       let newOptions = optionPayload.map((txt, i) => {
          const oldOption = question.options[i] || {};
          return {
            text: txt,
            image: oldOption.image || '',
            imageKey: oldOption.imageKey || '',
            imageProvider: oldOption.imageProvider || '',
          };
       });

       if (req.files) {
         for (const f of req.files) {
            if (f.fieldname.startsWith('optionImage_')) {
               const index = parseInt(f.fieldname.split('_')[1]);
               if (newOptions[index]) {
                 await deleteStoredAsset({ key: newOptions[index].imageKey, provider: newOptions[index].imageProvider, url: newOptions[index].image });
                 const uploaded = await uploadFile(f, 'question-options');
                 newOptions[index].image = uploaded.url;
                 newOptions[index].imageKey = uploaded.key;
                 newOptions[index].imageProvider = uploaded.provider;
               }
            }
         }
       }
       question.options = newOptions;
    }

    await question.save();
    res.status(200).json({ success: true, data: question });

  } catch (error) {
    next(error);
  }
};

// --- 5. SİLME ---
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Soru bulunamadı.' });
    }

    await deleteStoredAsset({ key: question.imageKey, provider: question.imageProvider, url: question.image });
    for (const option of question.options || []) {
      await deleteStoredAsset({ key: option.imageKey, provider: option.imageProvider, url: option.image });
    }

    await Question.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Soru silindi.' });
  } catch (error) {
    next(error);
  }
};