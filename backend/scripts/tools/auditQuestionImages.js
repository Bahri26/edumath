require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Question = require('../../models/Question');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const total = await Question.countDocuments();
  const withImage = await Question.countDocuments({ image: { $exists: true, $nin: ['', null] } });
  const local = await Question.countDocuments({ image: { $regex: '^/?uploads/' } });
  const cloud = await Question.countDocuments({ image: { $regex: '^https://' } });
  const distinct = await Question.distinct('image', { image: { $regex: '^/?uploads/' } });
  const samples = await Question.find({ image: { $regex: '^/?uploads/' } })
    .select('classLevel text image')
    .limit(15)
    .lean();
  console.log(JSON.stringify({ total, withImage, local, cloud, distinctCount: distinct.length, distinct, samples }, null, 2));
  await mongoose.disconnect();
})();
