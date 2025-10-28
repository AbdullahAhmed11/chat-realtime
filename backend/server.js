require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const xss = require('xss');

const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const { verifyTokenSocket } = require('./middleware/socketAuth');
const Channel = require('./models/Channel');
const Message = require('./models/Message');
const Activity = require('./models/Activity');
const User = require('./models/User');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

// Fail fast when DB is unreachable instead of buffering operations
mongoose.set('bufferCommands', false);
const server = http.createServer(app);

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
});
app.use(limiter);

// If DB is not connected yet, fail fast with 503 for API routes
app.use((req, res, next) => {
  // allow health endpoint even if DB is down
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database not connected' });
  }
  return next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/channels', messageRoutes); // message routes under /api/channels/:id/messages

// Basic health route
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

// Connect to Mongo with retry (do not exit the process on failure)
async function connectWithRetry(retryCount = 0) {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('MongoDB connected');
  } catch (err) {
    const cappedRetry = Math.min(retryCount, 5);
    const delayMs = Math.min(30000, 1000 * Math.pow(2, cappedRetry));
    console.error('Mongo connection error:', err && err.message ? err.message : err);
    console.log(`Retrying MongoDB connection in ${delayMs}ms (attempt ${retryCount + 1})`);
    setTimeout(() => connectWithRetry(retryCount + 1), delayMs);
  }
}

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not set. The app will run but database operations will fail until it is configured.');
} else {
  connectWithRetry();
}

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST']
  },
  // pingTimeout etc can be tuned for large-scale deployments
});

// For scaling across nodes: use socket.io-redis adapter (note in design section)
io.use(async (socket, next) => {
  try {
    // expect token in handshake auth: { token: "..." }
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload; // { id, email, name, iat, exp }
    return next();
  } catch (e) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  if (mongoose.connection.readyState !== 1) {
    socket.emit('error', { message: 'Database not connected' });
    return socket.disconnect(true);
  }
  console.log(`Socket connected: ${socket.id}, user: ${socket.user.id}`);

  // join rooms for channels the user is a member of (optional: load last N)
  const userId = socket.user.id;
  const user = await User.findById(userId).lean();
  if (user && user.channels && user.channels.length) {
    user.channels.forEach((chId) => socket.join(`channel_${chId.toString()}`));
  }

  // send welcome
  socket.emit('connected', { socketId: socket.id, user: socket.user });

  // joinChannel event (client requests to join a channel)
  socket.on('joinChannel', async ({ channelId }) => {
    try {
      channelId = xss(channelId);
      const channel = await Channel.findById(channelId);
      if (!channel) return socket.emit('error', { message: 'Channel not found' });

      // add user to channel.members if not present
      if (!channel.members.some(m => m.equals(userId))) {
        channel.members.push(userId);
        await channel.save();
      }

      // add to user's channel list (optional denormalization)
      await User.findByIdAndUpdate(userId, { $addToSet: { channels: channelId } });

      socket.join(`channel_${channelId}`);
      // Activity
      await Activity.create({
        user: userId,
        channel: channelId,
        type: 'join',
        payload: { message: `${socket.user.name} joined` }
      });

      io.to(`channel_${channelId}`).emit('user_joined', { channelId, user: { id: userId, name: socket.user.name } });

    } catch (err) {
      console.error('joinChannel err', err);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // leaveChannel
  socket.on('leaveChannel', async ({ channelId }) => {
    try {
      const channel = await Channel.findById(channelId);
      if (channel) {
        channel.members = channel.members.filter(m => !m.equals(userId));
        await channel.save();
      }
      await User.findByIdAndUpdate(userId, { $pull: { channels: channelId } });
      socket.leave(`channel_${channelId}`);

      await Activity.create({
        user: userId,
        channel: channelId,
        type: 'leave',
        payload: { message: `${socket.user.name} left` }
      });

      io.to(`channel_${channelId}`).emit('user_left', { channelId, user: { id: userId, name: socket.user.name } });
    } catch (err) {
      console.error('leaveChannel err', err);
      socket.emit('error', { message: 'Failed to leave channel' });
    }
  });

  // sendMessage (client sends message)
  socket.on('sendMessage', async ({ channelId, content, type = 'text' }) => {
    try {
      content = xss(content || '');
      const trimmed = content.trim();
      if (!trimmed && type === 'text') return socket.emit('error', { message: 'Empty message' });

      // Basic rate-checking could be added here (per-socket)
      const message = await Message.create({
        channel: channelId,
        sender: userId,
        content: trimmed,
        type
      });

      // update channel lastMessageAt
      await Channel.findByIdAndUpdate(channelId, { lastMessageAt: message.createdAt });

      // Activity
      await Activity.create({
        user: userId,
        channel: channelId,
        type: 'message',
        payload: { messageId: message._id, snippet: trimmed.slice(0, 200) }
      });

      // emit to channel room
      io.to(`channel_${channelId}`).emit('newMessage', {
        message: {
          id: message._id,
          channel: channelId,
          sender: { id: userId, name: socket.user.name },
          content: message.content,
          type: message.type,
          createdAt: message.createdAt
        }
      });
    } catch (err) {
      console.error('sendMessage err', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} reason: ${reason}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
  } catch (_) {}
  server.close(() => process.exit(0));
});
