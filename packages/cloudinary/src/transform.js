import { cloudinary } from './config';
/**
 * Generate optimized image URL with transformations
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
    const { width, height, crop = 'fill', quality = 'auto', format = 'auto', gravity = 'auto' } = options;
    return cloudinary.url(publicId, {
        transformation: [
            {
                ...(width && { width }),
                ...(height && { height }),
                crop,
                quality,
                format,
                gravity,
                fetch_format: 'auto'
            }
        ],
        secure: true
    });
};
/**
 * Generate responsive image URLs for different screen sizes
 */
export const getResponsiveImageUrls = (publicId) => {
    return {
        thumbnail: getOptimizedImageUrl(publicId, { width: 150, height: 150, crop: 'thumb' }),
        small: getOptimizedImageUrl(publicId, { width: 400, quality: 'auto' }),
        medium: getOptimizedImageUrl(publicId, { width: 800, quality: 'auto' }),
        large: getOptimizedImageUrl(publicId, { width: 1200, quality: 'auto' }),
        original: cloudinary.url(publicId, { secure: true })
    };
};
/**
 * Generate thumbnail URL
 */
export const getThumbnailUrl = (publicId, size = 200) => {
    return getOptimizedImageUrl(publicId, {
        width: size,
        height: size,
        crop: 'thumb',
        gravity: 'face'
    });
};
