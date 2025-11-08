import { cloudinary } from './config';
import type { DeleteResult } from './types';

/**
 * Delete a single file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string
): Promise<DeleteResult> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { result: result.result as 'ok' | 'not found' };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

/**
 * Delete multiple files from Cloudinary
 */
export const deleteMultipleFromCloudinary = async (
  publicIds: string[]
): Promise<DeleteResult[]> => {
  const deletePromises = publicIds.map(id => deleteFromCloudinary(id));
  return Promise.all(deletePromises);
};

/**
 * Delete all files in a folder
 */
export const deleteFolderFromCloudinary = async (
  folderPath: string
): Promise<{ deleted: number }> => {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
    return { deleted: Object.keys(result.deleted).length };
  } catch (error: any) {
    console.error('Cloudinary folder delete error:', error);
    throw new Error(`Failed to delete folder: ${error.message}`);
  }
};