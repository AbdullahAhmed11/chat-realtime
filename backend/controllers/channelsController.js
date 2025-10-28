const Channel = require('../models/Channel');
const User = require('../models/User');
const xss = require('xss');

async function createChannel(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const cleanName = xss(name.trim());
    const exists = await Channel.findOne({ name: cleanName });
    if (exists) return res.status(409).json({ message: 'Channel already exists' });

    const channel = await Channel.create({ name: cleanName, description: xss(description || ''), createdBy: req.user._id, members: [req.user._id] });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { channels: channel._id } });

    res.status(201).json(channel);
  } catch (err) {
    console.error('create channel err', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listChannels(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };

    const [channels, total] = await Promise.all([
      Channel.find(filter).sort({ lastMessageAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Channel.countDocuments(filter)
    ]);

    res.json({ channels, page, limit, total });
  } catch (err) {
    console.error('list channels err', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getChannel(req, res) {
  try {
    const id = req.params.id;
    const channel = await Channel.findById(id).populate('members', 'name email').lean();
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
  } catch (err) {
    console.error('get channel err', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createChannel, listChannels, getChannel };


