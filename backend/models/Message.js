const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String },
  type: { type: String, default: 'text' }, // text, file, system...
  createdAt: { type: Date, default: Date.now, index: true },
  edited: { type: Boolean, default: false }
});

MessageSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
