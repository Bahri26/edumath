const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../models/User');
const Student = require('../models/Student');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  return { uri, dbName };
}

async function upsertUser(userData) {
  const { email, username, ...rest } = userData;
  const query = username ? { $or: [{ email }, { username }] } : { email };
  let user = await User.findOne(query);

  if (!user) {
    user = new User({ email, username, ...rest });
  } else {
    user.email = email;
    user.username = username;
    Object.assign(user, rest);
  }

  await user.save();
  return user;
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });

  try {
    const teacherAccounts = [
      {
        name: 'Bahadir Teacher',
        username: 'BahadirTeacher',
        email: 'bahadirteacher@edumath.local',
        password: '?/SsNPc5jlC_G4Zz',
        role: 'teacher',
        branch: 'Matematik',
        branchApproval: 'approved',
        status: 'active',
        emailVerified: true,
        mustChangePassword: false,
        language: 'TR',
      },
      {
        name: 'Bahadir 26',
        email: 'bahadir26@hotmail.com',
        password: '123aS456?',
        role: 'teacher',
        branch: 'Matematik',
        branchApproval: 'approved',
        status: 'active',
        emailVerified: true,
        mustChangePassword: false,
        language: 'TR',
      },
      {
        name: 'Emre',
        email: 'emre@gmail.com',
        password: '123aS456&',
        role: 'teacher',
        branch: 'Matematik',
        branchApproval: 'approved',
        status: 'active',
        emailVerified: true,
        mustChangePassword: false,
        language: 'TR',
      },
    ];

    const studentAccounts = [
      {
        name: 'Deniz',
        email: 'deniz@gmail.com',
        password: '123aS456#',
        role: 'student',
        grade: '5. Sınıf',
        schoolType: 'ortaokul',
        status: 'active',
        emailVerified: true,
        mustChangePassword: false,
        language: 'TR',
      },
      {
        name: 'Mert',
        email: 'mert@gmail.com',
        password: '123aS456$',
        role: 'student',
        grade: '6. Sınıf',
        schoolType: 'ortaokul',
        status: 'active',
        emailVerified: true,
        mustChangePassword: false,
        language: 'TR',
      },
      {
        name: 'Deniz Hotmail',
        email: 'deniz@hotmail.com',
        password: '123aS456!',
        role: 'student',
        grade: '9. Sınıf',
        schoolType: 'lise',
        status: 'active',
        emailVerified: true,
        mustChangePassword: false,
        language: 'TR',
      },
    ];

    const teachers = [];
    for (const account of teacherAccounts) {
      teachers.push(await upsertUser(account));
    }

    const students = [];
    for (let index = 0; index < studentAccounts.length; index += 1) {
      const account = studentAccounts[index];
      const studentUser = await upsertUser(account);
      students.push(studentUser);

      for (const teacher of teachers) {
        await Student.updateOne(
          { userId: studentUser._id, teacherId: teacher._id },
          {
            $set: {
              grade: account.grade,
              schoolNumber: String(2001 + index),
              averageScore: 0,
            },
          },
          { upsert: true }
        );
      }
    }

    console.log(JSON.stringify({
      db: dbName,
      teachers: teachers.map((user) => ({ username: user.username || null, email: user.email, role: user.role, status: user.status })),
      students: students.map((user) => ({ email: user.email, grade: user.grade, role: user.role, status: user.status })),
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});