const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

const populateLessonsSorted = {
  path: 'lessons',
  options: { sort: { order: 1, title: 1 } },
};

// Get all topics for a class/subject
router.get('/', async (req, res) => {
  try {
    const { classLevel, subject } = req.query;
    const filter = {};
    if (classLevel) filter.classLevel = classLevel;
    if (subject) filter.subject = subject;
    const topics = await Topic.find(filter).sort({ order: 1 }).populate(populateLessonsSorted);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Konular alınamadı', error: err.message });
  }
});

// Reorder topics (body: classLevel, subject, orderedTopicIds)
router.post('/reorder', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const { classLevel, subject, orderedTopicIds } = req.body;
    if (!classLevel || !subject || !Array.isArray(orderedTopicIds)) {
      return res.status(400).json({ message: 'classLevel, subject ve orderedTopicIds (dizi) zorunludur.' });
    }
    for (let i = 0; i < orderedTopicIds.length; i += 1) {
      await Topic.updateOne(
        { _id: orderedTopicIds[i], classLevel, subject },
        { $set: { order: i + 1 } }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Sıralama güncellenemedi', error: err.message });
  }
});

router.post('/', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const { name, classLevel, subject } = req.body;

    if (!name || !classLevel || !subject) {
      return res.status(400).json({ message: 'name, classLevel ve subject zorunludur.' });
    }

    const existing = await Topic.findOne({ name, classLevel, subject });
    if (existing) {
      return res.status(200).json(existing);
    }

    const order = await Topic.countDocuments({ classLevel, subject });
    const topic = await Topic.create({
      name,
      classLevel,
      subject,
      order: order + 1,
      lessons: [],
    });

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Konu oluşturulamadı', error: error.message });
  }
});

// Add lesson under topic (path must stay before generic /:id)
router.post('/:topicId/lessons', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'title zorunludur.' });
    }
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Konu bulunamadı.' });
    }
    const count = await Lesson.countDocuments({ topic: topicId });
    const lesson = await Lesson.create({
      title: String(title).trim(),
      topic: topicId,
      order: count + 1,
    });
    topic.lessons.push(lesson._id);
    await topic.save();
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: 'Ders eklenemedi', error: err.message });
  }
});

// Reorder lessons within a topic (body: orderedLessonIds)
router.patch('/:id/lesson-order', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Konu bulunamadı.' });
    }
    const { orderedLessonIds } = req.body;
    if (!Array.isArray(orderedLessonIds)) {
      return res.status(400).json({ message: 'orderedLessonIds (dizi) zorunludur.' });
    }
    const allowed = new Set(topic.lessons.map((id) => String(id)));
    for (const lid of orderedLessonIds) {
      if (!allowed.has(String(lid))) {
        return res.status(400).json({ message: 'Geçersiz ders kimliği.' });
      }
    }
    for (let i = 0; i < orderedLessonIds.length; i += 1) {
      await Lesson.updateOne(
        { _id: orderedLessonIds[i], topic: topic._id },
        { $set: { order: i + 1 } }
      );
    }
    topic.lessons = orderedLessonIds;
    await topic.save();
    const fresh = await Topic.findById(topic._id).populate(populateLessonsSorted);
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: 'Ders sırası güncellenemedi', error: err.message });
  }
});

router.patch('/:id', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Konu bulunamadı.' });
    }
    const { name, order } = req.body;
    if (name != null) topic.name = String(name).trim();
    if (order != null && Number.isFinite(Number(order))) topic.order = Number(order);
    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Konu güncellenemedi', error: err.message });
  }
});

router.delete('/:id', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('lessons');
    if (!topic) {
      return res.status(404).json({ message: 'Konu bulunamadı.' });
    }
    const lessonIds = (topic.lessons || []).map((l) => l._id || l);
    if (lessonIds.length) {
      await UserProgress.deleteMany({ lessonId: { $in: lessonIds } });
      await Lesson.deleteMany({ _id: { $in: lessonIds } });
    }
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Konu silinemedi', error: err.message });
  }
});

// Get a single topic with lessons
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate(populateLessonsSorted);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Konu alınamadı', error: err.message });
  }
});

module.exports = router;
