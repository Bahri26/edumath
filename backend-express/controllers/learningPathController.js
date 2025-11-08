// backend-express/controllers/learningPathController.js

const LearningPath = require('../models/LearningPath');
const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');

// @desc    Tüm learning path'leri getir
// @route   GET /api/learning-paths
// @access  Private/Teacher
exports.getAllPaths = async (req, res) => {
  try {
    const paths = await LearningPath.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ gradeLevel: 1, 'units.unitNumber': 1 });
    
    res.json(paths);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Belirli bir sınıf seviyesi için path getir
// @route   GET /api/learning-paths/grade/:gradeLevel
// @access  Private
exports.getPathByGrade = async (req, res) => {
  try {
    const { gradeLevel } = req.params;
    
    const path = await LearningPath.findOne({
      gradeLevel: parseInt(gradeLevel),
      isActive: true
    });
    
    if (!path) {
      return res.status(404).json({ message: 'Bu sınıf seviyesi için path bulunamadı' });
    }
    
    res.json(path);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Yeni learning path oluştur
// @route   POST /api/learning-paths
// @access  Private/Teacher
exports.createPath = async (req, res) => {
  try {
    const pathData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const path = await LearningPath.create(pathData);
    
    res.status(201).json(path);
  } catch (error) {
    res.status(400).json({ message: 'Path oluşturulamadı', error: error.message });
  }
};

// @desc    Öğrenci için path'i başlat
// @route   POST /api/learning-paths/:pathId/initialize
// @access  Private/Student
exports.initializePathForStudent = async (req, res) => {
  try {
    const { pathId } = req.params;
    const studentId = req.user._id;
    
    // Path mevcut mu?
    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({ message: 'Path bulunamadı' });
    }
    
    // Öğrenci zaten bu path'e kayıtlı mı?
    let studentProgress = await StudentProgress.findOne({
      studentId: studentId,
      pathId: pathId
    });
    
    if (studentProgress) {
      return res.status(400).json({ message: 'Bu path zaten başlatılmış' });
    }
    
    // Yeni progress oluştur
    const initialProgress = path.initializeForStudent(studentId);
    studentProgress = await StudentProgress.create(initialProgress);
    
    res.status(201).json(studentProgress);
  } catch (error) {
    res.status(400).json({ message: 'Path başlatılamadı', error: error.message });
  }
};

// @desc    Öğrencinin progress'ini getir
// @route   GET /api/learning-paths/my-progress
// @access  Private/Student
exports.getMyProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { gradeLevel } = req.query;
    
    const query = { studentId: studentId };
    if (gradeLevel) {
      query.gradeLevel = parseInt(gradeLevel);
    }
    
    const progress = await StudentProgress.find(query)
      .populate('pathId', 'subject topic gradeLevel')
      .sort({ lastActivity: -1 });
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Belirli bir path için öğrenci progress'i
// @route   GET /api/learning-paths/:pathId/progress
// @access  Private/Student
exports.getPathProgress = async (req, res) => {
  try {
    const { pathId } = req.params;
    const studentId = req.user._id;
    
    const progress = await StudentProgress.findOne({
      studentId: studentId,
      pathId: pathId
    }).populate('pathId');
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress bulunamadı' });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Dersi tamamla
// @route   POST /api/learning-paths/:pathId/complete-lesson
// @access  Private/Student
exports.completeLesson = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { unitNumber, lessonNumber, score, timeSpent } = req.body;
    const studentId = req.user._id;
    
    const progress = await StudentProgress.findOne({
      studentId: studentId,
      pathId: pathId
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress bulunamadı' });
    }
    
    // Dersi tamamla
    const success = progress.completeLesson(unitNumber, lessonNumber, score, timeSpent);
    
    if (!success) {
      return res.status(400).json({ message: 'Ders tamamlanamadı' });
    }
    
    // XP ve gem hesapla (path'den lesson bilgisini al)
    const path = await LearningPath.findById(pathId);
    const unit = path.units.find(u => u.unitNumber === unitNumber);
    const lesson = unit?.lessons.find(l => l.lessonNumber === lessonNumber);
    
    if (lesson && score >= 60) {
      const xpEarned = lesson.xpReward;
      const gemsEarned = lesson.gemReward;
      
      // User'a XP ve gem ekle
      const user = await User.findById(studentId);
      user.gamification.xp += xpEarned;
      user.gamification.gems += gemsEarned;
      
      // Level kontrolü
      const newLevel = Math.floor(user.gamification.xp / 100) + 1;
      if (newLevel > user.gamification.level) {
        user.gamification.level = newLevel;
      }
      
      await user.save();
      
      // Progress kaydı oluştur
      const Progress = require('../models/gamification/Progress');
      await Progress.create({
        userId: studentId,
        activity: 'lesson_completed',
        lessonId: lesson._id,
        unitNumber: unitNumber,
        lessonNumber: lessonNumber,
        xpEarned: xpEarned,
        gemsEarned: gemsEarned,
        details: {
          score: score,
          timeSpent: timeSpent
        }
      });
    }
    
    await progress.save();
    
    res.json({
      success: true,
      progress: progress,
      nextLesson: progress.getNextLesson()
    });
  } catch (error) {
    res.status(400).json({ message: 'Ders tamamlama hatası', error: error.message });
  }
};

// @desc    Sonraki yapılacak dersi getir
// @route   GET /api/learning-paths/:pathId/next-lesson
// @access  Private/Student
exports.getNextLesson = async (req, res) => {
  try {
    const { pathId } = req.params;
    const studentId = req.user._id;
    
    const progress = await StudentProgress.findOne({
      studentId: studentId,
      pathId: pathId
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress bulunamadı' });
    }
    
    const nextLesson = progress.getNextLesson();
    
    if (!nextLesson) {
      return res.json({ message: 'Tüm dersler tamamlandı!' });
    }
    
    res.json(nextLesson);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Path güncelle
// @route   PUT /api/learning-paths/:pathId
// @access  Private/Teacher
exports.updatePath = async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const path = await LearningPath.findByIdAndUpdate(
      pathId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!path) {
      return res.status(404).json({ message: 'Path bulunamadı' });
    }
    
    res.json(path);
  } catch (error) {
    res.status(400).json({ message: 'Path güncellenemedi', error: error.message });
  }
};

// @desc    Path sil
// @route   DELETE /api/learning-paths/:pathId
// @access  Private/Teacher
exports.deletePath = async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const path = await LearningPath.findByIdAndDelete(pathId);
    
    if (!path) {
      return res.status(404).json({ message: 'Path bulunamadı' });
    }
    
    res.json({ message: 'Path silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};
