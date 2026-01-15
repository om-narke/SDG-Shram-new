const express = require('express');
const router = express.Router();

// Import controller
const {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  uploadOnboardingDocument,
  updateOnboardingDetails,
  verifyNgo,
  socialLogin
} = require('../controllers/auth.controller');

// Import middleware
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, validate } = require('../middleware/validation');
const { uploadDocument } = require('../config/cloudinary');

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/social-login', socialLogin);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Onboarding routes
router.post('/onboarding/document', protect, uploadDocument.single('file'), uploadOnboardingDocument);
router.put('/onboarding/details', protect, updateOnboardingDetails);
router.put('/verify-ngo', protect, verifyNgo); // Quick verify for demo

module.exports = router;
