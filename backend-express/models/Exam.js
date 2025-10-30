// backend-express/models/Exam.js

const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Sınav başlığı zorunludur.'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    questions: [ // Sınavdaki soruların listesi
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question', // Question modeline referans
            required: true
        }
    ],
    duration: { // Sınav süresi (dakika cinsinden)
        type: Number,
        required: [true, 'Sınav süresi zorunludur.'],
        min: 1
    },
    category: { // Sınavın konusu
        type: String,
        required: [true, 'Sınav kategorisi zorunludur.']
    },
    passMark: { // Geçme notu yüzdesi (örn: 60)
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    creator: { // Sınavı oluşturan kullanıcı
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    associatedClass: { // Sınavın ilişkilendirildiği sınıf (isteğe bağlı)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exam', ExamSchema);