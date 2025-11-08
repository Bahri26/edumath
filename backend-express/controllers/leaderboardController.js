// backend-express/controllers/leaderboardController.js

const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// @desc    Sınıf leaderboard'unu getir
// @route   GET /api/leaderboard/class/:classId
// @access  Private
exports.getClassLeaderboard = async (req, res) => {
  try {
    const { classId } = req.params;
    const { metric = 'xp' } = req.query;
    
    const leaderboard = await Leaderboard.getOrCreate('class', {
      referenceId: classId
    }, metric);
    
    // Populate user bilgileri
    await leaderboard.populate('entries.userId', 'firstName lastName gamification analytics');
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Sınıf seviyesi leaderboard'unu getir
// @route   GET /api/leaderboard/grade/:gradeLevel
// @access  Private
exports.getGradeLeaderboard = async (req, res) => {
  try {
    const { gradeLevel } = req.params;
    const { metric = 'xp' } = req.query;
    
    const leaderboard = await Leaderboard.getOrCreate('grade', {
      gradeLevel: parseInt(gradeLevel)
    }, metric);
    
    await leaderboard.populate('entries.userId', 'firstName lastName gamification analytics');
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Global leaderboard'u getir
// @route   GET /api/leaderboard/global
// @access  Private
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { metric = 'xp' } = req.query;
    
    const leaderboard = await Leaderboard.getOrCreate('global', {}, metric);
    
    await leaderboard.populate('entries.userId', 'firstName lastName gradeLevel gamification analytics');
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Haftalık leaderboard'u getir
// @route   GET /api/leaderboard/weekly
// @access  Private
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const { metric = 'xp' } = req.query;
    
    const leaderboard = await Leaderboard.getOrCreate('weekly', {}, metric);
    
    await leaderboard.populate('entries.userId', 'firstName lastName gamification analytics');
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Aylık leaderboard'u getir
// @route   GET /api/leaderboard/monthly
// @access  Private
exports.getMonthlyLeaderboard = async (req, res) => {
  try {
    const { metric = 'xp' } = req.query;
    
    const leaderboard = await Leaderboard.getOrCreate('monthly', {}, metric);
    
    await leaderboard.populate('entries.userId', 'firstName lastName gamification analytics');
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Kullanıcının sıralamasını getir
// @route   GET /api/leaderboard/:type/:id/my-rank
// @access  Private/Student
exports.getMyRank = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { metric = 'xp' } = req.query;
    const userId = req.user._id;
    
    let scope = {};
    if (type === 'class') {
      scope.referenceId = id;
    } else if (type === 'grade') {
      scope.gradeLevel = parseInt(id);
    }
    
    const leaderboard = await Leaderboard.getOrCreate(type, scope, metric);
    
    const rankInfo = leaderboard.getUserRank(userId);
    
    if (!rankInfo) {
      return res.status(404).json({ message: 'Sıralama bulunamadı' });
    }
    
    // Etrafındaki kullanıcıları da getir
    const nearby = leaderboard.getNearbyRanks(userId, 5);
    await Leaderboard.populate(nearby, { path: 'userId', select: 'firstName lastName gamification' });
    
    res.json({
      myRank: rankInfo,
      nearby: nearby
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Leaderboard'u manuel güncelle
// @route   POST /api/leaderboard/:type/:id/update
// @access  Private/Admin
exports.updateLeaderboard = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { metric = 'xp' } = req.query;
    
    let scope = {};
    if (type === 'class') {
      scope.referenceId = id;
    } else if (type === 'grade') {
      scope.gradeLevel = parseInt(id);
    }
    
    const leaderboard = await Leaderboard.getOrCreate(type, scope, metric);
    await leaderboard.updateRankings();
    
    res.json({
      message: 'Leaderboard güncellendi',
      leaderboard: leaderboard
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Top N kullanıcıyı getir
// @route   GET /api/leaderboard/:type/:id/top/:count
// @access  Private
exports.getTopUsers = async (req, res) => {
  try {
    const { type, id, count } = req.params;
    const { metric = 'xp' } = req.query;
    
    let scope = {};
    if (type === 'class') {
      scope.referenceId = id;
    } else if (type === 'grade') {
      scope.gradeLevel = parseInt(id);
    }
    
    const leaderboard = await Leaderboard.getOrCreate(type, scope, metric);
    
    const topCount = Math.min(parseInt(count), 100); // Maksimum 100
    const topUsers = leaderboard.entries.slice(0, topCount);
    
    await Leaderboard.populate(topUsers, { path: 'userId', select: 'firstName lastName gamification analytics' });
    
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Kullanıcının tüm leaderboard pozisyonları
// @route   GET /api/leaderboard/my-positions
// @access  Private/Student
exports.getMyAllPositions = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('classId gradeLevel');
    
    const positions = {};
    
    // Global
    const globalBoard = await Leaderboard.getOrCreate('global', {}, 'xp');
    positions.global = globalBoard.getUserRank(userId);
    
    // Grade
    if (user.gradeLevel) {
      const gradeBoard = await Leaderboard.getOrCreate('grade', {
        gradeLevel: user.gradeLevel
      }, 'xp');
      positions.grade = gradeBoard.getUserRank(userId);
    }
    
    // Class
    if (user.classId) {
      const classBoard = await Leaderboard.getOrCreate('class', {
        referenceId: user.classId
      }, 'xp');
      positions.class = classBoard.getUserRank(userId);
    }
    
    // Weekly
    const weeklyBoard = await Leaderboard.getOrCreate('weekly', {}, 'xp');
    positions.weekly = weeklyBoard.getUserRank(userId);
    
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Tüm aktif leaderboard'ları listele
// @route   GET /api/leaderboard/all
// @access  Private/Admin
exports.getAllLeaderboards = async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find({ isActive: true })
      .sort({ lastUpdated: -1 })
      .limit(50);
    
    res.json(leaderboards);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};
