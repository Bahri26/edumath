// backend-express/controllers/dailyChallengeController.js

const { DailyChallenge, UserChallenge } = require('../models/DailyChallenge');
const User = require('../models/User');

// @desc    Tüm challenge template'leri getir (Admin)
// @route   GET /api/challenges/templates
// @access  Private/Admin
exports.getAllTemplates = async (req, res) => {
  try {
    const challenges = await DailyChallenge.find({ isActive: true });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Yeni challenge template oluştur
// @route   POST /api/challenges/templates
// @access  Private/Admin
exports.createTemplate = async (req, res) => {
  try {
    const challenge = await DailyChallenge.create(req.body);
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ message: 'Challenge oluşturulamadı', error: error.message });
  }
};

// @desc    Kullanıcının aktif challenge'larını getir
// @route   GET /api/challenges/my-challenges
// @access  Private/Student
exports.getMyChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Aktif challenge'ları getir
    const challenges = await UserChallenge.find({
      userId: userId,
      expiresAt: { $gt: now }
    })
    .populate('challengeId')
    .sort({ assignedDate: -1 });
    
    // Eğer bugün için challenge yoksa, oluştur
    if (challenges.length === 0) {
      const user = await User.findById(userId);
      const newChallenges = await DailyChallenge.generateDailyChallenges(
        userId,
        user.gradeLevel
      );
      
      if (newChallenges) {
        return res.json(newChallenges);
      }
    }
    
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Challenge progress güncelle
// @route   PUT /api/challenges/:challengeId/progress
// @access  Private/Student
exports.updateChallengeProgress = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { currentValue } = req.body;
    const userId = req.user._id;
    
    const userChallenge = await UserChallenge.findOne({
      _id: challengeId,
      userId: userId
    });
    
    if (!userChallenge) {
      return res.status(404).json({ message: 'Challenge bulunamadı' });
    }
    
    // Progress güncelle
    const isCompleted = userChallenge.updateProgress(currentValue);
    await userChallenge.save();
    
    // Eğer tamamlandıysa bildirim gönder
    if (isCompleted) {
      return res.json({
        message: 'Challenge tamamlandı! 🎉',
        challenge: userChallenge,
        completed: true
      });
    }
    
    res.json(userChallenge);
  } catch (error) {
    res.status(400).json({ message: 'Progress güncellenemedi', error: error.message });
  }
};

// @desc    Challenge ödüllerini al
// @route   POST /api/challenges/:challengeId/claim-rewards
// @access  Private/Student
exports.claimRewards = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user._id;
    
    const userChallenge = await UserChallenge.findOne({
      _id: challengeId,
      userId: userId
    });
    
    if (!userChallenge) {
      return res.status(404).json({ message: 'Challenge bulunamadı' });
    }
    
    if (!userChallenge.isCompleted) {
      return res.status(400).json({ message: 'Challenge henüz tamamlanmadı' });
    }
    
    if (userChallenge.rewardsClaimed) {
      return res.status(400).json({ message: 'Ödüller zaten alındı' });
    }
    
    // Ödülleri uygula
    const success = await userChallenge.claimRewards();
    
    if (!success) {
      return res.status(500).json({ message: 'Ödüller uygulanamadı' });
    }
    
    // Güncellenmiş user bilgisini getir
    const user = await User.findById(userId).select('gamification');
    
    res.json({
      message: 'Ödüller başarıyla alındı!',
      rewards: userChallenge.rewards,
      gamification: user.gamification
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Günlük challenge'ları yenile
// @route   POST /api/challenges/refresh-daily
// @access  Private/Student
exports.refreshDailyChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const challenges = await DailyChallenge.generateDailyChallenges(
      userId,
      user.gradeLevel
    );
    
    if (!challenges) {
      return res.json({ message: 'Bugünün challenge\'ları zaten oluşturulmuş' });
    }
    
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Tamamlanan challenge'ları getir
// @route   GET /api/challenges/completed
// @access  Private/Student
exports.getCompletedChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, skip = 0 } = req.query;
    
    const challenges = await UserChallenge.find({
      userId: userId,
      isCompleted: true
    })
    .populate('challengeId')
    .sort({ completedAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));
    
    const total = await UserChallenge.countDocuments({
      userId: userId,
      isCompleted: true
    });
    
    res.json({
      challenges: challenges,
      total: total,
      hasMore: (parseInt(skip) + parseInt(limit)) < total
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Challenge istatistikleri
// @route   GET /api/challenges/stats
// @access  Private/Student
exports.getChallengeStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const totalCompleted = await UserChallenge.countDocuments({
      userId: userId,
      isCompleted: true
    });
    
    const totalActive = await UserChallenge.countDocuments({
      userId: userId,
      isCompleted: false,
      expiresAt: { $gt: new Date() }
    });
    
    // Bu haftaki tamamlanan challenge sayısı
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyCompleted = await UserChallenge.countDocuments({
      userId: userId,
      isCompleted: true,
      completedAt: { $gte: startOfWeek }
    });
    
    // Toplam kazanılan ödüller
    const completedChallenges = await UserChallenge.find({
      userId: userId,
      isCompleted: true,
      rewardsClaimed: true
    });
    
    const totalRewards = completedChallenges.reduce((acc, challenge) => {
      acc.xp += challenge.rewards.xp || 0;
      acc.gems += challenge.rewards.gems || 0;
      acc.streakFreezes += challenge.rewards.streakFreeze ? 1 : 0;
      return acc;
    }, { xp: 0, gems: 0, streakFreezes: 0 });
    
    res.json({
      totalCompleted: totalCompleted,
      totalActive: totalActive,
      weeklyCompleted: weeklyCompleted,
      totalRewards: totalRewards
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Süresi dolan challenge'ları temizle (Cron job için)
// @route   POST /api/challenges/cleanup-expired
// @access  Private/Admin
exports.cleanupExpiredChallenges = async (req, res) => {
  try {
    const result = await UserChallenge.deleteMany({
      expiresAt: { $lt: new Date() },
      isCompleted: false
    });
    
    res.json({
      message: 'Süresi dolan challenge\'lar temizlendi',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};
