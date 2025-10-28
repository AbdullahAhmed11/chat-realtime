const express = require('express');
const auth = require('../middleware/auth');
const { createChannel, listChannels, getChannel } = require('../controllers/channelsController');

const router = express.Router();

router.post('/', auth, createChannel);

router.get('/', auth, listChannels);

router.get('/:id', auth, getChannel);

module.exports = router;
