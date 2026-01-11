#!/usr/bin/env node
/**
 * Backfill `createdBy` for existing Exam documents.
 * Usage:
 *   node backend/scripts/backfillExamCreatedBy.js --teacher-email=teacher@example.com
 *   TEACHER_EMAIL=teacher@example.com node backend/scripts/backfillExamCreatedBy.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Exam = require('../models/Exam');
const User = require('../models/User');

async function main() {
  try {
    // Fallback to local if MONGO_URI missing
    if (!process.env.MONGO_URI) {
      process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/edumath';
      console.log('MONGO_URI not set. Using fallback:', process.env.MONGO_URI);
    }

    await connectDB();

    // Parse teacher email from args or env
    const arg = process.argv.find(a => a.startsWith('--teacher-email='));
    const teacherEmail = process.env.TEACHER_EMAIL || (arg ? arg.split('=')[1] : null);

    if (!teacherEmail) {
      console.error('Missing teacher email. Provide with --teacher-email or TEACHER_EMAIL env.');
      process.exit(1);
    }

    const teacher = await User.findOne({ email: teacherEmail, role: 'teacher' });
    if (!teacher) {
      console.error('Teacher not found with email:', teacherEmail);
      process.exit(1);
    }

    // Filter exams missing createdBy
    const filter = {
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null },
      ],
    };

    const countMissing = await Exam.countDocuments(filter);
    console.log(`Exams missing createdBy: ${countMissing}`);

    if (countMissing === 0) {
      console.log('No exams to backfill. Exiting.');
      process.exit(0);
    }

    const res = await Exam.updateMany(filter, { $set: { createdBy: teacher._id } });
    console.log(`Backfilled exams: matched=${res.matchedCount || res.n}, modified=${res.modifiedCount || res.nModified}`);

    // Verify a sample
    const sample = await Exam.findOne({ createdBy: teacher._id }).lean();
    if (sample) {
      console.log('Sample exam after backfill:', { id: sample._id, title: sample.title, classLevel: sample.classLevel });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err.message);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  }
}

main();
