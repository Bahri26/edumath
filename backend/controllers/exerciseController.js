const Exercise = require('../models/Exercise');
const Question = require('../models/Question');
const User = require('../models/User');
const { gradeQuestionAnswer } = require('../utils/questionGrading');
const { ensureStudentLinkedToTeacher } = require('../utils/studentRosterSync');
const { recordUserActivity } = require('../services/activityLogger');
const { buildTopicMongoClause } = require('../constants/patternTopics');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MAX_EXERCISE_QUESTIONS = 30;
const AUTO_POOL_LIMIT = 15;

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPoolMatchQuery({ classLevel, subject, topic, questionTypes }) {
  const subj = subject || 'Matematik';
  const matchStage = {
    classLevel,
    subject: { $regex: new RegExp(`^${escapeRegex(subj)}$`, 'i') },
  };
  const topicClause = buildTopicMongoClause(topic, escapeRegex);
  if (topicClause) matchStage.topic = topicClause;
  const types = Array.isArray(questionTypes) ? questionTypes.filter(Boolean) : [];
  if (types.length > 0) matchStage.type = { $in: types };
  return matchStage;
}

/** Seçilen id sırasını koruyarak doğrula; sınıf + ders eşleşmesi zorunlu */
async function resolveQuestionIdsForExercise(orderedIds, classLevel, subject) {
  const subj = subject || 'Matematik';
  const subjClause = { $regex: new RegExp(`^${escapeRegex(subj)}$`, 'i') };
  const uniqueIds = [...new Set(orderedIds.map((id) => String(id)).filter(Boolean))].slice(0, MAX_EXERCISE_QUESTIONS);
  if (uniqueIds.length === 0) return { questionIds: [], difficulties: [] };

  const docs = await Question.find({
    _id: { $in: uniqueIds },
    classLevel,
    subject: subjClause,
  })
    .select('_id difficulty')
    .lean();

  if (docs.length !== uniqueIds.length) {
    return { error: 'Seçilen soruların bir kısmı bulunamadı veya sınıf/ders bilgisi uyuşmuyor.' };
  }

  const byId = new Map(docs.map((d) => [String(d._id), d]));
  const questionIds = uniqueIds.map((id) => byId.get(id)._id);
  const difficulties = [...new Set(docs.map((d) => d.difficulty).filter(Boolean))];
  return { questionIds, difficulties };
}

// ✅ 1. EGZERSIZ OLUŞTUR (havuz otomatik veya questionIds ile manuel)
exports.createExercise = async (req, res, next) => {
  try {
    const {
      name,
      description,
      classLevel,
      subject,
      topic,
      questionTypes,
      difficulty,
      gameMode,
      timeLimit,
      pointsPerQuestion,
      questionIds: rawQuestionIds,
      playTransform,
    } = req.body;
    const teacherId = req.user.id;

    if (!name || !classLevel) {
      return res.status(400).json({ message: 'Ad ve sınıf gerekli' });
    }

    const subj = subject || 'Matematik';
    const rawIds = Array.isArray(rawQuestionIds) ? rawQuestionIds : [];
    const wantsManual = rawIds.length > 0;

    let questionIds = [];
    let difficultyFinal = Array.isArray(difficulty) ? [...difficulty] : [];

    if (wantsManual) {
      const resolved = await resolveQuestionIdsForExercise(rawIds, classLevel, subj);
      if (resolved.error) {
        return res.status(400).json({ message: resolved.error });
      }
      questionIds = resolved.questionIds;
      if (questionIds.length === 0) {
        return res.status(400).json({ message: 'En az bir soru seçmelisiniz' });
      }
      difficultyFinal = [...new Set([...difficultyFinal, ...resolved.difficulties])];
      if (difficultyFinal.length === 0) {
        difficultyFinal = resolved.difficulties.length ? resolved.difficulties : ['Orta'];
      }
    } else {
      const matchStage = buildPoolMatchQuery({
        classLevel,
        subject: subj,
        topic,
        questionTypes,
      });

      const questions = await Question.find(matchStage).select('_id difficulty').lean();

      if (questions.length === 0) {
        return res.status(400).json({
          message: 'Seçilen sınıf, konu ve soru çeşidine uygun soru bulunamadı.',
        });
      }

      shuffleInPlace(questions);
      const picked = questions.slice(0, Math.min(questions.length, AUTO_POOL_LIMIT));
      questionIds = picked.map((q) => q._id);
      difficultyFinal = [...new Set(picked.map((d) => d.difficulty).filter(Boolean))];
      if (difficultyFinal.length === 0) difficultyFinal = ['Orta'];
    }

    const topicLabel =
      typeof topic === 'string' && topic.trim() && topic.trim() !== 'Tümü' ? topic.trim() : '';

    const allowedPlay = ['classic', 'game_show'];
    const play =
      typeof playTransform === 'string' && allowedPlay.includes(playTransform) ? playTransform : 'classic';

    const newExercise = await Exercise.create({
      name,
      description: description || '',
      classLevel,
      subject: subj,
      topic: topicLabel,
      difficulty: difficultyFinal,
      questions: questionIds,
      totalQuestions: questionIds.length,
      createdBy: teacherId,
      gameMode: gameMode || 'practice',
      playTransform: play,
      timeLimit: timeLimit || null,
      pointsPerQuestion: pointsPerQuestion || 10,
    });

    const teacher = await User.findById(teacherId).select('name email role').lean();
    await recordUserActivity(req, {
      user: teacher,
      action: 'exercise_create',
      category: 'content',
      summary: `Egzersiz oluşturdu: ${name}`,
      targetType: 'exercise',
      targetId: newExercise._id,
      targetLabel: name,
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
      .populate(
        'questions',
        'text difficulty type options correctAnswer solution image imageKey imageProvider interactiveType interactionData topic subject'
      );

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
    const exerciseId = req.params.id || req.body.exerciseId;
    const { answers } = req.body;

    const exercise = await Exercise.findById(exerciseId).populate(
      'questions',
      'text difficulty type options correctAnswer solution image imageKey imageProvider interactiveType interactionData topic subject'
    );
    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    let correctCount = 0;
    const submittedAnswers = [];
    const reviewByQuestion = {};

    // Her sorunun cevabını kontrol et
    for (const [questionId, userAnswer] of Object.entries(answers || {})) {
      const question = exercise.questions.find((q) => String(q._id) === String(questionId));
      if (question) {
        const isCorrect = gradeQuestionAnswer(question, userAnswer);
        if (isCorrect) correctCount += 1;

        submittedAnswers.push({
          questionId,
          answer: userAnswer,
          correct: isCorrect,
          timeSpent: 0
        });

        reviewByQuestion[questionId] = {
          isCorrect,
          userAnswer,
          correctAnswer: question.correctAnswer,
        };
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

    if (exercise.createdBy) {
      await ensureStudentLinkedToTeacher(exercise.createdBy, studentId);
    }

    const student = await User.findById(studentId).select('name email role').lean();
    await recordUserActivity(req, {
      user: student,
      action: 'exercise_submit',
      category: 'learning',
      summary: `Egzersiz tamamladı: ${exercise.name} (%${score})`,
      targetType: 'exercise',
      targetId: exercise._id,
      targetLabel: exercise.name,
      metadata: { score, correctCount },
    });

    res.json({
      success: true,
      message: 'Egzersiz tamamlandı',
      score,
      points,
      correctCount,
      totalQuestions: exercise.totalQuestions,
      data: {
        score,
        points,
        correctCount,
        totalQuestions: exercise.totalQuestions,
        answers: reviewByQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ 7. EGZERSIZ GÜNCELLEŞTIR (Teacher)
exports.updateExercise = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { name, description, gameMode, timeLimit, isActive, questionIds: rawQuestionIds, playTransform } = req.body;

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    if (exercise.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu egzersizi güncelleme yetkiniz yok' });
    }

    if (name) exercise.name = name;
    if (description !== undefined) exercise.description = description;
    if (gameMode) exercise.gameMode = gameMode;
    if (timeLimit !== undefined) exercise.timeLimit = timeLimit;
    if (isActive !== undefined) exercise.isActive = isActive;
    if (typeof playTransform === 'string' && ['classic', 'game_show'].includes(playTransform)) {
      exercise.playTransform = playTransform;
    }

    if (Array.isArray(rawQuestionIds)) {
      if (rawQuestionIds.length === 0) {
        return res.status(400).json({ message: 'Soru listesi boş olamaz' });
      }
      const resolved = await resolveQuestionIdsForExercise(
        rawQuestionIds,
        exercise.classLevel,
        exercise.subject || 'Matematik',
      );
      if (resolved.error) {
        return res.status(400).json({ message: resolved.error });
      }
      exercise.questions = resolved.questionIds;
      exercise.totalQuestions = resolved.questionIds.length;
      if (resolved.difficulties.length) {
        exercise.difficulty = resolved.difficulties;
      }
    }

    await exercise.save();
    const populated = await Exercise.findById(exercise._id)
      .populate('questions', 'text difficulty type image classLevel subject')
      .lean();
    res.json({ success: true, message: 'Egzersiz güncellendi', data: populated });
  } catch (error) {
    next(error);
  }
};
