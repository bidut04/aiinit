export interface UploadOptions {
    folder?: string;
    transformation?: TransformationOptions;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    allowedFormats?: string[];
    maxFileSize?: number;
    publicId?: string;
    overwrite?: boolean;
    tags?: string[];
}
export interface TransformationOptions {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
    quality?: 'auto' | number;
    format?: 'jpg' | 'png' | 'webp' | 'avif';
    gravity?: 'auto' | 'face' | 'center';
}
export interface UploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    resourceType: string;
    bytes: number;
    folder?: string;
}
export interface DeleteResult {
    result: 'ok' | 'not found';
}
export type CloudinaryFolder = 'restaurants/logos' | 'restaurants/banners' | 'restaurants/menus' | 'restaurants/documents' | 'dishes/images' | 'users/avatars' | 'promotions';
//# sourceMappingURL=types.d.ts.map