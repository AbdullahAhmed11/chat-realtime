const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', index: true },
  type: { type: String, enum: ['join','leave','message','edit','delete'], required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true }
});

ActivitySchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
