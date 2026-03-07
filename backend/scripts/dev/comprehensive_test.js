/**
 * Comprehensive Filtering Test
 * Tests both Questions and Exams filtering by teacher subject
 */

const axios = require('axios');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');

const API = 'http://localhost:3000/api';

async function setupTeachers() {
  console.log('⚙️ Setting up teacher passwords...\n');
  
  const teachers = [
    { email: 'emre@gmail.com', name: 'Emre (Math)', password: 'test123', subject: 'Matematik' },
    { email: 'bahri@gmail.com', name: 'Bahri (CS)', password: 'test123', subject: 'Computer Science' },
    { email: 'bahadir26@hotmail.com', name: 'Bahadır (Math)', password: 'test123', subject: 'Matematik' }
  ];

  for (const teacher of teachers) {
    const hash = await bcrypt.hash(teacher.password, 10);
    await knex('users').where('email', teacher.email).update({ password_hash: hash });
  }
  
  console.log('✅ Teacher passwords set\n');
}

async function testTeacher(email, expectedSubject, expectedLanguage) {
  console.log(`═══════════════════════════════════════════════`);
  console.log(`Testing: ${email}`);
  console.log(`Expected: subject=${expectedSubject}, language=${expectedLanguage}`);
  console.log(`═══════════════════════════════════════════════\n`);

  try {
    // Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email,
      password: 'test123'
    });

    const { token, user } = loginRes.data.data;
    console.log(`✅ Logged in: ${user.full_name}`);
    console.log(`   Subject: ${user.subject}\n`);

    // Test Questions
    const questionsRes = await axios.get(`${API}/questions?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const questions = questionsRes.data.data;
    const uniqueLangs = [...new Set(questions.map(q => q.language))];
    console.log(`📚 Questions: ${questions.length} received`);
    console.log(`   Languages: ${uniqueLangs.join(', ')}`);

    if (expectedLanguage) {
      const hasExpected = uniqueLangs.includes(expectedLanguage);
      console.log(`   ${hasExpected ? '✅' : '❌'} Contains ${expectedLanguage}`);
    }
    console.log();

    // Test Exams
    const examsRes = await axios.get(`${API}/exams?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const exams = examsRes.data.rows || examsRes.data.data || [];
    const examSubjects = [...new Set(exams.map(e => e.subject).filter(s => s))];
    console.log(`📝 Exams: ${exams.length} received`);
    if (examSubjects.length > 0) {
      console.log(`   Subjects: ${examSubjects.join(', ')}`);
    } else {
      console.log(`   (No exams with subject filter)`);
    }
    console.log();

  } catch (err) {
    console.error(`❌ Error:`, err.response?.data?.error || err.message);
    console.log();
  }
}

async function main() {
  try {
    console.log('\n🧪 COMPREHENSIVE FILTERING TEST\n');

    await setupTeachers();

    // Test Math Teachers
    await testTeacher('emre@gmail.com', 'Matematik', 'math');
    await testTeacher('bahadir26@hotmail.com', 'Matematik', 'math');

    // Test CS Teacher
    await testTeacher('bahri@gmail.com', 'Computer Science', 'java');

    console.log('═══════════════════════════════════════════════');
    console.log('✨ Test Complete!');
    console.log('═══════════════════════════════════════════════\n');

    process.exit(0);

  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();
