const mongoose = require('mongoose');

const ExamResultShareSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'exam_result_shares' },
);

ExamResultShareSchema.index({ examId: 1, studentId: 1 });

module.exports = mongoose.model('ExamResultShare', ExamResultShareSchema);
