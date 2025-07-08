import { useState, useEffect } from 'react';
import { PLACEHOLDER_HOTEL_IMAGE, normalizeImageUrl } from '../utils/helpers';

interface ImageUploadOrPlaceholderProps {
    currentImage?: string;
    onImageChange: (imageUrl: string) => void;
    placeholderText?: string;
    height?: string;
    width?: string;
    className?: string;
}

const ImageUploadOrPlaceholder: React.FC<ImageUploadOrPlaceholderProps> = ({
    currentImage,
    onImageChange,
    placeholderText = 'Hotel Placeholder',
    height = '200px',
    width = '100%',
    className = '',
}) => {
    const [imageUrl, setImageUrl] = useState<string>(normalizeImageUrl(currentImage));
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (currentImage) {
            setImageUrl(normalizeImageUrl(currentImage));
        }
    }, [currentImage]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match('image.*')) {
            setError('Please select an image file (JPEG, PNG, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        setIsUploading(true);
        setError('');

        // Create a FileReader to read the image as data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setImageUrl(result);
            onImageChange(result);
            setIsUploading(false);
        };
        reader.onerror = () => {
            setError('Error reading file');
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleUsePlaceholder = () => {
        // Generate a placeholder URL with custom text
        const placeholderUrl = `https://placehold.co/800x600/e0e0e0/808080?text=${encodeURIComponent(placeholderText)}`;
        setImageUrl(placeholderUrl);
        onImageChange(placeholderUrl);
    };

    return (
        <div className={`image-upload-container ${className}`}>
            <div
                className="image-preview mb-3"
                style={{
                    height,
                    width,
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '8px',
                    position: 'relative',
                }}
            >
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <div className="loader">Loading...</div>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="flex flex-wrap gap-2">
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    Upload Image
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </label>

                <button
                    onClick={handleUsePlaceholder}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    Use Placeholder
                </button>
            </div>
        </div>
    );
};

export default ImageUploadOrPlaceholder; 