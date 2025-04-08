import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Adjust path to reach .env from src/utils/

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility function to upload files
const uploadToCloudinary = (filePath) => {
  return cloudinary.uploader.upload(filePath, {
    folder: 'lif_profiles',
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  });
};

export { cloudinary, uploadToCloudinary };