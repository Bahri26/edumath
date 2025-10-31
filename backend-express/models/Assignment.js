// backend-express/models/Assignment.js

const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam', // Hangi sınav atanıyor
        required: true
    },
    
    // Atamanın yapılacağı hedef (Sınıf veya Öğrenci)
    targetType: {
        type: String,
        enum: ['Class', 'Student'], // Sınıfa mı yoksa bireysel öğrenciye mi atama yapılıyor
        required: true
    },
    targetId: { // targetType'a göre Class veya User ID'si
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetType' // Dinamik referans: TargetType'a göre Class veya User modeline bakar
    },

    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Atamayı yapan öğretmen
        required: true
    },
    dueDate: {
        type: Date, // Sınavın son teslim tarihi
        required: true
    },
    
    isActive: { // Atamanın aktif olup olmadığı
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);