/**
 * Öğrenci sınıf seviyelerini günceller.
 * node scripts/tools/updateStudentGrades.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const User = require('../../models/User');
const Student = require('../../models/Student');

const UPDATES = [
  { email: 'deniz@gmail.com', grade: '1. Sınıf', schoolType: 'ilkokul' },
  { email: 'mert@gmail.com', grade: '2. Sınıf', schoolType: 'ilkokul' },
  { email: 'deniz@hotmail.com', grade: '3. Sınıf', schoolType: 'ilkokul' },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'Edumath',
  });

  for (const item of UPDATES) {
    const emailLower = item.email.toLowerCase();
    const user = await User.findOne({ emailLower });
    if (!user) {
      console.log('NOT FOUND:', item.email);
      continue;
    }

    user.grade = item.grade;
    user.schoolType = item.schoolType;
    await user.save();

    const studentRes = await Student.updateMany(
      { userId: user._id },
      { $set: { grade: item.grade } },
    );
    console.log('OK', item.email, '->', item.grade, '| student records:', studentRes.modifiedCount);
  }

  const verify = await User.find({
    emailLower: { $in: UPDATES.map((u) => u.email.toLowerCase()) },
  }).select('name email grade schoolType role');

  console.log('\nVerify:');
  verify.forEach((u) => {
    console.log(' ', u.email, u.grade, u.schoolType, u.role);
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
