// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 1. DOTENV'i En Üstte ve Tam Yolla Tanımla
// __dirname: Şu anki klasör (backend)
dotenv.config({ path: path.join(__dirname, '.env') });

// DEBUG: Anahtar gelmiş mi kontrol et (Güvenlik için ilk 5 karakteri yazdırıyoruz)
console.log("🔑 Gemini Key Durumu:", process.env.GEMINI_API_KEY ? `Yüklendi (${process.env.GEMINI_API_KEY.substring(0, 5)}...)` : "❌ YÜKLENEMEDİ!");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- VERİTABANI BAĞLANTISI ---
const connectDB = async () => {
    try {
        const dbName = 'edumathDB'; 
        const mongoURI = process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
        
        const conn = await mongoose.connect(mongoURI);
        console.log(`✅ MongoDB Bağlandı: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Bağlantı Hatası: ${error.message}`);
        process.exit(1);
    }
};
connectDB();

// --- ROUTE IMPORTLARI (Bunlar dotenv yüklendikten SONRA gelmeli) ---
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Hata veren kısım buradaydı
const examRoutes = require('./routes/examRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
// ... diğer routeların ...

// --- ROTALARI AKTİF ET ---
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
// ... diğer app.use satırların ...

const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});