// backend-express/models/Result.js

const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    // --- TEMEL BAĞLANTILAR ---
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam', // Hangi sınava ait olduğu
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Hangi öğrenciye ait olduğu
        required: true
    },
    
    // --- CEVAP VE PUAN BİLGİLERİ ---
    score: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    wrongAnswers: {
        type: Number,
        default: 0
    },
    
    // Öğrencinin her bir soruya verdiği cevabı tutan dizi
    answers: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question',
                required: true
            },
            submittedAnswer: {
                type: String, // Öğrencinin seçtiği şıkkın metni
                default: null
            },
            isCorrect: {
                type: Boolean, // Cevabın doğru olup olmadığı
                default: false
            }
        }
    ],

    completionTime: {
        type: Number, // Sınavı tamamlama süresi (dakika veya saniye cinsinden)
        default: 0
    },
    
    // Geçme/Kalma Durumu
    passed: {
        type: Boolean,
        default: false
    }

}, { timestamps: true }); // Sınavın ne zaman başladığı ve bittiği için timestamps kullanılır

module.exports = mongoose.model('Result', ResultSchema);