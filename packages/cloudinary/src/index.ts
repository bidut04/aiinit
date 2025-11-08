// Configuration
export { configureCloudinary, verifyCloudinaryConfig, cloudinary } from './config';

// Upload functions
export {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  uploadFromUrl
} from './upload';

// Delete functions
export {
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  deleteFolderFromCloudinary
} from './delete';

// Transform functions
export {
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  getThumbnailUrl
} from './transform';

// Types
export type {
  UploadOptions,
  UploadResult,
  DeleteResult,
  TransformationOptions,
  CloudinaryFolder
} from './types';
export { ImageUploader } from './ImageUploader';