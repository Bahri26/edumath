// backend-express/controllers/heartsController.js
const Hearts = require('../models/gamification/Hearts');
const Progress = require('../models/gamification/Progress');

// GET /api/hearts - Get user's hearts status
exports.getHearts = async (req, res) => {
  try {
    const hearts = await Hearts.getOrCreate(req.user._id);
    
    res.json({
      currentHearts: hearts.currentHearts,
      maxHearts: hearts.maxHearts,
      totalHeartsLost: hearts.totalHeartsLost,
      hasUnlimited: hearts.hasUnlimitedHearts(),
      unlimitedUntil: hearts.unlimitedUntil,
      timeUntilNextRefill: hearts.getTimeUntilNextRefill(),
      timeUntilFullRefill: hearts.getTimeUntilFullRefill()
    });
  } catch (err) {
    console.error('Get hearts error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/hearts/lose - Lose a heart (called when answer is wrong)
exports.loseHeart = async (req, res) => {
  try {
    const { exerciseId } = req.body;
    const hearts = await Hearts.getOrCreate(req.user._id);
    const result = await hearts.loseHeart(exerciseId);
    
    // Log heart loss
    await Progress.create({
      userId: req.user._id,
      activity: 'heart_lost',
      xpEarned: 0,
      details: {
        heartsRemaining: result.currentHearts
      }
    });
    
    res.json(result);
  } catch (err) {
    console.error('Lose heart error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/hearts/refill - Manually refill hearts (auto happens on fetch)
exports.refillHearts = async (req, res) => {
  try {
    const hearts = await Hearts.getOrCreate(req.user._id);
    const result = await hearts.refillHearts();
    
    res.json(result);
  } catch (err) {
    console.error('Refill hearts error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/hearts/buy-unlimited - Buy unlimited hearts for a duration
exports.buyUnlimitedHearts = async (req, res) => {
  try {
    const { durationDays = 1, gemsCost = 100 } = req.body;
    
    // TODO: Check if user has enough gems
    const hearts = await Hearts.getOrCreate(req.user._id);
    const result = await hearts.buyUnlimitedHearts(durationDays);
    
    res.json({
      message: `${durationDays} gün sınırsız can satın alındı!`,
      unlimitedUntil: result.unlimitedUntil
    });
  } catch (err) {
    console.error('Buy unlimited hearts error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/hearts/practice-restore - Restore heart by completing practice exercise
exports.practiceRestore = async (req, res) => {
  try {
    const hearts = await Hearts.getOrCreate(req.user._id);
    
    if (hearts.currentHearts >= hearts.maxHearts) {
      return res.status(400).json({ message: 'Canın zaten dolu!' });
    }
    
    // Award 1 heart for completing practice
    await hearts.addHearts(1, 'practice');
    
    res.json({
      message: 'Tebrikler! Pratik yaparak 1 can kazandın! 💚',
      currentHearts: hearts.currentHearts
    });
  } catch (err) {
    console.error('Practice restore error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/hearts/history - Get heart usage history
exports.getHeartHistory = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const hearts = await Hearts.findOne({ userId: req.user._id });
    
    if (!hearts) {
      return res.json({ history: [] });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const history = hearts.heartHistory
      .filter(h => h.date >= startDate)
      .sort((a, b) => b.date - a.date)
      .slice(0, 100);
    
    res.json({ history });
  } catch (err) {
    console.error('Get heart history error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
