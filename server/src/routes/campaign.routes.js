const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadCampaignImage } = require('../config/cloudinary');
const {
  createCampaign,
  getCampaigns,
  getCampaign,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign,
  approveCampaign
} = require('../controllers/campaign.controller');

// Public routes
router.get('/', getCampaigns);
router.get('/:id', getCampaign);

// Protected routes
router.post('/', protect, uploadCampaignImage.single('coverImage'), createCampaign);
router.get('/user/my', protect, getMyCampaigns);
router.put('/:id/approve', protect, approveCampaign); // Added approval route
router.put('/:id', protect, uploadCampaignImage.single('coverImage'), updateCampaign);
router.delete('/:id', protect, deleteCampaign);

module.exports = router;
