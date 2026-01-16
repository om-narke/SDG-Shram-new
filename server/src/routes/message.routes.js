const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:type/:id', getMessages); // type: 'dm' or 'community', id: entityId
router.post('/send', sendMessage);

module.exports = router;
