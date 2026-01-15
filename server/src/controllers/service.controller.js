const ServiceRequest = require('../models/ServiceRequest');

/**
 * @desc    Submit a new service request
 * @route   POST /api/services/request
 * @access  Private
 */
exports.createServiceRequest = async (req, res) => {
  try {
    req.body.user = req.user.id;

    const serviceRequest = await ServiceRequest.create(req.body);

    res.status(201).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get user's service requests
 * @route   GET /api/services/my
 * @access  Private
 */
exports.getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get all service requests (Admin only)
 * @route   GET /api/services
 * @access  Private/Admin
 */
exports.getAllServiceRequests = async (req, res) => {
  try {
    // Basic admin check - in a real app this would be in middleware
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to access all requests' });
    }

    const requests = await ServiceRequest.find().populate('user', 'email stakeholderType individual ngo business institution');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
