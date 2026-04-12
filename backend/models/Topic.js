const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classLevel: { type: String, required: true },
  subject: { type: String, required: true },
  order: { type: Number, default: 0 },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
}, { collection: 'topics' });

module.exports = mongoose.model('Topic', TopicSchema);
