// backend-express/server.js (GÜNCEL VE TAM HALİ)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- 1. Rota (Route) Dosyalarını Import Etme ---
const authRoutes = require('./routes/authRoutes');     // Kullanıcı giriş/kayıt
const questionRoutes = require('./routes/questionRoutes'); // Soru havuzu CRUD
const classRoutes = require('./routes/classRoutes');      // Sınıf (Şube) CRUD
const examRoutes = require('./routes/examRoutes'); // Sınav CRUD 
const resultRoutes = require('./routes/resultRoutes'); // Sınav sonuç
const assignmentRoutes = require('./routes/assignmentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const learningPathRoutes = require('./routes/learningPathRoutes');
const dailyChallengeRoutes = require('./routes/dailyChallengeRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const streakRoutes = require('./routes/streakRoutes');
const heartsRoutes = require('./routes/heartsRoutes');
const interactiveExerciseRoutes = require('./routes/interactiveExerciseRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// --- 2. CRITICAL BÖLÜM: MİDDLEWARE'LER ---
// Bu sıralama önemlidir. Middleware'ler, rotalardan önce gelmelidir.

// CORS (Cross-Origin Resource Sharing)
// Frontend'in (localhost:5173) backend'e (localhost:8000) istek atmasına izin verir
app.use(cors()); 

// Gelen JSON verisini işleyen middleware
// Bu, 'req.body'nin 'undefined' gelmesini engeller
app.use(express.json()); 

// --- 3. Rota (Route) Tanımlamaları ---
// Gelen isteğin yoluna göre ilgili rota dosyasına yönlendirme

// Debug middleware - tüm gelen istekleri logla
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);       // /api/auth ile başlayanlar için
app.use('/api/questions', questionRoutes); // /api/questions ile başlayanlar için
app.use('/api/classes', classRoutes);      // /api/classes ile başlayanlar için
app.use('/api/exams', examRoutes); // /api/exams ile başlayanlar için
app.use('/api/results', resultRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/challenges', dailyChallengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/streak-advanced', require('./routes/streakAdvancedRoutes'));
app.use('/api/hearts', heartsRoutes);
app.use('/api/interactive-exercises', interactiveExerciseRoutes);
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/student-analytics', require('./routes/studentAnalyticsRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/adaptive-difficulty', require('./routes/adaptiveDifficultyRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));

// Sağlık ve echo debug endpoint'leri
app.get('/api/health', (req,res)=>{
  res.json({ status:'ok', time:new Date().toISOString() });
});
app.get('/api/debug/echo', (req,res)=>{
  res.json({ method:req.method, headers:req.headers, query:req.query, path:req.path });
});

// --- 4. MongoDB Bağlantısı ---
//const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edumathDB';
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı.'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// --- 5. Sunucuyu Başlatma ---
app.get('/', (req, res) => {
  res.send('Edu-Platform Express sunucusu çalışıyor.');
});

app.listen(PORT, () => {
  console.log(`Express sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
  // Kayıtlı route listesini yazdır
  const list = [];
  try {
    app._router.stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods).join(',');
        list.push(`${methods.toUpperCase()} ${layer.route.path}`);
      } else if (layer.name === 'router') {
        const stack = (layer.handle && layer.handle.stack) ? layer.handle.stack : [];
        stack.forEach(r => {
          if (r.route) {
            const methods = Object.keys(r.route.methods).join(',');
            const base = layer.regexp && layer.regexp.source ? layer.regexp.source : '';
            list.push(`${methods.toUpperCase()} ${base} :: ${r.route.path}`);
          }
        });
      }
    });
  } catch (e) {
    console.warn('Route list print failed:', e.message);
  }
  console.log('--- REGISTERED ROUTES ---');
  list.forEach(r => console.log(r));
  console.log('--------------------------');
});