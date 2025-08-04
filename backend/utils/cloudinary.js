// backend/utils/cloudinary.js
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper para subir (desde un archivo temporal en /tmp/uploads)
const uploadToCloudinary = async (filePath, folder = 'artmary') => {
  return cloudinary.uploader.upload(filePath, { folder });
};

// Helper para borrar por public_id (opcional)
const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
