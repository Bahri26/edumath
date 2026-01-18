/*
  Check a user's auth status and optionally verify a password.
  Usage:
    node backend/scripts/checkUser.js --email user@example.com [--password plain]
*/
const mongoose = require('mongoose');
const minimist = require('minimist');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumathDB';
const User = require('../models/User');

async function main() {
  const args = minimist(process.argv.slice(2));
  const email = args.email || args.e;
  const password = args.password || args.p;
  if (!email) {
    console.error('Missing --email');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return;
    }
    const info = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      branch: user.branch,
      branchApproval: user.branchApproval,
      mustChangePassword: user.mustChangePassword,
      emailVerified: user.emailVerified,
      passwordHashPrefix: String(user.password || '').slice(0, 7),
      passwordHashRounds: (() => {
        try { return bcrypt.getRounds(user.password); } catch { return null; }
      })(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    console.log('User info:', info);
    if (password) {
      const match = await bcrypt.compare(password, user.password);
      console.log('Password matches:', match);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
