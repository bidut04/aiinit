import { cloudinary } from './config';
/**
 * Delete a single file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return { result: result.result };
    }
    catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
    }
};
/**
 * Delete multiple files from Cloudinary
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
    const deletePromises = publicIds.map(id => deleteFromCloudinary(id));
    return Promise.all(deletePromises);
};
/**
 * Delete all files in a folder
 */
export const deleteFolderFromCloudinary = async (folderPath) => {
    try {
        const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
        return { deleted: Object.keys(result.deleted).length };
    }
    catch (error) {
        console.error('Cloudinary folder delete error:', error);
        throw new Error(`Failed to delete folder: ${error.message}`);
    }
};
