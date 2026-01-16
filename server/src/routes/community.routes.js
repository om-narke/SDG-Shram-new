const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getJoinedCommunities
} = require('../controllers/community.controller');

router.get('/', getCommunities);
router.get('/joined', protect, getJoinedCommunities);
router.post('/', protect, createCommunity);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;
