const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../models/User');
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });

  try {
    const users = await User.find({
      email: {
        $in: [
          process.env.SEED_ADMIN_EMAIL,
          process.env.SEED_TEACHER_EMAIL,
          process.env.SEED_STUDENT_EMAIL,
        ],
      },
    })
      .select('email role mustChangePassword branch grade')
      .sort({ role: 1 })
      .lean();

    const topics = await Topic.countDocuments({ name: 'Örüntüler', subject: 'Matematik' });
    const totalTopics = await Topic.countDocuments({ subject: 'Matematik' });
    const lessons = await Lesson.countDocuments({});
    const patternQuestionCount = await Question.countDocuments({ topic: 'Örüntüler', subject: 'Matematik' });
    const mebTaggedQuestionCount = await Question.countDocuments({
      topic: 'Örüntüler',
      subject: 'Matematik',
      learningOutcome: { $ne: '' },
      mebReference: { $ne: '' },
    });
    const examCount = await Exam.countDocuments({ topic: 'Örüntüler', subject: 'Matematik' });
    const distribution = await Question.aggregate([
      { $match: { topic: 'Örüntüler', subject: 'Matematik' } },
      { $group: { _id: { classLevel: '$classLevel', difficulty: '$difficulty' }, count: { $sum: 1 } } },
      { $sort: { '_id.classLevel': 1, '_id.difficulty': 1 } },
    ]);

    console.log(JSON.stringify({ db: dbName, users, patternTopicCount: topics, totalTopics, lessons, patternQuestionCount, mebTaggedQuestionCount, examCount, distribution }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});