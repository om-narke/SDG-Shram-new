const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');

/**
 * @desc    Register a new user (supports all stakeholder types)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, phone, stakeholderType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Build user data based on stakeholder type
    const userData = {
      email,
      password,
      phone,
      stakeholderType
    };

    // Add stakeholder-specific fields
    switch (stakeholderType) {
      case 'individual':
        userData.individual = {
          fullName: req.body.fullName,
          roleType: req.body.roleType,
          schoolCollegeName: req.body.schoolCollegeName,
          yearOfStudy: req.body.yearOfStudy,
          companyName: req.body.companyName,
          designation: req.body.designation,
          skills: req.body.skills
        };
        break;

      case 'ngo':
        userData.ngo = {
          ngoName: req.body.ngoName,
          registrationNumber: req.body.registrationNumber,
          authorizedPersonName: req.body.authorizedPersonName,
          missionFocusAreas: req.body.missionFocusAreas
        };
        break;

      case 'business':
        userData.business = {
          companyName: req.body.companyName,
          cinGstNumber: req.body.cinGstNumber,
          authorizedPersonName: req.body.authorizedPersonName,
          csrFocusAreas: req.body.csrFocusAreas
        };
        break;

      case 'institution':
        userData.institution = {
          institutionName: req.body.institutionName,
          aisheAffiliationNumber: req.body.aisheAffiliationNumber,
          headPrincipalName: req.body.headPrincipalName,
          departmentsSdgInitiatives: req.body.departmentsSdgInitiatives
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid stakeholder type'
        });
    }

    // Create user
    const user = await User.create(userData);

    // Send token response
    sendTokenResponse(user, 201, res);

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login (without triggering pre-save hook)
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Send token response
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * @desc    Update user details (supports all stakeholder types)
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
const updateDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build update object
    const updateData = {};

    // Update common fields
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.phone = req.body.phone;

    // Update role-specific fields based on stakeholder type
    switch (user.stakeholderType) {
      case 'individual':
        updateData.individual = { ...user.individual };
        if (req.body.fullName) updateData.individual.fullName = req.body.fullName;
        if (req.body.roleType) updateData.individual.roleType = req.body.roleType;
        if (req.body.schoolCollegeName) updateData.individual.schoolCollegeName = req.body.schoolCollegeName;
        if (req.body.yearOfStudy) updateData.individual.yearOfStudy = req.body.yearOfStudy;
        if (req.body.companyName) updateData.individual.companyName = req.body.companyName;
        if (req.body.designation) updateData.individual.designation = req.body.designation;
        if (req.body.skills) updateData.individual.skills = req.body.skills;
        break;

      case 'ngo':
        updateData.ngo = { ...user.ngo };
        if (req.body.ngoName) updateData.ngo.ngoName = req.body.ngoName;
        if (req.body.ngoType) updateData.ngo.ngoType = req.body.ngoType;
        if (req.body.registrationNumber) updateData.ngo.registrationNumber = req.body.registrationNumber;
        if (req.body.yearOfEstablishment) updateData.ngo.yearOfEstablishment = req.body.yearOfEstablishment;
        if (req.body.registeredAddress) updateData.ngo.registeredAddress = req.body.registeredAddress;
        if (req.body.operatingStates) updateData.ngo.operatingStates = req.body.operatingStates;
        if (req.body.authorizedPersonName) updateData.ngo.authorizedPersonName = req.body.authorizedPersonName;
        if (req.body.signatoryRole) updateData.ngo.signatoryRole = req.body.signatoryRole;
        if (req.body.missionFocusAreas) updateData.ngo.missionFocusAreas = req.body.missionFocusAreas;
        break;

      case 'business':
        updateData.business = { ...user.business };
        if (req.body.companyName) updateData.business.companyName = req.body.companyName;
        if (req.body.businessType) updateData.business.businessType = req.body.businessType;
        if (req.body.yearOfEstablishment) updateData.business.yearOfEstablishment = req.body.yearOfEstablishment;
        if (req.body.registeredAddress) updateData.business.registeredAddress = req.body.registeredAddress;
        if (req.body.operatingStates) updateData.business.operatingStates = req.body.operatingStates;
        if (req.body.authorizedPersonName) updateData.business.authorizedPersonName = req.body.authorizedPersonName;
        if (req.body.signatoryRole) updateData.business.signatoryRole = req.body.signatoryRole;
        if (req.body.csrFocusAreas) updateData.business.csrFocusAreas = req.body.csrFocusAreas;
        break;

      case 'institution':
        updateData.institution = { ...user.institution };
        if (req.body.institutionName) updateData.institution.institutionName = req.body.institutionName;
        if (req.body.institutionType) updateData.institution.institutionType = req.body.institutionType;
        if (req.body.aisheAffiliationNumber) updateData.institution.aisheAffiliationNumber = req.body.aisheAffiliationNumber;
        if (req.body.yearOfEstablishment) updateData.institution.yearOfEstablishment = req.body.yearOfEstablishment;
        if (req.body.registeredAddress) updateData.institution.registeredAddress = req.body.registeredAddress;
        if (req.body.operatingStates) updateData.institution.operatingStates = req.body.operatingStates;
        if (req.body.headPrincipalName) updateData.institution.headPrincipalName = req.body.headPrincipalName;
        if (req.body.signatoryRole) updateData.institution.signatoryRole = req.body.signatoryRole;
        if (req.body.departmentsSdgInitiatives) updateData.institution.departmentsSdgInitiatives = req.body.departmentsSdgInitiatives;
        break;
    }

    // Use findByIdAndUpdate to avoid triggering password hash middleware
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Update details error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during update'
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password update'
    });
  }
};

/**
 * @desc    Upload onboarding document for NGO
 * @route   POST /api/auth/onboarding/document
 * @access  Private (NGO only)
 */
const uploadOnboardingDocument = async (req, res) => {
  try {
    const { docType } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.stakeholderType !== 'ngo') {
      return res.status(403).json({ success: false, error: 'Only NGOs can upload onboarding documents' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    // Mapping of frontend doc keys to schema paths
    const docMapping = {
      'registrationCertificate': 'registrationCertificate',
      'panCard': 'panCard',
      'twelveACertificate': 'twelveACertificate',
      'eightyGCertificate': 'eightyGCertificate',
      'fcraCertificate': 'fcraCertificate',
      'annualReports': 'annualReports',
      'auditedStatements': 'auditedStatements'
    };

    const schemaPath = docMapping[docType];
    if (!schemaPath) {
      return res.status(400).json({ success: false, error: 'Invalid document type' });
    }

    // Initialize ngo and documents objects if they don't exist
    if (!user.ngo) {
      user.ngo = {};
    }
    if (!user.ngo.documents) {
      user.ngo.documents = {};
    }

    // Update the specific document
    user.ngo.documents[schemaPath] = {
      url: req.file.path,
      publicId: req.file.filename,
      status: 'pending'
    };


    // Calculate Onboarding Percentage with null safety checks
    const docs = user.ngo.documents || {};
    let completedSteps = 1; // Basic account creation is already 1
    const totalSteps = 9; // Total items in the onboarding list

    // Helper function to safely check document status
    const isDocUploaded = (doc) => doc && doc.status && doc.status !== 'unloaded';

    if (isDocUploaded(docs.registrationCertificate)) completedSteps++;
    if (isDocUploaded(docs.panCard)) completedSteps++;
    if (isDocUploaded(docs.twelveACertificate)) completedSteps++;
    if (isDocUploaded(docs.eightyGCertificate)) completedSteps++;
    if (isDocUploaded(docs.fcraCertificate)) completedSteps++;
    if (isDocUploaded(docs.annualReports)) completedSteps++;
    if (isDocUploaded(docs.auditedStatements)) completedSteps++;
    if (docs.trusteesDetails && docs.trusteesDetails.status === 'added') completedSteps++;
    if (docs.csr1RegistrationNumber) completedSteps++;

    user.ngo.onboardingPercentage = Math.round((completedSteps / totalSteps) * 100);

    // Check if all required documents are uploaded
    const requiredDocs = ['registrationCertificate', 'panCard', 'twelveACertificate', 'eightyGCertificate'];
    const allRequiredUploaded = requiredDocs.every(docId =>
      docs[docId] && docs[docId].status && docs[docId].status !== 'unloaded'
    ) && docs.trusteesDetails && docs.trusteesDetails.status === 'added';

    // If all essential docs are pending, set overall status to PENDING
    if (user.ngo.complianceStatus === 'NOT_STARTED' && completedSteps > 1) {
      user.ngo.complianceStatus = 'PENDING';
    }

    console.log('DEBUG: Saving user with new document status...');
    await user.save();
    console.log('DEBUG: User saved successfully.');

    // Document name mapping for display
    const docNameMap = {
      'registrationCertificate': 'Registration Certificate',
      'panCard': 'PAN Card',
      'twelveACertificate': '12A Certificate',
      'eightyGCertificate': '80G Certificate',
      'fcraCertificate': 'FCRA Certificate',
      'annualReports': 'Annual Reports',
      'auditedStatements': 'Audited Financial Statements'
    };

    res.status(200).json({
      success: true,
      data: user,
      uploadedDocument: {
        type: docType,
        name: docNameMap[docType] || docType,
        status: 'pending'
      },
      progress: {
        percentage: user.ngo.onboardingPercentage,
        completedSteps,
        totalSteps,
        allRequiredComplete: allRequiredUploaded
      }
    });

  } catch (error) {
    console.error('Onboarding upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update non-file onboarding details (Trustees, CSR-1)
 * @route   PUT /api/auth/onboarding/details
 * @access  Private (NGO only)
 */
const updateOnboardingDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.stakeholderType !== 'ngo') {
      return res.status(403).json({ success: false, error: 'Only NGOs can update onboarding details' });
    }

    if (req.body.csr1RegistrationNumber) {
      user.ngo.documents.csr1RegistrationNumber = req.body.csr1RegistrationNumber;
    }

    if (req.body.trusteesDetails) {
      user.ngo.documents.trusteesDetails = {
        status: 'added',
        data: req.body.trusteesDetails
      };
    }

    // Recalculate percentage
    const docs = user.ngo.documents;
    let completedSteps = 1;
    const totalSteps = 9;

    // Helper function to safely check document status
    const isDocUploaded = (doc) => doc && doc.status && doc.status !== 'unloaded';

    if (isDocUploaded(docs.registrationCertificate)) completedSteps++;
    if (isDocUploaded(docs.panCard)) completedSteps++;
    if (isDocUploaded(docs.twelveACertificate)) completedSteps++;
    if (isDocUploaded(docs.eightyGCertificate)) completedSteps++;
    if (isDocUploaded(docs.fcraCertificate)) completedSteps++;
    if (isDocUploaded(docs.annualReports)) completedSteps++;
    if (isDocUploaded(docs.auditedStatements)) completedSteps++;
    if (docs.trusteesDetails && docs.trusteesDetails.status === 'added') completedSteps++;
    if (docs.csr1RegistrationNumber) completedSteps++;

    user.ngo.onboardingPercentage = Math.round((completedSteps / totalSteps) * 100);

    // Check if all required documents are complete
    const requiredDocs = ['registrationCertificate', 'panCard', 'twelveACertificate', 'eightyGCertificate'];
    const allRequiredUploaded = requiredDocs.every(docId =>
      docs[docId] && docs[docId].status && docs[docId].status !== 'unloaded'
    ) && docs.trusteesDetails && docs.trusteesDetails.status === 'added';

    // Update compliance status if all required docs are complete
    if (user.ngo.complianceStatus === 'NOT_STARTED' && completedSteps > 1) {
      user.ngo.complianceStatus = 'PENDING';
    }

    await user.save();

    // Determine what was updated
    const updatedField = req.body.csr1RegistrationNumber ? 'CSR-1 Registration Number' :
      req.body.trusteesDetails ? 'Board of Trustees Details' : 'Details';

    res.status(200).json({
      success: true,
      data: user,
      updatedField,
      progress: {
        percentage: user.ngo.onboardingPercentage,
        completedSteps,
        totalSteps,
        allRequiredComplete: allRequiredUploaded
      }
    });

  } catch (error) {
    console.error('Onboarding details update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Quick verify NGO (for demo purposes)
 * @route   PUT /api/auth/verify-ngo
 * @access  Private
 */
const verifyNgo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.stakeholderType !== 'ngo') {
      return res.status(403).json({ success: false, error: 'Only NGOs can be verified via this route' });
    }

    user.ngo.complianceStatus = 'VERIFIED';
    user.ngo.onboardingPercentage = 100;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Simulated Social Login (Google/X)
 * @route   POST /api/auth/social-login
 * @access  Public
 */
const socialLogin = async (req, res) => {
  try {
    const { email, name, provider, providerId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required for social login' });
    }

    // Try to find user by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create a mock user if not found
      // Using 'individual' as default stakeholder type for social logins
      user = await User.create({
        email,
        password: Math.random().toString(36).slice(-10), // Random placeholder password
        phone: '0000000000', // Placeholder phone
        stakeholderType: 'individual',
        individual: {
          fullName: name || 'Social User',
          roleType: ''
        },
        isVerified: true, // Socially verified
        isActive: true
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during social login'
    });
  }
};

module.exports = {
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
};
