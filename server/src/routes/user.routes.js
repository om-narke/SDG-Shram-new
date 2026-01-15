const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDiscoveryUsers,
  searchUsers,
  sendRequest,
  acceptRequest,
  rejectRequest,
  getPendingRequests
} = require('../controllers/user.controller');

router.get('/discovery', protect, getDiscoveryUsers);
router.get('/search', protect, searchUsers);
router.get('/connect/requests', protect, getPendingRequests);
router.post('/connect/:id', protect, sendRequest);
router.put('/connect/accept/:id', protect, acceptRequest);
router.put('/connect/reject/:id', protect, rejectRequest);


module.exports = router;
