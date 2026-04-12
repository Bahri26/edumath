/*
  Normalize question subjects for discipline-based access.
  - Sets subject to 'Matematik' when subject is missing or empty.
  - Optionally map known variants to canonical names.
  Usage: node backend/scripts/normalizeQuestionSubjects.js [--default Matematik]
*/
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const minimist = require('minimist');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumathDB';
const Question = require('../models/Question');

const VARIANTS = {
  Matematik: [/^mat(emat(ik)?)?$/i],
  Fizik: [/^fizik$/i],
  Kimya: [/^kimya$/i],
  Biyoloji: [/^biyoloji$/i],
  Türkçe: [/^t(ü|u)rk(çe)?$/i]
};

async function run() {
  const args = minimist(process.argv.slice(2));
  const def = args.default || 'Matematik';
  await mongoose.connect(MONGO_URI);
  try {
    const all = await Question.find({});
    let updated = 0;
    for (const q of all) {
      let subj = (q.subject || '').trim();
      if (!subj) {
        q.subject = def;
        await q.save();
        updated++;
        continue;
      }
      // Map variants to canonical
      const canonical = Object.keys(VARIANTS).find(key => VARIANTS[key].some(r => r.test(subj)));
      if (canonical && canonical !== subj) {
        q.subject = canonical;
        await q.save();
        updated++;
      }
    }
    console.log(`Normalized ${updated} questions. Default used: ${def}`);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
