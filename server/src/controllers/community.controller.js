const Community = require('../models/Community');

/**
 * @desc    Create a new community
 * @route   POST /api/communities
 */
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, sdg } = req.body;

    // Check if community already exists
    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Community with this name already exists' });
    }

    const community = await Community.create({
      name,
      description,
      sdg,
      creator: req.user.id,
      members: [req.user.id],
      memberCount: 1
    });

    res.status(201).json({
      success: true,
      data: community
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get all communities
 * @route   GET /api/communities
 */
exports.getCommunities = async (req, res) => {
  try {
    const communities = await Community.find().populate('creator', 'individual.fullName ngo.ngoName');
    res.status(200).json({
      success: true,
      data: communities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Join a community
 * @route   POST /api/communities/:id/join
 */
exports.joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    if (community.members.includes(req.user.id)) {
      return res.status(400).json({ success: false, error: 'Already a member' });
    }

    community.members.push(req.user.id);
    community.memberCount += 1;
    await community.save();

    res.status(200).json({
      success: true,
      data: community
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Leave a community
 * @route   POST /api/communities/:id/leave
 */
exports.leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const index = community.members.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({ success: false, error: 'Not a member' });
    }

    community.members.splice(index, 1);
    community.memberCount -= 1;
    await community.save();

    res.status(200).json({
      success: true,
      data: community
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
