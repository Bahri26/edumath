/**
 * Debug Test: Teacher Subject-based Question Filtering
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = 'change_this_secret';

// Test the JWT decoding
function testJWT() {
  console.log('🔐 JWT Token Testing\n');

  const tokens = {
    'Math Teacher': { id: 9, role: 'teacher', subject: 'Matematik' },
    'CS Teacher': { id: 4, role: 'teacher', subject: 'Computer Science' }
  };

  Object.entries(tokens).forEach(([name, payload]) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`${name}:`);
    console.log(`  Payload: ${JSON.stringify(payload)}`);
    console.log(`  Decoded: ${JSON.stringify(decoded)}`);
    console.log(`  Token: ${token}\n`);
  });
}

async function testAPI() {
  console.log('🌐 API Testing\n');

  try {
    // Test with explicit language parameter first
    console.log('═══════════════════════════════════════════════');
    console.log('Test 1: Explicit Language Filter (language=java)');
    console.log('═══════════════════════════════════════════════\n');

    const javaResponse = await axios.get(`${BASE_URL}/questions?limit=5&language=java`);
    console.log(`✅ Questions with language=java: ${javaResponse.data.data.length}`);
    if (javaResponse.data.data.length > 0) {
      console.log(`📊 Languages: ${javaResponse.data.data.map(q => q.language).join(', ')}`);
      console.log(`📌 Sample: ${javaResponse.data.data[0].topic}\n`);
    }

    // Test with no token
    console.log('═══════════════════════════════════════════════');
    console.log('Test 2: No Token (all questions)');
    console.log('═══════════════════════════════════════════════\n');

    const allResponse = await axios.get(`${BASE_URL}/questions?limit=10`);
    const allLanguages = [...new Set(allResponse.data.data.map(q => q.language))];
    console.log(`✅ All questions: ${allResponse.data.data.length}`);
    console.log(`📊 Languages: ${allLanguages.join(', ')}\n`);

    // Now test with token for CS teacher
    console.log('═══════════════════════════════════════════════');
    console.log('Test 3: CS Teacher with Token');
    console.log('═══════════════════════════════════════════════\n');

    const csPayload = { id: 4, role: 'teacher', subject: 'Computer Science' };
    const csToken = jwt.sign(csPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log(`Token payload: ${JSON.stringify(csPayload)}`);
    console.log(`Token: ${csToken}\n`);

    const csResponse = await axios.get(`${BASE_URL}/questions?limit=5`, {
      headers: { 'Authorization': `Bearer ${csToken}` }
    });

    console.log(`✅ CS teacher questions: ${csResponse.data.data.length}`);
    if (csResponse.data.data.length > 0) {
      console.log(`📊 Languages: ${csResponse.data.data.map(q => q.language).join(', ')}`);
      console.log(`📌 Sample: ${csResponse.data.data[0].topic}\n`);
    }

    // Test Math teacher 
    console.log('═══════════════════════════════════════════════');
    console.log('Test 4: Math Teacher with Token');
    console.log('═══════════════════════════════════════════════\n');

    const mathPayload = { id: 9, role: 'teacher', subject: 'Matematik' };
    const mathToken = jwt.sign(mathPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log(`Token payload: ${JSON.stringify(mathPayload)}`);

    const mathResponse = await axios.get(`${BASE_URL}/questions?limit=5`, {
      headers: { 'Authorization': `Bearer ${mathToken}` }
    });

    console.log(`✅ Math teacher questions: ${mathResponse.data.data.length}`);
    if (mathResponse.data.data.length > 0) {
      console.log(`📊 Languages: ${mathResponse.data.data.map(q => q.language).join(', ')}`);
      console.log(`📌 Sample: ${mathResponse.data.data[0].topic}\n`);
    }

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testJWT();
testAPI();
