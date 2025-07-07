import React from 'react';
import IPFSUploader from './IPFSUploader';

interface IPFSUploaderWrapperProps {
    onUploadComplete: (urls: string[]) => void;
    uploadType?: 'hotel-image' | 'room-image' | 'document' | 'profile';
    metadata?: {
        hotelId?: string;
        roomId?: string;
        userId?: string;
        type?: 'hotel-image' | 'room-image' | 'document' | 'profile';
        description?: string;
        [key: string]: any;
    };
    className?: string;
}

const IPFSUploaderWrapper: React.FC<IPFSUploaderWrapperProps> = ({
    onUploadComplete,
    uploadType = 'hotel-image',
    metadata = {},
    className = '',
}) => {
    // Store uploaded URLs
    const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);

    // Handle successful upload
    const handleUploadSuccess = (ipfsHash: string, fileUrl: string) => {
        setUploadedUrls(prev => {
            const newUrls = [...prev, fileUrl];
            onUploadComplete(newUrls);
            return newUrls;
        });
    };

    // Handle upload error
    const handleUploadError = (error: string) => {
        console.error('IPFS Upload Error:', error);
    };

    return (
        <IPFSUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            uploadType={uploadType}
            metadata={metadata}
            className={className}
        />
    );
};

export default IPFSUploaderWrapper; 