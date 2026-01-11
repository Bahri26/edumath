// Test script - Backend API'leri doğrudan test etmek için
const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

// Login token'ı buraya yapıştırın
const TEACHER_TOKEN = 'YOUR_TEACHER_TOKEN_HERE'; // Öğretmen olarak giriş yapıp token'ı buraya yapıştırın

const testAPIs = async () => {
  try {
    console.log('🧪 API Testleri Başlıyor...\n');

    // Test 1: Teacher Stats
    console.log('1️⃣ Teacher Stats Test:');
    try {
      const statsRes = await axios.get(`${API_BASE}/teacher/stats`, {
        headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
      });
      console.log('✅ Başarılı!');
      console.log('  Toplam Öğrenci:', statsRes.data.totalStudents);
      console.log('  Toplam Sorular:', statsRes.data.totalQuestions);
      console.log('  Toplam Anketler:', statsRes.data.totalSurveys);
      console.log('  Sınıf Ortalaması:', statsRes.data.classAverage);
    } catch (err) {
      console.log('❌ Hata:', err.response?.data?.message || err.message);
    }

    console.log('\n2️⃣ Teacher Surveys Test:');
    try {
      const surveysRes = await axios.get(`${API_BASE}/surveys/teacher/my-surveys`, {
        headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
      });
      console.log('✅ Başarılı!');
      console.log('  Toplam Anket:', surveysRes.data.total || surveysRes.data.surveys?.length || 0);
      if (surveysRes.data.surveys?.length > 0) {
        surveysRes.data.surveys.slice(0, 3).forEach((s, i) => {
          console.log(`  ${i+1}. ${s.title} (${s.responseCount || 0} cevap)`);
        });
      }
    } catch (err) {
      console.log('❌ Hata:', err.response?.status, err.response?.data?.message || err.message);
    }

    console.log('\n💡 Not: Token yoksa önce giriş yapıp browser console\'dan token\'ı kopyalayın:');
    console.log('   localStorage.getItem("token")');

  } catch (error) {
    console.error('❌ Genel Hata:', error.message);
  }
};

// Eğer token yoksa önce login gerekiyor
if (TEACHER_TOKEN === 'YOUR_TEACHER_TOKEN_HERE') {
  console.log('⚠️  Önce öğretmen olarak giriş yapıp token\'ı buraya yapıştırın!');
  console.log('Browser console\'da: localStorage.getItem("token")');
  console.log('\nArdından bu dosyayı düzenleyip tekrar çalıştırın.\n');
} else {
  testAPIs();
}
