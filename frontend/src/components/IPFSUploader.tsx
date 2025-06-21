import React, { useState, useCallback, useRef } from 'react';
import { ipfsService } from '../utils/ipfs';

interface IPFSUploaderProps {
    onUploadSuccess?: (ipfsHash: string, fileUrl: string) => void;
    onUploadError?: (error: string) => void;
    acceptedTypes?: string[];
    maxFileSize?: number; // in MB
    uploadType?: 'hotel-image' | 'room-image' | 'document' | 'profile';
    metadata?: {
        hotelId?: string;
        roomId?: string;
        userId?: string;
        type?: 'hotel-image' | 'room-image' | 'document' | 'profile';
        description?: string;
        [key: string]: any; // Allow additional metadata properties
    };
    className?: string;
    children?: React.ReactNode;
}

interface UploadProgress {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    ipfsHash?: string;
    error?: string;
}

const IPFSUploader: React.FC<IPFSUploaderProps> = ({
    onUploadSuccess,
    onUploadError,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxFileSize = 10, // 10MB default
    uploadType = 'document',
    metadata = {},
    className = '',
    children
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const validFiles: File[] = [];
        const errors: string[] = [];

        // Validate files
        Array.from(files).forEach(file => {
            if (!acceptedTypes.includes(file.type)) {
                errors.push(`${file.name}: Unsupported file type`);
                return;
            }

            if (file.size > maxFileSize * 1024 * 1024) {
                errors.push(`${file.name}: File too large (max ${maxFileSize}MB)`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            errors.forEach(error => onUploadError?.(error));
            return;
        }

        if (validFiles.length === 0) return;

        setIsUploading(true);

        // Initialize upload progress tracking
        const initialUploads: UploadProgress[] = validFiles.map(file => ({
            file,
            progress: 0,
            status: 'uploading' as const
        }));

        setUploads(initialUploads);

        // Upload files concurrently
        const uploadPromises = validFiles.map(async (file, index) => {
            try {
                // Update progress
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? { ...upload, progress: 10 } : upload
                ));

                const result = await ipfsService.uploadFile(file, {
                    name: file.name,
                    metadata: {
                        ...metadata,
                        type: uploadType
                    }
                });

                // Update success status
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? {
                        ...upload,
                        progress: 100,
                        status: 'success' as const,
                        ipfsHash: result.IpfsHash
                    } : upload
                ));

                const fileUrl = ipfsService.getFileUrl(result.IpfsHash);
                onUploadSuccess?.(result.IpfsHash, fileUrl);

                return { success: true, result, file };
            } catch (error: any) {
                // Update error status
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? {
                        ...upload,
                        status: 'error' as const,
                        error: error.message
                    } : upload
                ));

                onUploadError?.(error.message);
                return { success: false, error: error.message, file };
            }
        });

        await Promise.all(uploadPromises);
        setIsUploading(false);

        // Clear uploads after 3 seconds
        setTimeout(() => setUploads([]), 3000);
    }, [acceptedTypes, maxFileSize, uploadType, metadata, onUploadSuccess, onUploadError]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    }, [handleFileSelect]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`ipfs-uploader ${className}`}>
            <div
                className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleInputChange}
                    className="hidden"
                />

                {children || (
                    <div>
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        <div className="text-sm text-gray-600">
                            <p className="font-medium">
                                {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="mt-1">
                                {acceptedTypes.includes('image/jpeg') && 'Images: JPG, PNG, WebP'}
                                {acceptedTypes.includes('application/pdf') && ' • Documents: PDF'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Max file size: {maxFileSize}MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Progress */}
            {uploads.length > 0 && (
                <div className="mt-4 space-y-2">
                    {uploads.map((upload, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {upload.file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatFileSize(upload.file.size)}
                                </span>
                            </div>

                            {upload.status === 'uploading' && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${upload.progress}%` }}
                                    />
                                </div>
                            )}

                            {upload.status === 'success' && (
                                <div className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-sm">
                                        Uploaded to IPFS: {upload.ipfsHash?.substring(0, 8)}...
                                    </span>
                                </div>
                            )}

                            {upload.status === 'error' && (
                                <div className="flex items-center text-red-600">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-sm">{upload.error}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* IPFS Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-blue-800">
                            Decentralized Storage (IPFS)
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Files are stored on the InterPlanetary File System for permanent,
                            decentralized access. Each file gets a unique hash for verification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IPFSUploader; 