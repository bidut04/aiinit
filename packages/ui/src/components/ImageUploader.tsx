'use client';

import { useState } from 'react';
import type { UploadResult } from '@workspace/cloudinary';

interface ImageUploaderProps {
  folder: string;
  onUploadComplete: (result: UploadResult) => void;
  maxSize?: number;
  acceptedFormats?: string[];
}

export const ImageUploader = ({
  folder,
  onUploadComplete,
  maxSize = 5 * 1024 * 1024,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Please upload a valid image format: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      console.log('📤 Uploading to:', '/api/upload');
      console.log('📁 Folder:', folder);
      console.log('📄 File:', file.name, file.type, file.size);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers.get('content-type'));

      // Get response text first
      const text = await response.text();
      console.log('📥 Response text:', text);

      // Check if response is empty
      if (!text) {
        throw new Error('Empty response from server');
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      // Check if response was ok
      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      console.log('✅ Upload successful:', data);
      onUploadComplete(data);
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block w-full cursor-pointer">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 mx-auto" />
          ) : (
            <div>
              <p className="text-gray-600">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400 mt-1">
                {acceptedFormats.join(', ')} (max {maxSize / (1024 * 1024)}MB)
              </p>
            </div>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {uploading && (
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-600">Uploading...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};