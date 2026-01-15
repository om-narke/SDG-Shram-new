const User = require('../models/User');
const Connection = require('../models/Connection');

/**
 * @desc    Get suggested users for discovery
 * @route   GET /api/users/discovery
 */
exports.getDiscoveryUsers = async (req, res) => {
  try {
    // Get 6 random users, excluding the current user
    const users = await User.aggregate([
      { $match: { _id: { $ne: req.user._id }, isActive: true } },
      { $sample: { size: 6 } },
      { $project: { password: 0, resetPasswordToken: 0, resetPasswordExpire: 0 } }
    ]);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Search all users
 * @route   GET /api/users/search
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
      $or: [
        { 'individual.fullName': searchRegex },
        { 'ngo.ngoName': searchRegex },
        { 'business.companyName': searchRegex },
        { 'institution.institutionName': searchRegex },
        { email: searchRegex }
      ]
    }).select('-password').limit(20);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Send connection request
 * @route   POST /api/users/connect/:id
 */
exports.sendRequest = async (req, res) => {
  try {
    const recipientId = req.params.id;
    if (recipientId === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot connect with yourself' });
    }

    // Check if connection already exists
    const existing = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Connection or request already exists' });
    }

    const connection = await Connection.create({
      requester: req.user.id,
      recipient: recipientId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Accept connection request
 * @route   PUT /api/users/connect/accept/:id
 */
exports.acceptRequest = async (req, res) => {
  try {
    const connection = await Connection.findOne({
      requester: req.params.id,
      recipient: req.user.id,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    connection.status = 'accepted';
    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Reject connection request
 * @route   PUT /api/users/connect/reject/:id
 */
exports.rejectRequest = async (req, res) => {
  try {
    const connection = await Connection.findOne({
      requester: req.params.id,
      recipient: req.user.id,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    connection.status = 'rejected';
    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get pending connection requests
 * @route   GET /api/users/connect/requests
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user.id,
      status: 'pending'
    }).populate('requester', 'individual ngo business institution stakeholderType');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

