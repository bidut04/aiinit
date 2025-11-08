import type { UploadResult } from './types';
interface ImageUploaderProps {
    folder: string;
    onUploadComplete: (result: UploadResult) => void;
    maxSize?: number;
    acceptedFormats?: string[];
}
export declare const ImageUploader: ({ folder, onUploadComplete, maxSize, acceptedFormats }: ImageUploaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ImageUploader.d.ts.map