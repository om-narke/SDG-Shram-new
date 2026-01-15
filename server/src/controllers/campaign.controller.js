const Campaign = require('../models/Campaign');
const { deleteFromCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new campaign
 * @route   POST /api/campaigns
 * @access  Private
 */
const createCampaign = async (req, res) => {
  try {
    const campaignData = { ...req.body };
    campaignData.createdBy = req.user.id;

    // Check compliance status for NGOs (RELAXED FOR DEMO)
    const user = await require('../models/User').findById(req.user.id);
    if (user.stakeholderType === 'ngo' && user.ngo.complianceStatus !== 'VERIFIED') {
      console.log(`⚠️ DEMO BYPASS: NGO ${user.email} creating campaign without full verification.`);
      // return res.status(403).json({
      //   success: false,
      //   error: 'NGO compliance verification required before creating campaigns'
      // });
    }

    // Parse JSON strings if sent as form data
    if (typeof campaignData.fundAllocation === 'string') {
      campaignData.fundAllocation = JSON.parse(campaignData.fundAllocation);
    }
    if (typeof campaignData.objectives === 'string') {
      campaignData.objectives = JSON.parse(campaignData.objectives);
    }
    if (typeof campaignData.timeline === 'string') {
      campaignData.timeline = JSON.parse(campaignData.timeline);
    }

    // Handle cover image if uploaded
    if (req.file) {
      campaignData.coverImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const campaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all campaigns (with filters)
 * @route   GET /api/campaigns
 * @access  Public
 */
const getCampaigns = async (req, res) => {
  try {
    const { status, sdg, location, search, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by status (default to active for public)
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    } else {
      query.status = 'active';
    }

    // Filter by SDG
    if (sdg) {
      query.primarySdg = parseInt(sdg);
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Search by title or overview
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { overview: { $regex: search, $options: 'i' } }
      ];
    }

    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'email stakeholderType ngo.ngoName business.companyName institution.institutionName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    res.status(200).json({
      success: true,
      count: campaigns.length,
      total,
      pages: Math.ceil(total / limit),
      data: campaigns
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'email stakeholderType ngo business institution');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Increment views
    campaign.views += 1;
    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get campaigns by current user
 * @route   GET /api/campaigns/my
 * @access  Private
 */
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/campaigns/:id
 * @access  Private (owner only)
 */
const updateCampaign = async (req, res) => {
  try {
    let campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this campaign'
      });
    }

    const updateData = { ...req.body };

    // Parse JSON strings
    if (typeof updateData.fundAllocation === 'string') {
      updateData.fundAllocation = JSON.parse(updateData.fundAllocation);
    }
    if (typeof updateData.objectives === 'string') {
      updateData.objectives = JSON.parse(updateData.objectives);
    }
    if (typeof updateData.timeline === 'string') {
      updateData.timeline = JSON.parse(updateData.timeline);
    }

    // Handle new cover image
    if (req.file) {
      // Delete old image from Cloudinary
      if (campaign.coverImage && campaign.coverImage.publicId) {
        await deleteFromCloudinary(campaign.coverImage.publicId);
      }
      updateData.coverImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/campaigns/:id
 * @access  Private (owner only)
 */
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this campaign'
      });
    }

    // Delete cover image from Cloudinary
    if (campaign.coverImage && campaign.coverImage.publicId) {
      await deleteFromCloudinary(campaign.coverImage.publicId);
    }

    // Delete documents from Cloudinary
    if (campaign.documents && campaign.documents.length > 0) {
      for (const doc of campaign.documents) {
        if (doc.publicId) {
          await deleteFromCloudinary(doc.publicId, 'raw');
        }
      }
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Approve/Activate a campaign
 * @route   PUT /api/campaigns/:id/approve
 * @access  Private (Admin only - for demo, any authenticated user)
 */
const approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'active', isVerified: true },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaign,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign,
  approveCampaign
};
