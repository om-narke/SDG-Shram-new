const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

router.get('/conversations', messageController.getConversations);
router.get('/communities', messageController.getJoinedCommunities);
router.get('/history', messageController.getMessages);
router.post('/send', messageController.sendMessage);

module.exports = router;
