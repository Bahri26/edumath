const Question = require('../models/Question');

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
    if (classLevel && classLevel !== 'Tümü') query.classLevel = classLevel;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

    const total = await Question.countDocuments(query);

    // Sadece özet alanlar + correctAnswer ve solution
    const projection = {
      text: 1,
      subject: 1,
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
    const questions = await Question.find(query, projection)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page: page,
      total: total,
      data: questions
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
    if (classLevel && classLevel !== 'Tümü') query.classLevel = classLevel;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

    const total = await Question.countDocuments(query);

    // Tüm alanları döndür
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page: page,
      total: total,
      data: questions
    });

  } catch (error) {
    next(error);
  }
};
exports.createQuestion = async (req, res, next) => {
  try {
    const { text, subject, classLevel, difficulty, type, correctAnswer, solution, source } = req.body;
    const createdBy = req.user?.id || req.body.createdBy;

    // 1. Ana Resmi Bul
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const mainImagePath = mainImgFile ? `/uploads/${mainImgFile.filename}` : '';

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
      text, subject, classLevel, difficulty, type, correctAnswer, solution,
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

    // AI soruları frontend'den "source: 'AI'" etiketiyle geliyor.
    // Direkt kaydediyoruz.
    const savedQuestions = await Question.insertMany(questions);

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
    const fields = ['text', 'subject', 'classLevel', 'difficulty', 'type', 'correctAnswer', 'solution', 'source'];
    fields.forEach(f => { if(req.body[f]) question[f] = req.body[f]; });

    // Ana Resim Güncellemesi
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    if (mainImgFile) question.image = `/uploads/${mainImgFile.filename}`;

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