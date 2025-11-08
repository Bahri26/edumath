// controllers/analyticsController.js
const Analytics = require('../models/analytics/Analytics');
const LearningPath = require('../models/analytics/LearningPath');
const User = require('../models/User');

// Öğrenme yolu önerisi oluşturma
const generateLearningPath = async (student, currentPerformance) => {
  const weakTopics = currentPerformance.filter(topic => topic.score < 0.7);
  const recommendedTopics = weakTopics.map(topic => ({
    topic: topic.name,
    priority: (1 - topic.score) * 10,
    reason: `Bu konudaki başarı oranınız ${Math.round(topic.score * 100)}%`
  }));
  
  return recommendedTopics;
};

// Öğrenme analitiklerini hesaplama
const calculateAnalytics = async (studentId, classId, type, data) => {
  const analytics = await Analytics.create({
    student: studentId,
    class: classId,
    type,
    metrics: {
      timeSpent: data.timeSpent,
      attemptsCount: data.attempts,
      correctAnswers: data.correct,
      incorrectAnswers: data.incorrect,
      accuracy: data.correct / (data.correct + data.incorrect)
    },
    topicPerformance: data.topics.map(topic => ({
      topic: topic.name,
      score: topic.score,
      timeSpent: topic.timeSpent
    }))
  });
  
  return analytics;
};

// Controller fonksiyonları
const getStudentAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.find({ 
      student: req.user._id,
      createdAt: { 
        $gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    }).sort('-createdAt');
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLearningPath = async (req, res) => {
  try {
    let learningPath = await LearningPath.findOne({ student: req.user._id });
    
    if (!learningPath) {
      // Yeni öğrenme yolu oluştur
      const analytics = await Analytics.find({ student: req.user._id })
        .sort('-createdAt')
        .limit(10);
        
      const recommendedTopics = await generateLearningPath(req.user, analytics);
      
      learningPath = await LearningPath.create({
        student: req.user._id,
        recommendedTopics,
        adaptiveLearning: {
          preferredLearningStyle: 'visual',
          difficultyLevel: 'medium',
          pacePreference: 'moderate'
        }
      });
    }
    
    res.json(learningPath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAnalytics = async (req, res) => {
  try {
    const { classId, type, data } = req.body;
    
    const analytics = await calculateAnalytics(req.user._id, classId, type, data);
    
    // Öğrenme yolunu güncelle
    const learningPath = await LearningPath.findOne({ student: req.user._id });
    if (learningPath) {
      const recommendedTopics = await generateLearningPath(req.user, [data]);
      learningPath.recommendedTopics = recommendedTopics;
      await learningPath.save();
    }
    
    res.json({ analytics, learningPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentAnalytics,
  getLearningPath,
  updateAnalytics
};