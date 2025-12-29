const Question = require('../models/Question');
const fs = require('fs');
const path = require('path');

// --- YARDIMCI FONKSİYON: RESİM SİLME ---
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, '..', imagePath); // Dosya yolunu düzeltin
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// --- 1. TÜM SORULARI GETİR (Öğrenci/Genel Havuz İçin) ---
exports.getQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty } = req.query;

    const query = {};
    if (search) query.text = { $regex: search, $options: 'i' };
    if (subject && subject !== 'Tümü') query.subject = subject;
    if (classLevel && classLevel !== 'Tümü') query.classLevel = classLevel;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

    const total = await Question.countDocuments(query);

    const questions = await Question.find(query)
      .select('text subject classLevel difficulty type source createdAt image options correctAnswer solution') // Performans için select
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page,
      total,
      data: questions
    });
  } catch (error) { next(error); }
};

// --- 2. ÖĞRETMENİN KENDİ SORULARINI GETİR ---
exports.getTeacherQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty } = req.query;
    
    // Auth Middleware'den gelen ID
    const teacherId = req.user?.id; 

    const query = {};
    // Sadece bu öğretmenin eklediği veya "Genel Havuz" soruları
    // Eğer sadece kendisininkileri görsün isterseniz: query.createdBy = teacherId;
    if (teacherId) {
        query.$or = [{ createdBy: teacherId }, { source: 'AI' }]; 
    }

    if (search) query.text = { $regex: search, $options: 'i' };
    if (subject && subject !== 'Tümü') query.subject = subject;
    if (classLevel && classLevel !== 'Tümü') query.classLevel = classLevel;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

    const total = await Question.countDocuments(query);

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page,
      total,
      data: questions
    });
  } catch (error) { next(error); }
};

// --- 3. SORU OLUŞTURMA (MANUEL) ---
exports.createQuestion = async (req, res, next) => {
  try {
    const { text, subject, classLevel, difficulty, type, correctAnswer, solution, source } = req.body;
    const createdBy = req.user?.id;

    // Resim İşleme
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const mainImagePath = mainImgFile ? `/uploads/${mainImgFile.filename}` : '';

    // Şık İşleme
    let optionsData = [];
    if (req.body.options) {
       // Frontend array gönderiyor ama multipart/form-data olduğu için string gelebilir, parse etmeliyiz
       const parsedOptions = Array.isArray(req.body.options) ? req.body.options : [req.body.options];
       optionsData = parsedOptions.map(opt => ({ text: opt, image: '' }));
    }

    // Şık Resimleri
    if (req.files) {
      req.files.forEach(f => {
        if (f.fieldname.startsWith('optionImage_')) {
          const index = parseInt(f.fieldname.split('_')[1]);
          if (optionsData[index]) optionsData[index].image = `/uploads/${f.filename}`;
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
  } catch (error) { next(error); }
};

// --- 4. TOPLU SORU EKLE (AI) ---
exports.batchCreateQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    const teacherId = req.user?.id;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "Liste boş." });
    }

    // Her soruya öğretmeni ekle
    const questionsWithUser = questions.map(q => ({
        ...q,
        createdBy: teacherId,
        source: 'AI'
    }));

    const savedQuestions = await Question.insertMany(questionsWithUser);

    res.status(201).json({
      success: true,
      message: `${savedQuestions.length} soru eklendi.`,
      data: savedQuestions
    });
  } catch (error) { next(error); }
};

// --- 5. GÜNCELLEME (RESİM SİLME DESTEKLİ) ---
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Soru yok" });

    // Yetki Kontrolü (Opsiyonel: Sadece kendi sorusunu güncelleyebilir)
    // if (question.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Yetkisiz işlem" });

    const fields = ['text', 'subject', 'classLevel', 'difficulty', 'type', 'correctAnswer', 'solution'];
    fields.forEach(f => { if(req.body[f]) question[f] = req.body[f]; });

    // Ana Resim Değişirse Eskisini Sil
    const mainImgFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    if (mainImgFile) {
        deleteImageFile(question.image); // Eski resmi sil
        question.image = `/uploads/${mainImgFile.filename}`;
    }

    // Şık Güncellemesi
    if (req.body.options) {
        const parsedOptions = Array.isArray(req.body.options) ? req.body.options : [req.body.options];
        
        let newOptions = parsedOptions.map((txt, i) => {
            // Eski resmi koru
            const oldImg = (question.options[i] && question.options[i].image) || '';
            return { text: txt, image: oldImg };
        });

        // Yeni şık resmi varsa eskisini silip yenisini koy
        if (req.files) {
            req.files.forEach(f => {
                if (f.fieldname.startsWith('optionImage_')) {
                    const index = parseInt(f.fieldname.split('_')[1]);
                    if (newOptions[index]) {
                        deleteImageFile(newOptions[index].image); // Eskiyi sil
                        newOptions[index].image = `/uploads/${f.filename}`;
                    }
                }
            });
        }
        question.options = newOptions;
    }

    await question.save();
    res.status(200).json({ success: true, data: question });
  } catch (error) { next(error); }
};

// --- 6. SİLME (DOSYA TEMİZLİĞİ İLE) ---
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Soru bulunamadı" });

    // 1. Ana Resmi Sil
    deleteImageFile(question.image);

    // 2. Şık Resimlerini Sil
    if (question.options) {
        question.options.forEach(opt => deleteImageFile(opt.image));
    }

    // 3. Veritabanından Sil
    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Soru ve resimler silindi.' });
  } catch (error) { next(error); }
};