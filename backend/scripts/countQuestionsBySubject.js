/*
  Count questions by subject and classLevel.
  Usage: node backend/scripts/countQuestionsBySubject.js
*/
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumathDB';
const Question = require('../models/Question');

async function run() {
  await mongoose.connect(MONGO_URI);
  try {
    const total = await Question.countDocuments({});
    console.log('Total questions:', total);
    const bySubject = await Question.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('By subject:', bySubject);
    const byClass = await Question.aggregate([
      { $group: { _id: '$classLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('By classLevel:', byClass);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
