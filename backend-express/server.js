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
});