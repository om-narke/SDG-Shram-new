const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  // Common fields for all users
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a contact number'],
    trim: true
  },
  stakeholderType: {
    type: String,
    enum: ['individual', 'ngo', 'business', 'institution'],
    required: [true, 'Please select a stakeholder type']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Individual-specific fields
  individual: {
    fullName: String,
    roleType: {
      type: String,
      enum: ['student', 'employee', '']
    },
    // Student fields
    schoolCollegeName: String,
    yearOfStudy: String,
    // Employee fields
    companyName: String,
    designation: String,
    // Common
    skills: String
  },

  // NGO-specific fields
  ngo: {
    ngoName: String,
    ngoType: String,
    registrationNumber: String,
    yearOfEstablishment: String,
    registeredAddress: String,
    operatingStates: String,
    authorizedPersonName: String,
    signatoryRole: String,
    missionFocusAreas: String,
    // Onboarding Documentation
    documents: {
      registrationCertificate: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } },
      panCard: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } },
      twelveACertificate: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } },
      eightyGCertificate: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } },
      csr1RegistrationNumber: String,
      fcraCertificate: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } },
      trusteesDetails: { status: { type: String, enum: ['not_added', 'added'], default: 'not_added' }, data: String },
      annualReports: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } },
      auditedStatements: { url: String, publicId: String, status: { type: String, enum: ['unloaded', 'pending', 'verified', 'rejected'], default: 'unloaded' } }
    },
    complianceStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NOT_STARTED'
    },
    onboardingPercentage: {
      type: Number,
      default: 0
    }
  },

  // Business-specific fields
  business: {
    companyName: String,
    businessType: String,
    cinGstNumber: String,
    yearOfEstablishment: String,
    registeredAddress: String,
    operatingStates: String,
    authorizedPersonName: String,
    signatoryRole: String,
    csrFocusAreas: String
  },

  // Institution-specific fields
  institution: {
    institutionName: String,
    institutionType: String,
    aisheAffiliationNumber: String,
    yearOfEstablishment: String,
    registeredAddress: String,
    operatingStates: String,
    headPrincipalName: String,
    signatoryRole: String,
    departmentsSdgInitiatives: String
  },

  // Security & Meta
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function () {
  console.log('DEBUG: Pre-save hook running, isModified("password"):', this.isModified('password'));
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Match user entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');

  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function () {
  const crypto = require('crypto');

  const verificationToken = crypto.randomBytes(20).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);
