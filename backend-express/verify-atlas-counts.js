const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const names = [
      'users','classes','exams','questions','results','assignments','leaderboards','surveys','videoresources'
    ];
    const out = {};
    for (const name of names) {
      try {
        const count = await db.collection(name).countDocuments();
        out[name] = count;
      } catch {
        out[name] = 'n/a';
      }
    }
    console.log('Collection counts:', out);
  } catch (err) {
    console.error('Verify failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
