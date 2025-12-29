// backend/server.js (TÜM MODÜLLER DAHİL)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Resimler için Uploads klasörünü dışarı aç
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

// Test Route
app.get('/', (req, res) => {
    res.send('Backend Sunucusu Çalışıyor...');
});

const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});