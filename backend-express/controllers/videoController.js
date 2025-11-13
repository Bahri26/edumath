// backend-express/controllers/videoController.js
const VideoResource = require('../models/VideoResource');

// GET /api/videos - List videos with filters
const listVideos = async (req, res) => {
  try {
    const { topic, difficulty, classLevel, page = 1, limit = 20 } = req.query;
    
    const filter = { isActive: true };
    
    if (topic) filter.topic = topic;
    
    if (difficulty && difficulty !== 'Tümü') {
      filter.$or = [
        { difficulty },
        { difficulty: 'Tümü' }
      ];
    }
    
    if (classLevel && classLevel !== 'Tümü') {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { classLevel },
        { classLevel: 'Tümü' }
      );
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const videos = await VideoResource.find(filter)
      .sort({ viewCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await VideoResource.countDocuments(filter);
    
    res.json({
      videos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List videos error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/videos/:id - Get single video
const getVideo = async (req, res) => {
  try {
    const video = await VideoResource.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı.' });
    }
    
    res.json({ video });
  } catch (err) {
    console.error('Get video error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/videos/:id/view - Increment view count
const incrementView = async (req, res) => {
  try {
    const video = await VideoResource.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı.' });
    }
    
    await video.incrementViews();
    
    res.json({ viewCount: video.viewCount });
  } catch (err) {
    console.error('Increment view error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/videos/popular - Get popular videos
const getPopularVideos = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const videos = await VideoResource.getPopularVideos(parseInt(limit));
    
    res.json({ videos });
  } catch (err) {
    console.error('Get popular videos error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/videos/topic/:topic - Get videos by topic
const getVideosByTopic = async (req, res) => {
  try {
    const { topic } = req.params;
    const { difficulty, classLevel, limit = 20 } = req.query;
    
    const videos = await VideoResource.getByTopic(topic, {
      difficulty,
      classLevel,
      limit: parseInt(limit)
    });
    
    res.json({ videos, topic });
  } catch (err) {
    console.error('Get videos by topic error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/videos - Create video (Admin/Teacher only)
const createVideo = async (req, res) => {
  try {
    const {
      title,
      description,
      youtubeId,
      topic,
      difficulty,
      classLevel,
      duration,
      tags
    } = req.body;
    
    // Extract thumbnail from YouTube
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    
    const video = await VideoResource.create({
      title,
      description,
      youtubeId,
      topic,
      difficulty: difficulty || 'Tümü',
      classLevel: classLevel || 'Tümü',
      duration,
      thumbnailUrl,
      tags: tags || [],
      createdBy: req.user._id
    });
    
    res.status(201).json({ message: 'Video eklendi!', video });
  } catch (err) {
    console.error('Create video error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PUT /api/videos/:id - Update video (Admin/Teacher only)
const updateVideo = async (req, res) => {
  try {
    const video = await VideoResource.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı.' });
    }
    
    const allowedUpdates = [
      'title', 'description', 'topic', 'difficulty', 
      'classLevel', 'duration', 'tags', 'isActive'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        video[field] = req.body[field];
      }
    });
    
    video.lastUpdated = new Date();
    await video.save();
    
    res.json({ message: 'Video güncellendi!', video });
  } catch (err) {
    console.error('Update video error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/videos/:id - Delete video (Admin only)
const deleteVideo = async (req, res) => {
  try {
    const video = await VideoResource.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı.' });
    }
    
    // Soft delete
    video.isActive = false;
    await video.save();
    
    res.json({ message: 'Video silindi.' });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/videos/topics/list - Get unique topics
const getTopicsList = async (req, res) => {
  try {
    const topics = await VideoResource.distinct('topic', { isActive: true });
    res.json({ topics });
  } catch (err) {
    console.error('Get topics list error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  listVideos,
  getVideo,
  incrementView,
  getPopularVideos,
  getVideosByTopic,
  createVideo,
  updateVideo,
  deleteVideo,
  getTopicsList
};

