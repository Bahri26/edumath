// backend/server.js (TÜM MODÜLLER DAHİL)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

dotenv.config();

const User = require('./models/User');

const app = express();

const trustProxy = process.env.TRUST_PROXY;
if (typeof trustProxy === 'string' && trustProxy.trim() !== '') {
    const normalized = trustProxy.trim().toLowerCase();
    if (normalized === 'true') {
        app.set('trust proxy', true);
    } else if (normalized === 'false') {
        app.set('trust proxy', false);
    } else if (!Number.isNaN(Number(trustProxy))) {
        app.set('trust proxy', Number(trustProxy));
    } else {
        app.set('trust proxy', trustProxy);
    }
} else if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()),
    'http://localhost:5173',
].filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));

// Security headers (disable CORP to allow static files)
app.use(helmet({ crossOriginResourcePolicy: false }));
// Minimal CSP for API responses
app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
    },
}));

// Request logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Response compression
app.use(compression());

// Rate limiting
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15dk genel API
const maxReq = parseInt(process.env.RATE_LIMIT_MAX || '100');
const apiLimiter = rateLimit({ windowMs, max: maxReq, standardHeaders: true, legacyHeaders: false });

// Daha sıkı: Auth rotaları için özel limitler
const authWindowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'); // 15dk
const authMaxReq = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20');
const authLimiter = rateLimit({ windowMs: authWindowMs, max: authMaxReq, standardHeaders: true, legacyHeaders: false });

// Önce spesifik auth limiter'ı uygula, sonra genel API limiter'ı
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

app.use(express.json());

// Resimler için Uploads klasörünü dışarı aç
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- VERİTABANI BAĞLANTISI ---
let dbConnected = false;
let loginIdentifiersPrepared = false;
const defaultDbName = 'Edumath';
const configuredDbName = (process.env.MONGODB_DB || process.env.MONGO_DB || defaultDbName).trim();
// Allow building Atlas URI from components to avoid URL-encoding issues
const mongoURI = (() => {
    const envURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (envURI && envURI.trim()) return envURI.trim();
    const host = process.env.MONGO_HOST;
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS;
    const db = configuredDbName;
    if (host && user && typeof pass === 'string') {
        const encUser = encodeURIComponent(user);
        const encPass = encodeURIComponent(pass);
        const protocol = process.env.MONGO_PROTOCOL || 'mongodb+srv';
        return `${protocol}://${encUser}:${encPass}@${host}/${db}?retryWrites=true&w=majority`;
    }
    return `mongodb://127.0.0.1:27017/${configuredDbName}`;
})();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(mongoURI, {
            dbName: configuredDbName,
            serverSelectionTimeoutMS: 5000,
        });
        dbConnected = true;

        if (!loginIdentifiersPrepared) {
            try {
                const syncResult = await User.syncLoginIdentifiers();
                await User.createIndexes();
                loginIdentifiersPrepared = true;
                console.log(`✅ Login alanlari hazir: ${syncResult.modifiedCount} kayit guncellendi.`);
            } catch (indexError) {
                console.error(`⚠️ Login alanlari hazirlanamadi: ${indexError.message}`);
            }
        }

        const hostInfo = conn?.connection?.host || 'unknown';
        const activeDbName = conn?.connection?.name || configuredDbName;
        console.log(`✅ MongoDB Bağlandı: ${hostInfo} / DB: ${activeDbName}`);
    } catch (error) {
        dbConnected = false;
        console.error(`❌ Bağlantı Hatası: ${error.message}`);
        // Sunucuyu kapatma, tekrar dene
        const retryMs = 10000;
        console.log(`⏳ ${retryMs/1000}s sonra tekrar denenecek...`);
        setTimeout(connectDB, retryMs);
    }
};
connectDB();

mongoose.connection.on('disconnected', () => {
    dbConnected = false;
    loginIdentifiersPrepared = false;
    console.warn('⚠️ MongoDB bağlantısı koptu, yeniden bağlanılıyor...');
    setTimeout(connectDB, 5000);
});

// Hazırlık (readiness) kontrolü: DB off ise API isteklerine 503 döndür
app.use((req, res, next) => {
    const skipPaths = ['/', '/health', '/ready'];
    if (!dbConnected && req.path.startsWith('/api') && !skipPaths.includes(req.path)) {
        return res.status(503).json({ success: false, message: 'Servis hazır değil. Veritabanı bağlantısı yok.' });
    }
    next();
});

// --- ROTA DOSYALARINI IMPORT ET ---
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const examRoutes = require('./routes/examRoutes');
const userRoutes = require('./routes/userRoutes'); 
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const adminRoutes = require('./routes/adminRoutes');
const progressRoutes = require('./routes/progressRoutes');

// --- ROTALARI AKTİF ET ---
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);      // Öğrenci aramak için
app.use('/api/students', studentRoutes); // Listeyi kaydetmek için
app.use('/api/teacher', teacherRoutes); // Öğretmen istatistikleri
app.use('/api/chat', chatRoutes); // Chat AI için
app.use('/api/ai', aiRoutes); // AI özellikleri için
app.use('/api/notifications', notificationRoutes);
app.use('/api/exercises', exerciseRoutes); // Egzersizler
app.use('/api/assignments', assignmentRoutes); // Ödevler
app.use('/api/messages', messageRoutes); // Mesajlar (Chat)
app.use('/api/admin', adminRoutes); // Admin işlemleri
app.use('/api/progress', progressRoutes); // İlerleme ve trendler
    app.use('/api/topics', require('./routes/topicRoutes'));
    app.use('/api/lessons', require('./routes/lessonRoutes'));

// --- API Dokümantasyonu ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Test Route
app.get('/', (req, res) => {
    res.send('Backend Sunucusu Çalışıyor...');
});

// Sağlık kontrolü (Health Check)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        db: dbConnected ? 'up' : 'down',
        port: process.env.PORT || 8000,
        env: process.env.NODE_ENV || 'development',
    });
});

// Readiness endpoint (hazır mı?)
app.get('/ready', (req, res) => {
    res.json({
        status: dbConnected ? 'ready' : 'not-ready',
        db: dbConnected ? 'up' : 'down'
    });
});

const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});