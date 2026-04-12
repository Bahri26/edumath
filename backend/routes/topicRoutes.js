const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// Get all topics for a class/subject
router.get('/', async (req, res) => {
  const { classLevel, subject } = req.query;
  const filter = {};
  if (classLevel) filter.classLevel = classLevel;
  if (subject) filter.subject = subject;
  const topics = await Topic.find(filter).sort({ order: 1 }).populate('lessons');
  res.json(topics);
});

// Get a single topic with lessons
router.get('/:id', async (req, res) => {
  const topic = await Topic.findById(req.params.id).populate('lessons');
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  res.json(topic);
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

module.exports = router;
