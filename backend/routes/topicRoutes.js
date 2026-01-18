const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');

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

module.exports = router;
