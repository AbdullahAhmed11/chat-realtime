const Message = require('../models/Message');
const Activity = require('../models/Activity');
const Channel = require('../models/Channel');
const xss = require('xss');

// Config constants
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// Utilities
const sanitizeText = (value = '') => xss(value.toString().trim());
const handleError = (res, error, label) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ message: 'Server error' });
};

// 🎯 Get messages from a channel (with pagination & date filter)
async function getMessages(req, res) {
  try {
    const { id: channelId } = req.params;
    const limit = Math.min(MAX_LIMIT, Number(req.query.limit) || DEFAULT_LIMIT);
    const before = req.query.before;

    const query = { channel: channelId };

    // Optional "before" filter for pagination (load older messages)
    if (before) {
      const date = new Date(before);
      if (!isNaN(date)) query.createdAt = { $lt: date };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name')
      .lean();

    // Return messages in chronological order (ascending)
    return res.json({
      count: messages.length,
      messages: messages.reverse(),
    });
  } catch (error) {
    handleError(res, error, 'Get messages');
  }
}

// 🎯 Post a new message to a channel
async function postMessage(req, res) {
  try {
    const { id: channelId } = req.params;
    const content = sanitizeText(req.body.content);
    const type = req.body.type || 'text';

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.create({
      channel: channelId,
      sender: req.user._id,
      content,
      type,
    });

    // Update channel's last activity timestamp
    await Channel.findByIdAndUpdate(channelId, {
      lastMessageAt: message.createdAt,
    });

    // Log user activity for analytics
    await Activity.create({
      user: req.user._id,
      channel: channelId,
      type: 'message',
      payload: {
        messageId: message._id,
        snippet: content.slice(0, 200),
      },
    });

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    handleError(res, error, 'Post message');
  }
}

module.exports = { getMessages, postMessage };
