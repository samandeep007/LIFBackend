import { cloudinary } from '../lib.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export const uploadToCloudinary = async (filePath, options = {}) => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'lif-profiles',
        ...options,
    });
    await fs.unlink(filePath);
    return result.secure_url;
};