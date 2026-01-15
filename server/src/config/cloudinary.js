const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Storage for campaign cover images
const campaignImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sdg-shram/campaigns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [{ width: 1200, height: 630, crop: 'fill' }]
  }
});

// Storage for documents (PDFs, images for certificates, etc.)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sdg-shram/documents',
    resource_type: 'auto',  // Auto-detect file type (works for both images and PDFs)
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
  }
});

// Multer upload instances
const uploadCampaignImage = multer({
  storage: campaignImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  cloudinary,
  uploadCampaignImage,
  uploadDocument,
  deleteFromCloudinary
};
