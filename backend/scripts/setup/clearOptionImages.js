/** Şık (option) görsellerini DB'den temizler — görsel yalnızca soru kökünde kalır. */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { deleteStoredAsset } = require('../../services/storageService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'Edumath',
  });

  const withImages = await Question.find({
    $or: [
      { 'options.image': { $exists: true, $nin: [null, ''] } },
      { 'options.imageKey': { $exists: true, $nin: [null, ''] } },
    ],
  }).select('options');

  let clearedOptions = 0;
  for (const question of withImages) {
    for (const option of question.options || []) {
      if (!option.image && !option.imageKey) continue;
      await deleteStoredAsset({
        key: option.imageKey,
        provider: option.imageProvider,
        url: option.image,
      });
      option.image = '';
      option.imageKey = '';
      option.imageProvider = '';
      clearedOptions += 1;
    }
    await question.save();
  }

  console.log(`Sorular: ${withImages.length}, temizlenen şık görseli: ${clearedOptions}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
