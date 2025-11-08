'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const ImageUploader = ({ folder, onUploadComplete, maxSize = 5 * 1024 * 1024, acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'] }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
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
            }
            catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
            }
            // Check if response was ok
            if (!response.ok) {
                throw new Error(data.error || `Upload failed with status ${response.status}`);
            }
            console.log('✅ Upload successful:', data);
            onUploadComplete(data);
        }
        catch (err) {
            console.error('❌ Upload error:', err);
            setError(err.message || 'Upload failed');
            setPreview(null);
        }
        finally {
            setUploading(false);
        }
    };
    return (_jsxs("div", { className: "w-full", children: [_jsxs("label", { className: "block w-full cursor-pointer", children: [_jsx("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition", children: preview ? (_jsx("img", { src: preview, alt: "Preview", className: "max-h-48 mx-auto" })) : (_jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Click to upload or drag and drop" }), _jsxs("p", { className: "text-sm text-gray-400 mt-1", children: [acceptedFormats.join(', '), " (max ", maxSize / (1024 * 1024), "MB)"] })] })) }), _jsx("input", { type: "file", className: "hidden", accept: acceptedFormats.join(','), onChange: handleFileChange, disabled: uploading })] }), uploading && (_jsx("div", { className: "mt-2", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" }), _jsx("p", { className: "text-sm text-blue-600", children: "Uploading..." })] }) })), error && (_jsx("div", { className: "mt-2 p-2 bg-red-50 border border-red-200 rounded", children: _jsx("p", { className: "text-sm text-red-600", children: error }) }))] }));
};
