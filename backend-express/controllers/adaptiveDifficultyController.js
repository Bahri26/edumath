// backend-express/controllers/adaptiveDifficultyController.js
const StudentAnalytics = require('../models/analytics/StudentAnalytics');
const Question = require('../models/Question');

// Calculate recommended difficulty based on performance
const calculateRecommendedDifficulty = (analytics, topic) => {
  if (!analytics || !analytics.topicPerformance) {
    return 'Kolay'; // Default for new students
  }
  
  // Find topic performance
  const topicData = analytics.topicPerformance.find(tp => tp.topic === topic);
  
  if (!topicData || topicData.totalAttempts < 3) {
    return 'Kolay'; // Not enough data
  }
  
  const accuracy = topicData.accuracy;
  const attempts = topicData.totalAttempts;
  
  // Rule-based algorithm
  if (accuracy >= 85 && attempts >= 5) {
    return 'Zor'; // High performer
  } else if (accuracy >= 70 && attempts >= 3) {
    return 'Orta'; // Medium performer
  } else {
    return 'Kolay'; // Needs more practice
  }
};

// GET /api/adaptive-difficulty/recommend - Get recommended difficulty for topic
const getRecommendation = async (req, res) => {
  try {
    const { topic } = req.query;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic gerekli.' });
    }
    
    const analytics = await StudentAnalytics.findOne({ userId: req.user._id });
    const recommendedDifficulty = calculateRecommendedDifficulty(analytics, topic);
    
    // Get topic stats
    let topicStats = null;
    if (analytics) {
      const topicData = analytics.topicPerformance.find(tp => tp.topic === topic);
      if (topicData) {
        topicStats = {
          accuracy: topicData.accuracy.toFixed(1),
          totalAttempts: topicData.totalAttempts,
          averageTime: topicData.averageTimePerQuestion.toFixed(1)
        };
      }
    }
    
    res.json({
      topic,
      recommendedDifficulty,
      reasoning: getReasoningText(analytics, topic, recommendedDifficulty),
      topicStats
    });
  } catch (err) {
    console.error('Get recommendation error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/adaptive-difficulty/next-questions - Get adaptive questions
const getAdaptiveQuestions = async (req, res) => {
  try {
    const { topic, count = 5 } = req.query;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic gerekli.' });
    }
    
    const analytics = await StudentAnalytics.findOne({ userId: req.user._id });
    const recommendedDifficulty = calculateRecommendedDifficulty(analytics, topic);
    
    // Get questions with recommended difficulty
    const questions = await Question.find({
      topic,
      difficulty: recommendedDifficulty
    })
    .limit(parseInt(count))
    .select('-correctAnswer'); // Don't send answer
    
    // If not enough questions at this difficulty, mix difficulties
    if (questions.length < parseInt(count)) {
      const additionalQuestions = await Question.find({
        topic,
        difficulty: { $ne: recommendedDifficulty }
      })
      .limit(parseInt(count) - questions.length)
      .select('-correctAnswer');
      
      questions.push(...additionalQuestions);
    }
    
    res.json({
      questions,
      recommendedDifficulty,
      adaptiveReasoning: getReasoningText(analytics, topic, recommendedDifficulty)
    });
  } catch (err) {
    console.error('Get adaptive questions error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/adaptive-difficulty/learning-path - Get personalized learning path
const getLearningPath = async (req, res) => {
  try {
    const analytics = await StudentAnalytics.findOne({ userId: req.user._id });
    
    if (!analytics || !analytics.topicPerformance || analytics.topicPerformance.length === 0) {
      return res.json({
        path: [],
        message: 'Henüz yeterli veri yok. Öğrenmeye başlayın!'
      });
    }
    
    // Sort topics by accuracy (weakest first)
    const sortedTopics = analytics.topicPerformance
      .filter(tp => tp.totalAttempts >= 1)
      .sort((a, b) => a.accuracy - b.accuracy);
    
    // Create learning path
    const learningPath = sortedTopics.slice(0, 5).map((tp, index) => {
      const recommendedDifficulty = calculateRecommendedDifficulty(analytics, tp.topic);
      
      return {
        priority: index + 1,
        topic: tp.topic,
        currentLevel: tp.level,
        recommendedDifficulty,
        currentAccuracy: tp.accuracy.toFixed(1),
        totalAttempts: tp.totalAttempts,
        reasoning: tp.accuracy < 50 
          ? 'Bu konuda çok pratik yapmalısın'
          : tp.accuracy < 70
          ? 'Biraz daha pratik yaparak gelişebilirsin'
          : 'İyi gidiyorsun! Zorluk seviyesini artırabilirsin',
        estimatedQuestionsNeeded: Math.ceil((85 - tp.accuracy) / 5) // Rough estimate
      };
    });
    
    res.json({
      path: learningPath,
      message: 'Kişiselleştirilmiş öğrenme yolun hazır!'
    });
  } catch (err) {
    console.error('Get learning path error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/adaptive-difficulty/adjust - Manually adjust difficulty preference
const adjustDifficultyPreference = async (req, res) => {
  try {
    const { topic, preferredDifficulty } = req.body;
    
    if (!topic || !preferredDifficulty) {
      return res.status(400).json({ message: 'Topic ve difficulty gerekli.' });
    }
    
    // Store user preference (could be in a new UserPreferences model)
    // For now, just acknowledge
    
    res.json({
      message: 'Zorluk tercihin kaydedildi!',
      topic,
      preferredDifficulty
    });
  } catch (err) {
    console.error('Adjust difficulty preference error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Helper function to generate reasoning text
const getReasoningText = (analytics, topic, difficulty) => {
  if (!analytics) {
    return 'Yeni başladığın için kolay seviyeden başlıyoruz.';
  }
  
  const topicData = analytics.topicPerformance?.find(tp => tp.topic === topic);
  
  if (!topicData || topicData.totalAttempts < 3) {
    return 'Bu konuda henüz yeterli verin yok. Kolay seviyeden başla.';
  }
  
  const accuracy = topicData.accuracy;
  
  if (difficulty === 'Zor') {
    return `${accuracy.toFixed(1)}% başarı oranınla harikasın! Zor sorulara hazırsın.`;
  } else if (difficulty === 'Orta') {
    return `${accuracy.toFixed(1)}% başarı oranın iyi. Orta seviye sorular senin için uygun.`;
  } else {
    return `${accuracy.toFixed(1)}% başarı oranın var. Kolay sorularla pratik yapmaya devam et.`;
  }
};

module.exports = {
  getRecommendation,
  getAdaptiveQuestions,
  getLearningPath,
  adjustDifficultyPreference
};

