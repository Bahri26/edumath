/**
 * Test Script: Teacher Subject-based Question Filtering
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = 'change_this_secret';

async function testFiltering() {
  try {
    console.log('🧪 Testing Subject-based Question Filtering\n');

    // Test 1: Math Teacher (emre@gmail.com)
    console.log('═══════════════════════════════════════════════');
    console.log('Test 1: Matematik Öğretmeni (emre@gmail.com)');
    console.log('═══════════════════════════════════════════════\n');

    const mathToken = jwt.sign(
      { id: 9, role: 'teacher', subject: 'Matematik' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const mathResponse = await axios.get(`${BASE_URL}/questions?limit=5`, {
      headers: { 'Authorization': `Bearer ${mathToken}` }
    });

    console.log(`✅ Math teacher questions: ${mathResponse.data.data.length} received`);
    if (mathResponse.data.data.length > 0) {
      console.log(`📊 Languages: ${mathResponse.data.data.map(q => q.language).join(', ')}`);
      console.log(`📌 Sample topic: ${mathResponse.data.data[0].topic}`);
    }

    // Test 2: Computer Science Teacher (bahri@gmail.com)
    console.log('\n═══════════════════════════════════════════════');
    console.log('Test 2: Bilgisayar Bilimleri Öğretmeni (bahri@gmail.com)');
    console.log('═══════════════════════════════════════════════\n');

    const csToken = jwt.sign(
      { id: 4, role: 'teacher', subject: 'Computer Science' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const csResponse = await axios.get(`${BASE_URL}/questions?limit=5`, {
      headers: { 'Authorization': `Bearer ${csToken}` }
    });

    console.log(`✅ CS teacher questions: ${csResponse.data.data.length} received`);
    if (csResponse.data.data.length > 0) {
      console.log(`📊 Languages: ${csResponse.data.data.map(q => q.language).join(', ')}`);
      console.log(`📌 Sample topic: ${csResponse.data.data[0].topic}`);
    }

    // Test 3: No Auth (all questions)
    console.log('\n═══════════════════════════════════════════════');
    console.log('Test 3: Yetkilendirme Yok (Tüm Sorular)');
    console.log('═══════════════════════════════════════════════\n');

    const noAuthResponse = await axios.get(`${BASE_URL}/questions?limit=5`);
    console.log(`✅ All questions: ${noAuthResponse.data.data.length} received`);
    if (noAuthResponse.data.data.length > 0) {
      const languages = [...new Set(noAuthResponse.data.data.map(q => q.language))];
      console.log(`📊 Languages: ${languages.join(', ')}`);
    }

    // Test 4: Exams filtering
    console.log('\n═══════════════════════════════════════════════');
    console.log('Test 4: Sınavlar - Matematik Öğretmeni');
    console.log('═══════════════════════════════════════════════\n');

    const examsResponse = await axios.get(`${BASE_URL}/exams?limit=5`, {
      headers: { 'Authorization': `Bearer ${mathToken}` }
    });

    console.log(`✅ Exams count: ${examsResponse.data.data ? examsResponse.data.data.length : examsResponse.data.rows?.length || 0}`);

    console.log('\n✨ Tests completed successfully!\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Test Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testFiltering();
