// backend-express/server.js (GÜNCEL VE TAM HALİ)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
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
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// --- 2. CRITICAL BÖLÜM: MİDDLEWARE'LER ---
// Bu sıralama önemlidir. Middleware'ler, rotalardan önce gelmelidir.

// Security headers (Helmet) - CORS'tan önce
app.use(helmet());

// CORS (Cross-Origin Resource Sharing) - whitelist ile sınırla
const defaultAllowed = [
  'http://localhost:5173',
  'http://localhost:3000'
];
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowed;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy tarafından engellendi'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Gelen JSON verisini işleyen middleware
// Bu, 'req.body'nin 'undefined' gelmesini engeller
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// NoSQL injection koruması
app.use(mongoSanitize());

// Rate Limiting - genel ve auth özel limitler
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.'
  }
});

const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.'
  }
});

// Rotalardan önce uygula
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
// v1 için de limitler
app.use('/api/v1/', apiLimiter);
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth/register', loginLimiter);

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
app.use('/api/upload', uploadRoutes);

// API Versioning - v1 (geriye uyumluluk için mevcut /api yolları korunuyor)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/learning-paths', learningPathRoutes);
app.use('/api/v1/challenges', dailyChallengeRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/surveys', surveyRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/streak', streakRoutes);
app.use('/api/v1/streak-advanced', require('./routes/streakAdvancedRoutes'));
app.use('/api/v1/hearts', heartsRoutes);
app.use('/api/v1/interactive-exercises', interactiveExerciseRoutes);
app.use('/api/v1/achievements', require('./routes/achievementRoutes'));
app.use('/api/v1/student-analytics', require('./routes/studentAnalyticsRoutes'));
app.use('/api/v1/social', require('./routes/socialRoutes'));
app.use('/api/v1/adaptive-difficulty', require('./routes/adaptiveDifficultyRoutes'));
app.use('/api/v1/videos', require('./routes/videoRoutes'));
app.use('/api/v1/upload', uploadRoutes);

// Production ortamında HTTPS'i zorunlu tut (proxy arkasında çalışıyorsa)
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }
    return res.redirect('https://' + req.headers.host + req.url);
  });
}

// Sağlık ve echo debug endpoint'leri
app.get('/api/health', (req,res)=>{
  res.json({ status:'ok', time:new Date().toISOString() });
});
app.get('/api/debug/echo', (req,res)=>{
  res.json({ method:req.method, headers:req.headers, query:req.query, path:req.path });
});

// --- 4. MongoDB Bağlantısı (Atlas Optimized) ---
const { logger } = require('./utils/logger');
const MONGO_URI = process.env.MONGO_URI;

const mongooseOpts = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

mongoose.connect(MONGO_URI, mongooseOpts)
  .then(() => logger.info('MongoDB (Atlas) bağlantısı başarılı.'))
  .catch(err => logger.error('MongoDB bağlantı hatası', { error: err.message, stack: err.stack }));

// --- 5. Sunucuyu Başlatma ---
app.get('/', (req, res) => {
  res.send('Edu-Platform Express sunucusu çalışıyor.');
});

// Error handler middleware (tüm route'lardan sonra)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

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