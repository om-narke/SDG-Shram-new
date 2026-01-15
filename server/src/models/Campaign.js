const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide a campaign title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  primarySdg: {
    type: Number,
    required: [true, 'Please select a primary SDG'],
    min: 1,
    max: 17
  },
  location: {
    type: String,
    required: [true, 'Please provide campaign location'],
    trim: true
  },
  overview: {
    type: String,
    required: [true, 'Please provide campaign overview'],
    minlength: [100, 'Overview must be at least 100 characters']
  },
  coverImage: {
    url: String,
    publicId: String
  },

  // Funding Details
  goalAmount: {
    type: Number,
    required: [true, 'Please provide fundraising goal'],
    min: [10000, 'Minimum goal is ₹10,000']
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date']
  },
  fundAllocation: [{
    category: String,
    percentage: Number
  }],

  // Objectives & Impact
  objectives: [{
    type: String
  }],
  beneficiaries: {
    type: Number,
    default: 0
  },
  targetArea: String,

  // Timeline
  timeline: [{
    name: String,
    date: String,
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed'],
      default: 'planned'
    }
  }],

  // Additional Information
  aboutOrg: String,
  videoUrl: String,
  documents: [{
    url: String,
    publicId: String,
    name: String
  }],

  // Campaign Status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'completed', 'rejected'],
    default: 'draft'
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Statistics
  supporters: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },

  // Relations
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for days left
CampaignSchema.virtual('daysLeft').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

// Virtual for progress percentage
CampaignSchema.virtual('progressPercent').get(function() {
  if (this.goalAmount === 0) return 0;
  return Math.min(100, Math.round((this.raisedAmount / this.goalAmount) * 100));
});

// Ensure virtuals are included in JSON
CampaignSchema.set('toJSON', { virtuals: true });
CampaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
