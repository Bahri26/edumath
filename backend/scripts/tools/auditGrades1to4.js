require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const Exam = require('../../models/Exam');

const GRADES = ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });

  const byClass = await Question.aggregate([
    { $group: { _id: '$classLevel', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('=== All questions by class ===');
  console.log(JSON.stringify(byClass, null, 2));

  const g14 = await Question.aggregate([
    { $match: { classLevel: { $in: GRADES } } },
    {
      $group: {
        _id: { classLevel: '$classLevel', topic: '$topic', packId: '$assessmentMeta.packId' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.classLevel': 1 } },
  ]);
  console.log('\n=== Grades 1-4 breakdown ===');
  console.log(JSON.stringify(g14, null, 2));

  const issues = [];
  const questions = await Question.find({ classLevel: { $in: GRADES } }).lean();
  for (const q of questions) {
    const opts = (q.options || []).map((o) => String(o.text || o).trim()).filter(Boolean);
    const correct = String(q.correctAnswer || '').trim();
    if (!correct) issues.push({ id: q._id, issue: 'missing correctAnswer', classLevel: q.classLevel });
    else if (!opts.includes(correct)) issues.push({ id: q._id, issue: 'correctAnswer not in options', classLevel: q.classLevel, correct, opts });
    if (opts.length < 3) issues.push({ id: q._id, issue: `only ${opts.length} options`, classLevel: q.classLevel });
    if (!q.solution) issues.push({ id: q._id, issue: 'missing solution', classLevel: q.classLevel });
  }
  console.log(`\n=== Validation issues (${issues.length}) ===`);
  console.log(JSON.stringify(issues.slice(0, 30), null, 2));
  if (issues.length > 30) console.log(`... and ${issues.length - 30} more`);

  const outsideQ = await Question.countDocuments({ classLevel: { $nin: GRADES } });
  const outsideE = await Exam.countDocuments({ classLevel: { $nin: GRADES } });
  console.log(`\nOutside 1-4: ${outsideQ} questions, ${outsideE} exams`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
