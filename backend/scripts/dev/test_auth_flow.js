/**
 * Full Auth Flow Test
 */

const axios = require('axios');

const API = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔐 Full Authentication Flow Test\n');

    // Step 1: Login as teacher
    console.log('═══════════════════════════════════════════════');
    console.log('Step 1: Teacher Login');
    console.log('═══════════════════════════════════════════════\n');

    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'emre@gmail.com',
      password: 'test123'
    });

    const { user, token } = loginRes.data.data;
    console.log(`✅ Logged in as: ${user.full_name}`);
    console.log(`📌 User role: ${user.role}`);
    console.log(`📌 Subject: ${user.subject}`);
    console.log(`📝 Token (first 50 chars): ${token.substring(0, 50)}...\n`);

    // Step 2: Use token to get questions
    console.log('═══════════════════════════════════════════════');
    console.log('Step 2: Fetch Questions with Token');
    console.log('═══════════════════════════════════════════════\n');

    const questionsRes = await axios.get(`${API}/questions?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const questions = questionsRes.data.data;
    console.log(`✅ Questions received: ${questions.length}`);
    if (questions.length > 0) {
      const languages = [...new Set(questions.map(q => q.language))];
      console.log(`📊 Languages: ${languages.join(', ')}`);
      console.log(`📌 Topics: ${questions.map(q => q.topic).join(', ')}`);
    }

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
