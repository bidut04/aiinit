import type { UploadOptions, UploadResult } from './types';
/**
 * Upload a file to Cloudinary
 * @param file - File buffer or base64 string
 * @param options - Upload options
 */
export declare const uploadToCloudinary: (file: Buffer | string, options?: UploadOptions) => Promise<UploadResult>;
/**
 * Upload multiple files to Cloudinary
 */
export declare const uploadMultipleToCloudinary: (files: Array<Buffer | string>, options?: UploadOptions) => Promise<UploadResult[]>;
/**
 * Upload from URL
 */
export declare const uploadFromUrl: (url: string, options?: UploadOptions) => Promise<UploadResult>;
//# sourceMappingURL=upload.d.ts.map