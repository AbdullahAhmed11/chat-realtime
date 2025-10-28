const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, index: true }
});

ChannelSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Channel', ChannelSchema);
