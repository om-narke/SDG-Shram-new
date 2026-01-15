const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createServiceRequest,
  getMyServiceRequests,
  getAllServiceRequests
} = require('../controllers/service.controller');

router.use(protect);

router.post('/request', createServiceRequest);
router.get('/my', getMyServiceRequests);
router.get('/', getAllServiceRequests);

module.exports = router;
