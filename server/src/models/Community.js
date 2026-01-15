const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a community name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  sdg: {
    type: String,
    required: [true, 'Please specify an SDG focus']
  },
  coverImage: {
    url: String,
    publicId: String
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Community', CommunitySchema);
