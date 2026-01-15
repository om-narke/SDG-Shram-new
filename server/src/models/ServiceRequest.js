const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: [
      'SDG Impact Assessment', 
      'NGO Verification Support', 
      'CSR Partnership Brokerage', 
      'Startup Mentorship',
      'Innovation Challenge Hosting',
      'Volunteer Matching'
    ],
    required: [true, 'Please specify a service type']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    required: [true, 'Please provide details about your request']
  },
  contactInstructions: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
