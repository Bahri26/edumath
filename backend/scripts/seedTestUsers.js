/*
  Seed test users for development
  - Student: student@edumath.local / password123
  - Teacher: teacher@edumath.local / password123
*/
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

// Build Mongo URI similar to server.js to target Atlas if configured
const MONGO_URI = (() => {
  const envURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (envURI && envURI.trim()) return envURI.trim();
  const host = process.env.MONGO_HOST;
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const db = process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath';
  if (host && user && typeof pass === 'string') {
    const encUser = encodeURIComponent(user);
    const encPass = encodeURIComponent(pass);
    const protocol = process.env.MONGO_PROTOCOL || 'mongodb+srv';
    return `${protocol}://${encUser}:${encPass}@${host}/${db}?retryWrites=true&w=majority`;
  }
  return `mongodb://127.0.0.1:27017/${db}`;
})();

const MONGO_DB = process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath';

async function up() {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });

  const ensureUser = async (email, role, name, extra = {}) => {
    let u = await User.findOne({ email });
    if (u) {
      console.log(`Exists: ${email}`);
      return u;
    }
    u = new User({
      name,
      email,
      password: 'password123', // Hashleme pre-save ile yapılacak
      role,
      status: 'active',
      mustChangePassword: false,
      ...extra,
    });
    await u.save();
    console.log(`Created: ${email} (${role})`);
    return u;
  };

  await ensureUser('student@edumath.local', 'student', 'Test Student', { grade: '9. Sınıf' });
  await ensureUser('teacher@edumath.local', 'teacher', 'Test Teacher');
  await ensureUser('admin@edumath.local', 'admin', 'Test Admin');

  // Provided existing users with pre-hashed passwords
  const ensureHashedUser = async (email, role, name, hashedPassword, extra = {}) => {
    let u = await User.findOne({ email });
    if (u) {
      await User.updateOne({ _id: u._id }, { $set: { role, password: hashedPassword, status: 'active', mustChangePassword: false, ...extra } });
      console.log(`Updated: ${email} (${role})`);
      return u;
    }
    u = new User({ name, email, password: hashedPassword, role, status: 'active', mustChangePassword: false, ...extra });
    await u.save();
    console.log(`Created: ${email} (${role})`);
    return u;
  };

  // Examples from user
  await ensureHashedUser('bahadir26@hotmail.com', 'teacher', 'Bahadir Teacher', '$2b$10$pAPoOVB6xOuJT602euzViOfs78rW9Tn2IbEX6I5VbOIBO9NTQX45O');
  await ensureHashedUser('bahri@hotmail.com', 'admin', 'Bahri Admin', '$2b$10$9EvweAU0UsG63OtSgQ9dNeswTaQkGsv.jLd52RKhrunonJon/hy9m');

  console.log('\nLogin credentials:');
  console.log('  Student: student@edumath.local / password123');
  console.log('  Teacher: teacher@edumath.local / password123');
  console.log('  Admin:   admin@edumath.local / password123');
  console.log('  Teacher (hashed): bahadir26@hotmail.com / (use your original password)');
  console.log('  Admin (hashed):   bahri@hotmail.com / (use your original password)');
}

up().then(() => mongoose.disconnect()).catch((e) => {
  console.error(e);
  mongoose.disconnect();
  process.exit(1);
});
