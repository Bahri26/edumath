/*
  Approve a teacher's branch.
  Usage: node backend/scripts/approveBranch.js --email teacher@edumath.local --branch Matematik
*/
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const minimist = require('minimist');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumathDB';
const User = require('../models/User');

async function run() {
  const args = minimist(process.argv.slice(2));
  const email = args.email || args.e;
  const branch = args.branch || args.b || 'Matematik';
  if (!email) {
    console.error('Missing --email');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found:', email);
      return;
    }
    user.branch = branch;
    user.branchApproval = 'approved';
    await user.save();
    console.log('Approved branch for', email, '->', branch);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
