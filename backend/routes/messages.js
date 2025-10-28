const express = require('express');
const auth = require('../middleware/auth');
const { getMessages, postMessage } = require('../controllers/messagesController');

const router = express.Router();

router.get('/:id/messages', auth, getMessages);

router.post('/:id/messages', auth, postMessage);

module.exports = router;
