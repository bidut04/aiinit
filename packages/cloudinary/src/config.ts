import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (call this once at app startup)
export const configureCloudinary = () => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  };

  console.log('🔧 Configuring Cloudinary with:', {
    cloud_name: config.cloud_name,
    api_key: config.api_key ? '***' + config.api_key.slice(-4) : 'MISSING',
    api_secret: config.api_secret ? '***' : 'MISSING'
  });

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.error('❌ Cloudinary config missing:', {
      cloud_name: !!config.cloud_name,
      api_key: !!config.api_key,
      api_secret: !!config.api_secret
    });
    throw new Error('Cloudinary configuration is incomplete. Check environment variables.');
  }

  cloudinary.config(config);
  
  return true;
};

// Verify configuration
export const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Cloudinary configuration is incomplete. Check environment variables.');
  }
  
  return true;
};

export { cloudinary };