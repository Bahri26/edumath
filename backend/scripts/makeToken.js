const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumathDB';
const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_123';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ email: 'teacher@edumath.local' });
    if (!user) {
      console.error('Teacher user not found. Run seed script first.');
      process.exit(1);
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log(token);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
})();
