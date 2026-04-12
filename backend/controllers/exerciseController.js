const Exercise = require('../models/Exercise');
const Question = require('../models/Question');
const User = require('../models/User');

// ✅ 1. EGZERSIZ OLUŞTUR (AI - Teacher)
exports.createExercise = async (req, res, next) => {
  try {
    const { name, description, classLevel, subject, difficulty, gameMode, timeLimit, pointsPerQuestion } = req.body;
    const teacherId = req.user.id;

    if (!name || !classLevel || !Array.isArray(difficulty) || difficulty.length === 0) {
      return res.status(400).json({ message: 'Ad, sınıf ve zorluk seviyeleri gerekli' });
    }

    // Sınıf ve zorluk seviyelerine göre sorular getir
    const matchStage = {
      classLevel,
      subject: subject || 'Matematik',
      difficulty: { $in: difficulty }
    };

    const questions = await Question.find(matchStage);
    
    if (questions.length === 0) {
      return res.status(400).json({ message: 'Belirtilen kriterlerde soru bulunamadı' });
    }

    // Sorular random olsun ama dengeli (kolay/orta/zor)
    const questionIds = questions.slice(0, Math.min(questions.length, 15)).map(q => q._id);

    const newExercise = await Exercise.create({
      name,
      description: description || '',
      classLevel,
      subject: subject || 'Matematik',
      difficulty,
      questions: questionIds,
      totalQuestions: questionIds.length,
      createdBy: teacherId,
      gameMode: gameMode || 'practice',
      timeLimit: timeLimit || null,
      pointsPerQuestion: pointsPerQuestion || 10
    });

    res.status(201).json({ success: true, message: 'Egzersiz oluşturuldu', data: newExercise });
  } catch (error) {
    next(error);
  }
};

// ✅ 2. SINIFINIZA AIT TÜM EGZERSIZLERI GETIR (Teacher)
exports.getTeacherExercises = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { classLevel, page = 1, limit = 10 } = req.query;

    const query = { createdBy: teacherId };
    if (classLevel) query.classLevel = classLevel;

    const total = await Exercise.countDocuments(query);
    const exercises = await Exercise.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name');

    res.json({
      success: true,
      data: exercises,
      totalPages: Math.ceil(total / limit),
      page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// ✅ 3. ÖĞRENCİ SINIFININA AIT EGZERSIZLERI GETIR (Student)
exports.getStudentExercises = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Öğrencinin sınıfını al
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    // grade (örn: "9. Sınıf") veya classLevel olabilir
    const studentClass = student.grade || student.classLevel;
    if (!studentClass) {
      return res.status(400).json({ message: 'Öğrenci sınıf bilgisi bulunamadı' });
    }

    const query = { 
      classLevel: studentClass,
      isActive: true 
    };

    const total = await Exercise.countDocuments(query);
    const exercises = await Exercise.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name')
      .populate('questions', 'text difficulty options correctAnswer');

    // Her egzersiz için öğrencinin ilerlemesini ekle
    const enrichedExercises = exercises.map(ex => {
      const submission = ex.submissions?.find(s => s.studentId.toString() === studentId);
      return {
        ...ex.toObject(),
        studentProgress: submission ? {
          score: submission.score,
          status: submission.status,
          completedQuestions: submission.completedQuestions,
          startedAt: submission.startedAt
        } : null
      };
    });

    res.json({
      success: true,
      data: enrichedExercises,
      totalPages: Math.ceil(total / limit),
      page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// ✅ 4. EGZERSIZ DETAYI GETIR
exports.getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('questions')
      .populate('createdBy', 'name email');

    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    res.json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

// ✅ 5. EGZERSIZ SILME (Teacher)
exports.deleteExercise = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    if (exercise.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu egzersizi silme yetkiniz yok' });
    }

    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Egzersiz silindi' });
  } catch (error) {
    next(error);
  }
};

// ✅ 6. EGZERSIZ CEVAPLARINI KAYDET (Student)
exports.submitExercise = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { exerciseId, answers } = req.body;

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    let correctCount = 0;
    const submittedAnswers = [];

    // Her sorunun cevabını kontrol et
    for (const [questionId, userAnswer] of Object.entries(answers)) {
      const question = exercise.questions.find(q => q._id.toString() === questionId);
      if (question) {
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) correctCount++;
        
        submittedAnswers.push({
          questionId,
          answer: userAnswer,
          correct: isCorrect,
          timeSpent: 0
        });
      }
    }

    const score = Math.round((correctCount / exercise.totalQuestions) * 100);
    const points = correctCount * exercise.pointsPerQuestion;

    // Eğer submission varsa güncelle, yoksa yeni oluştur
    let submission = exercise.submissions.find(s => s.studentId.toString() === studentId);
    
    if (submission) {
      submission.answers = submittedAnswers;
      submission.score = score;
      submission.completedQuestions = correctCount;
      submission.status = 'completed';
      submission.completedAt = new Date();
    } else {
      exercise.submissions.push({
        studentId,
        studentName: req.user.name,
        score,
        completedQuestions: correctCount,
        status: 'completed',
        answers: submittedAnswers,
        completedAt: new Date()
      });
    }

    await exercise.save();

    res.json({ 
      success: true, 
      message: 'Egzersiz tamamlandı',
      score,
      points,
      correctCount,
      totalQuestions: exercise.totalQuestions
    });
  } catch (error) {
    next(error);
  }
};

// ✅ 7. EGZERSIZ GÜNCELLEŞTIR (Teacher)
exports.updateExercise = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { name, description, gameMode, timeLimit, isActive } = req.body;

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    if (exercise.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu egzersizi güncelleme yetkiniz yok' });
    }

    if (name) exercise.name = name;
    if (description) exercise.description = description;
    if (gameMode) exercise.gameMode = gameMode;
    if (timeLimit) exercise.timeLimit = timeLimit;
    if (isActive !== undefined) exercise.isActive = isActive;

    await exercise.save();
    res.json({ success: true, message: 'Egzersiz güncellendi', data: exercise });
  } catch (error) {
    next(error);
  }
};
