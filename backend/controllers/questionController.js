const Question = require('../models/Question');

const applyClassLevelFilter = (query, classLevel) => {
  if (!classLevel || classLevel === 'Tümü') {
    return;
  }

  query.$or = [
    { classLevel },
    { class_level: classLevel },
    { grade_level: classLevel },
  ];
};

const mapQuestionRecord = (question) => ({
  ...question,
  classLevel: question.classLevel || question.class_level || question.grade_level || '',
});

function normalizeStoredImagePath(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return value.startsWith('/uploads')
    ? value
    : `/uploads/${value.replace(/^\/?uploads\/?/, '')}`;
}

// --- 1. SORULARI GETİR (Filtreleme + Pagination) ---
exports.getQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty } = req.query;

    const query = {};
    
    // Metin Arama
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }
    
    if (subject && subject !== 'Tümü') query.subject = subject;
    applyClassLevelFilter(query, classLevel);
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

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

    const total = await Question.countDocuments(query);

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
      options: 1,
      correctAnswer: 1,
      solution: 1
    };
    let questions = await Question.find(query, projection)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Hiç sonuç yoksa, subject için daha gevşek bir eşleşme dene
    if (total === 0 && query.subject?.$regex) {
      const looseQuery = { ...query, subject: { $regex: req.user?.role === 'teacher' ? req.userBranch || '' : '', $options: 'i' } };
      const looseTotal = await Question.countDocuments(looseQuery);
      if (looseTotal > 0) {
        questions = await Question.find(looseQuery, projection)
          .sort({ createdAt: -1 })
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
    const { search, subject, classLevel, difficulty } = req.query;

    const query = {};
    
    // Metin Arama
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }
    
    if (subject && subject !== 'Tümü') query.subject = subject;
    applyClassLevelFilter(query, classLevel);
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

    const total = await Question.countDocuments(query);

    // Tüm alanları döndür
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
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
    const { text, subject, classLevel, difficulty, type, correctAnswer, solution, source, topic, learningOutcome, mebReference, curriculumNote } = req.body;
    const createdBy = req.user?.id || req.body.createdBy;

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
    if (mainImgFile) {
      mainImagePath = `/uploads/${mainImgFile.filename}`;
    } else if (req.body.imagePath) {
      mainImagePath = normalizeStoredImagePath(req.body.imagePath);
    }

    // 2. Şıkları İşle
    let optionsData = [];
    if (req.body.options && Array.isArray(req.body.options)) {
      optionsData = req.body.options.map(optText => ({ text: optText, image: '' }));
    }

    // 3. Şık Resimlerini Eşleştir
    if (req.files) {
      req.files.forEach(f => {
        if (f.fieldname.startsWith('optionImage_')) {
          const index = parseInt(f.fieldname.split('_')[1]);
          if (optionsData[index]) {
            optionsData[index].image = `/uploads/${f.filename}`;
          }
        }
      });
    }

    const newQuestion = await Question.create({
      text, subject: finalSubject, classLevel, difficulty, type, correctAnswer, solution, topic,
      learningOutcome,
      mebReference,
      curriculumNote,
      image: mainImagePath,
      options: optionsData,
      source: source || 'Manuel',
      createdBy
    });

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
    const fields = ['text', 'subject', 'classLevel', 'difficulty', 'type', 'correctAnswer', 'solution', 'source', 'topic'];
    fields.forEach(f => { if(req.body[f]) question[f] = req.body[f]; });

    // Ana Resim Güncellemesi
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    if (mainImgFile) {
      question.image = `/uploads/${mainImgFile.filename}`;
    } else if (req.body.imagePath) {
      question.image = normalizeStoredImagePath(req.body.imagePath);
    }

    // Şık Güncellemesi
    if (req.body.options && Array.isArray(req.body.options)) {
       let newOptions = req.body.options.map((txt, i) => {
          const oldImg = question.options[i] ? question.options[i].image : '';
          return { text: txt, image: oldImg };
       });

       if (req.files) {
         req.files.forEach(f => {
            if (f.fieldname.startsWith('optionImage_')) {
               const index = parseInt(f.fieldname.split('_')[1]);
               if (newOptions[index]) newOptions[index].image = `/uploads/${f.filename}`;
            }
         });
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
    await Question.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Soru silindi.' });
  } catch (error) {
    next(error);
  }
};