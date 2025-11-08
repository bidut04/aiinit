import { cloudinary } from './config';
/**
 * Upload a file to Cloudinary
 * @param file - File buffer or base64 string
 * @param options - Upload options
 */
export const uploadToCloudinary = async (file, options = {}) => {
    const { folder = 'general', transformation, resourceType = 'auto', allowedFormats, maxFileSize, publicId, overwrite = false, tags = [] } = options;
    try {
        // Convert buffer to base64 if needed
        const fileData = Buffer.isBuffer(file)
            ? `data:image/jpeg;base64,${file.toString('base64')}`
            : file;
        const uploadOptions = {
            folder,
            resource_type: resourceType,
            overwrite,
            tags,
            ...(publicId && { public_id: publicId }),
            ...(allowedFormats && { allowed_formats: allowedFormats }),
            ...(transformation && { transformation: [transformation] })
        };
        const result = await cloudinary.uploader.upload(fileData, uploadOptions);
        // Check file size after upload if maxFileSize is specified
        if (maxFileSize && result.bytes > maxFileSize) {
            // Delete the uploaded file
            await cloudinary.uploader.destroy(result.public_id);
            throw new Error(`File size exceeds maximum allowed size of ${maxFileSize} bytes`);
        }
        return {
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            folder: result.folder
        };
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};
/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleToCloudinary = async (files, options = {}) => {
    const uploadPromises = files.map(file => uploadToCloudinary(file, options));
    return Promise.all(uploadPromises);
};
/**
 * Upload from URL
 */
export const uploadFromUrl = async (url, options = {}) => {
    const { folder = 'general', transformation, tags = [] } = options;
    try {
        const result = await cloudinary.uploader.upload(url, {
            folder,
            tags,
            ...(transformation && { transformation: [transformation] })
        });
        return {
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            folder: result.folder
        };
    }
    catch (error) {
        console.error('Cloudinary URL upload error:', error);
        throw new Error(`Failed to upload from URL: ${error.message}`);
    }
};
