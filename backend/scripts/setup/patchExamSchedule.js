/** Mevcut sınavlara startAt/endAt ekler. node scripts/setup/patchExamSchedule.js */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Exam = require('../../models/Exam');
const { syncExamStatusIfNeeded } = require('../../utils/examSchedule');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const now = new Date();
  const endAt = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
  if (endAt < now) endAt.setFullYear(now.getFullYear() + 1);

  const exams = await Exam.find({});
  for (const exam of exams) {
    if (!exam.startAt) exam.startAt = now;
    if (!exam.endAt) exam.endAt = endAt;
    await exam.save();
    await syncExamStatusIfNeeded(exam);
    console.log(exam.title, exam.status, exam.startAt?.toISOString?.()?.slice(0, 10), '→', exam.endAt?.toISOString?.()?.slice(0, 10));
  }
  await mongoose.disconnect();
})();
