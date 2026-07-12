const Exercise = require('../models/Exercise');
const Question = require('../models/Question');
const User = require('../models/User');
const Student = require('../models/Student');
const { gradeQuestionAnswer } = require('../utils/questionGrading');
const { ensureStudentLinkedToTeacher } = require('../utils/studentRosterSync');
const { recordUserActivity } = require('../services/activityLogger');
const { buildTopicMongoClause } = require('../constants/patternTopics');
const { stripQuestionForStudent } = require('../utils/examSchedule');
const { parseAnswerPayload, summarizeExerciseSubmission } = require('../utils/exerciseAnswer');
const { generateAndSaveExerciseVariants } = require('../services/exerciseQuestionVariantService');
const {
  classLevelsMatch,
  classLevelQueryValues,
  sameStudentId,
} = require('../utils/classLevel');

const STUDENT_QUESTION_FIELDS =
  'text difficulty type options image imageKey imageProvider interactiveType interactionData topic subject assessmentMeta';

async function resolveStudentClass(studentId) {
  const student = await User.findById(studentId).select('grade classLevel name');
  if (!student) return { error: 'Öğrenci bulunamadı', status: 404 };
  const studentClass = student.grade || student.classLevel || null;
  // grade yoksa 400 yerine caller boş liste / soft empty dönebilir
  return { student, studentClass };
}

async function assertStudentCanAccessExercise(exercise, studentId) {
  const { student, studentClass, error, status } = await resolveStudentClass(studentId);
  if (error) return { ok: false, error, status };
  if (!studentClass) {
    return { ok: false, error: 'Öğrenci sınıf bilgisi bulunamadı', status: 400 };
  }
  if (!exercise.isActive) return { ok: false, error: 'Egzersiz aktif değil', status: 403 };
  if (!classLevelsMatch(exercise.classLevel, studentClass)) {
    return { ok: false, error: 'Bu egzersiz sizin sınıfınıza ait değil', status: 403 };
  }
  return { ok: true, student, studentClass };
}

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
      const generated = await generateAndSaveExerciseVariants({
        classLevel,
        subject: subj,
        topic,
        questionTypes,
        limit: AUTO_POOL_LIMIT,
        createdBy: teacherId,
      });

      if (generated.error) {
        return res.status(400).json({ message: generated.error });
      }

      questionIds = generated.questionIds;
      difficultyFinal = generated.difficulties?.length ? generated.difficulties : ['Orta'];
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

    const { student, studentClass, error, status } = await resolveStudentClass(studentId);
    if (error) {
      return res.status(status).json({ message: error });
    }

    // Sınıf yoksa soft empty — 400 yerine boş liste (UI kırılmasın)
    if (!studentClass) {
      return res.json({
        success: true,
        data: [],
        totalPages: 0,
        page: Number(page) || 1,
        total: 0,
        warning: 'Öğrenci sınıf bilgisi eksik; egzersiz listesi boş.',
      });
    }

    const classVariants = classLevelQueryValues(studentClass);
    const query = {
      classLevel: classVariants.length > 1 ? { $in: classVariants } : studentClass,
      isActive: true,
    };

    const total = await Exercise.countDocuments(query);
    const exercises = await Exercise.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name')
      .select('-submissions.answers');

    const enrichedExercises = exercises.map((ex) => {
      const submission = (ex.submissions || []).find((s) => sameStudentId(s?.studentId, studentId));
      return {
        ...ex.toObject(),
        questions: undefined,
        questionCount: ex.totalQuestions || (ex.questions?.length ?? 0),
        studentProgress: submission
          ? {
              score: submission.score,
              status: submission.status,
              completedQuestions: submission.completedQuestions,
              startedAt: submission.startedAt,
              completedAt: submission.completedAt,
              totalTimeSpent: submission.totalTimeSpent ?? null,
            }
          : null,
      };
    });

    res.json({
      success: true,
      data: enrichedExercises,
      totalPages: Math.ceil(total / limit),
      page: Number(page) || 1,
      total,
      studentClass,
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

    if (req.user?.role === 'student') {
      const access = await assertStudentCanAccessExercise(exercise, req.user.id);
      if (!access.ok) {
        return res.status(access.status).json({ message: access.error });
      }
      const doc = exercise.toObject();
      doc.questions = (doc.questions || []).filter(Boolean).map(stripQuestionForStudent);
      const submission = (exercise.submissions || []).find((s) =>
        sameStudentId(s?.studentId, req.user.id),
      );
      return res.json({
        success: true,
        data: {
          ...doc,
          studentProgress: submission ? {
            score: submission.score,
            status: submission.status,
            completedAt: submission.completedAt,
            totalTimeSpent: submission.totalTimeSpent ?? null,
          } : null,
        },
      });
    }

    res.json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

// ✅ 4b. ÖĞRENCİ EGZERSİZ OYNAT (cevap anahtarı gizli)
exports.getExerciseForPlay = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('questions', STUDENT_QUESTION_FIELDS)
      .populate('createdBy', 'name');

    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    const access = await assertStudentCanAccessExercise(exercise, req.user.id);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.error });
    }

    const submission = (exercise.submissions || []).find((s) =>
      sameStudentId(s?.studentId, req.user.id),
    );

    const playQuestions = (exercise.questions || [])
      .filter(Boolean)
      .map(stripQuestionForStudent);

    res.json({
      success: true,
      data: {
        _id: exercise._id,
        name: exercise.name,
        description: exercise.description,
        classLevel: exercise.classLevel,
        subject: exercise.subject,
        topic: exercise.topic,
        totalQuestions: playQuestions.length || exercise.totalQuestions,
        gameMode: exercise.gameMode,
        playTransform: exercise.playTransform,
        timeLimit: exercise.timeLimit,
        pointsPerQuestion: exercise.pointsPerQuestion,
        createdBy: exercise.createdBy,
        questions: playQuestions,
        emptyQuestions: playQuestions.length === 0,
        studentProgress: submission
          ? {
              score: submission.score,
              status: submission.status,
              completedAt: submission.completedAt,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ 4c. TEK SORU KONTROL (anında geri bildirim)
exports.checkExerciseAnswer = async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;
    if (!questionId) {
      return res.status(400).json({ message: 'questionId gerekli' });
    }

    const exercise = await Exercise.findById(req.params.id).populate(
      'questions',
      `${STUDENT_QUESTION_FIELDS} correctAnswer solution`,
    );
    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    const access = await assertStudentCanAccessExercise(exercise, req.user.id);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.error });
    }

    const question = exercise.questions.find((q) => String(q._id) === String(questionId));
    if (!question) {
      return res.status(404).json({ message: 'Soru bu egzersize ait değil' });
    }

    const isCorrect = gradeQuestionAnswer(question, answer);
    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      solution: question.solution || '',
      topic: question.topic || '',
    });
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
    const { answers, totalTimeSpentSeconds } = req.body;

    const exercise = await Exercise.findById(exerciseId).populate(
      'questions',
      `${STUDENT_QUESTION_FIELDS} correctAnswer solution`,
    );
    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    const access = await assertStudentCanAccessExercise(exercise, studentId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.error });
    }

    let correctCount = 0;
    const submittedAnswers = [];
    const reviewByQuestion = {};

    for (const [questionId, rawPayload] of Object.entries(answers || {})) {
      const question = exercise.questions.find((q) => String(q._id) === String(questionId));
      if (question) {
        const { answer: userAnswer, timeSpent } = parseAnswerPayload(rawPayload);
        const isCorrect = gradeQuestionAnswer(question, userAnswer);
        if (isCorrect) correctCount += 1;

        submittedAnswers.push({
          questionId,
          answer: userAnswer,
          correct: isCorrect,
          timeSpent,
        });

        reviewByQuestion[questionId] = {
          isCorrect,
          userAnswer,
          correctAnswer: question.correctAnswer,
          solution: question.solution || '',
          timeSpent,
        };
      }
    }

    const { score, points, totalTimeSpent } = summarizeExerciseSubmission({
      correctCount,
      totalQuestions: exercise.totalQuestions,
      pointsPerQuestion: exercise.pointsPerQuestion,
      totalTimeSpentSeconds,
      submittedAnswers,
    });

    let submission = (exercise.submissions || []).find((s) =>
      sameStudentId(s?.studentId, studentId),
    );

    const studentDoc =
      access.student ||
      (await User.findById(studentId).select('name').lean());
    const studentName =
      studentDoc?.name || req.user.name || req.user.email || 'Öğrenci';

    if (submission) {
      submission.answers = submittedAnswers;
      submission.score = score;
      submission.completedQuestions = correctCount;
      submission.status = 'completed';
      submission.completedAt = new Date();
      submission.totalTimeSpent = totalTimeSpent;
      if (!submission.studentName) submission.studentName = studentName;
    } else {
      exercise.submissions.push({
        studentId,
        studentName,
        score,
        completedQuestions: correctCount,
        status: 'completed',
        answers: submittedAnswers,
        completedAt: new Date(),
        totalTimeSpent,
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
      metadata: { score, correctCount, totalTimeSpent },
    });

    res.json({
      success: true,
      message: 'Egzersiz tamamlandı',
      score,
      points,
      correctCount,
      totalQuestions: exercise.totalQuestions,
      totalTimeSpent,
      data: {
        score,
        points,
        correctCount,
        totalQuestions: exercise.totalQuestions,
        totalTimeSpent,
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

// ✅ 8. EGZERSIZ SONUÇLARI (Teacher / admin)
exports.getExerciseResults = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const exercise = await Exercise.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('questions', 'text topic difficulty');

    if (!exercise) {
      return res.status(404).json({ message: 'Egzersiz bulunamadı' });
    }

    if (!isAdmin && exercise.createdBy?.toString?.() !== teacherId && exercise.createdBy?._id?.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu egzersizin sonuçlarını görme yetkiniz yok' });
    }

    const submissions = (exercise.submissions || []).filter((s) => s.status === 'completed');
    const scores = submissions.map((s) => Number(s.score) || 0);
    const times = submissions
      .map((s) => s.totalTimeSpent)
      .filter((t) => t != null && Number.isFinite(t));

    const rosterCount = await Student.countDocuments({
      teacherId,
      grade: exercise.classLevel,
    });

    res.json({
      success: true,
      exercise: {
        _id: exercise._id,
        name: exercise.name,
        classLevel: exercise.classLevel,
        subject: exercise.subject,
        topic: exercise.topic,
        totalQuestions: exercise.totalQuestions,
        timeLimit: exercise.timeLimit,
        gameMode: exercise.gameMode,
      },
      summary: {
        participantCount: submissions.length,
        avgScore: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0,
        avgTimeSpentSeconds: times.length
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : null,
        rosterCount,
        participationRate: rosterCount
          ? Math.round((submissions.length / rosterCount) * 100)
          : null,
      },
      students: submissions.map((s) => {
        const answerList = s.answers || [];
        const correctFromAnswers = answerList.filter((a) => a.correct).length;
        const wrongFromAnswers = answerList.filter((a) => a.correct === false).length;
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          score: s.score,
          correctCount: correctFromAnswers || s.completedQuestions || 0,
          wrongCount: wrongFromAnswers,
          totalTimeSpent: s.totalTimeSpent ?? null,
          completedAt: s.completedAt,
          avgTimePerQuestion: (() => {
            const answerTimes = answerList
              .map((a) => a.timeSpent)
              .filter((t) => t != null && t > 0);
            return answerTimes.length
              ? Math.round(answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length)
              : null;
          })(),
        };
      }).sort((a, b) => (b.score || 0) - (a.score || 0)),
    });
  } catch (error) {
    next(error);
  }
};
