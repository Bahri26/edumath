const mongoose = require('mongoose');

// Öğrenme olayları: xp kazanımı, ipucu kullanımı, yanlış türü, süre vb.
const LearningEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // 'xp' | 'hint' | 'attempt' | 'error' | 'session' | 'custom'
  subject: { type: String, default: '' },
  topic: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // dakika/sn gibi; UI karar verir
  errorType: { type: String, default: '' }, // hesaplama/kavram/okuma vb.
  meta: { type: Object, default: {} },
}, { timestamps: true, collection: 'learning_events' });

LearningEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LearningEvent', LearningEventSchema);
