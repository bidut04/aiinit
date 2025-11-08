import type { DeleteResult } from './types';
/**
 * Delete a single file from Cloudinary
 */
export declare const deleteFromCloudinary: (publicId: string) => Promise<DeleteResult>;
/**
 * Delete multiple files from Cloudinary
 */
export declare const deleteMultipleFromCloudinary: (publicIds: string[]) => Promise<DeleteResult[]>;
/**
 * Delete all files in a folder
 */
export declare const deleteFolderFromCloudinary: (folderPath: string) => Promise<{
    deleted: number;
}>;
//# sourceMappingURL=delete.d.ts.map