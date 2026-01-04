const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  dueDate: { type: Date },
  duration: { type: Number, default: 60 }, // dakika
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Öğrenci teslimleri
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    content: { type: String }, // teslim edilen içerik
    grade: { type: Number }, // not
    feedback: { type: String }, // öğretmen geri bildirimi
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);