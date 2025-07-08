import { useState, useEffect } from 'react';
import Image from 'next/image';
import { normalizeImageUrl, PLACEHOLDER_HOTEL_IMAGE } from '../utils/helpers';

// Define our own props interface without extending ImageProps
interface SafeImageProps {
    src: string | null | undefined;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    quality?: number;
    priority?: boolean;
    fallbackSrc?: string;
    className?: string;
    imgClassName?: string;
    objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    objectPosition?: string;
    [key: string]: any; // For any other props
}

/**
 * A component that safely renders images using Next.js Image when possible
 * and falls back to regular img tag when needed
 */
const SafeImage: React.FC<SafeImageProps> = ({
    src,
    fallbackSrc = PLACEHOLDER_HOTEL_IMAGE,
    alt,
    className = '',
    imgClassName = '',
    ...props
}) => {
    const [error, setError] = useState(false);
    const normalizedSrc = normalizeImageUrl(src);
    const imgSrc = error ? fallbackSrc : normalizedSrc;

    // Debug logging
    useEffect(() => {
        console.log('SafeImage Debug:');
        console.log('Original src:', src);
        console.log('Normalized src:', normalizedSrc);
        console.log('Final imgSrc:', imgSrc);
        console.log('Is error:', error);
    }, [src, normalizedSrc, imgSrc, error]);

    // Check if the image is from an allowed domain for Next.js Image
    const isAllowedDomain = () => {
        try {
            const url = new URL(imgSrc);
            const allowedDomains = [
                'images.unsplash.com',
                'lh3.googleusercontent.com',
                'firebasestorage.googleapis.com',
                'localhost',
                'placehold.co',
                'ipfs.io'
            ];
            return allowedDomains.some(domain =>
                url.hostname === domain ||
                url.hostname.endsWith(`.${domain}`)
            );
        } catch (e) {
            console.error('URL parsing error:', e);
            // If URL parsing fails, it's likely a relative URL which is allowed
            return true;
        }
    };

    // Use regular img tag for data URLs or domains not in the allowed list
    if (imgSrc.startsWith('data:') || !isAllowedDomain()) {
        return (
            <img
                src={imgSrc}
                alt={alt as string}
                className={`${className} ${imgClassName}`}
                onError={() => {
                    console.log('Image load error, falling back to placeholder');
                    setError(true);
                }}
            />
        );
    }

    // Use Next.js Image for allowed domains
    return (
        <Image
            src={imgSrc}
            alt={alt as string}
            className={`${className} ${imgClassName}`}
            onError={() => {
                console.log('Next.js Image load error, falling back to placeholder');
                setError(true);
            }}
            {...props}
        />
    );
};

export default SafeImage; 