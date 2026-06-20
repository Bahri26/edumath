require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Question = require('../../models/Question');

(async () => {
  console.log('STORAGE_PROVIDER', process.env.STORAGE_PROVIDER || 'local');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const all = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' });
  let emptyOpts = 0;
  let missingImg = 0;
  const uploadRoot = path.join(__dirname, '..', '..', 'uploads');
  for (const x of all) {
    const opts = (x.options || []).map((o) => String(o.text || '').trim());
    if (opts.filter(Boolean).length < 2) emptyOpts += 1;
    if (x.image && String(x.image).startsWith('/uploads/')) {
      const rel = x.image.replace(/^\/uploads\//, '');
      const p = path.join(uploadRoot, rel);
      if (!fs.existsSync(p)) missingImg += 1;
    }
  }
  console.log(JSON.stringify({ total: all.length, emptyOpts, missingImg, uploadRoot }, null, 2));
  await mongoose.disconnect();
})();
