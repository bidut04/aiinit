import type { TransformationOptions } from './types';
/**
 * Generate optimized image URL with transformations
 */
export declare const getOptimizedImageUrl: (publicId: string, options?: TransformationOptions) => string;
/**
 * Generate responsive image URLs for different screen sizes
 */
export declare const getResponsiveImageUrls: (publicId: string) => {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
};
/**
 * Generate thumbnail URL
 */
export declare const getThumbnailUrl: (publicId: string, size?: number) => string;
//# sourceMappingURL=transform.d.ts.map