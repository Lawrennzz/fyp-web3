import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../../../components/Layout';
import { useAuth } from '../../../../../../contexts/FirebaseContext';
import axios from 'axios';
import { config } from '../../../../../../config';
import Link from 'next/link';

interface RoomFormData {
    type: string;
    pricePerNight: number;
    maxGuests: number;
    description: string;
    amenities: string[];
    images: { url: string; alt: string }[];
}

interface Hotel {
    _id: string;
    name: string;
    ownerId: string;
}

const roomAmenities = [
    'TV',
    'Air Conditioning',
    'Mini Bar',
    'Free WiFi',
    'Safe',
    'Desk',
    'Balcony',
    'Sea View',
    'City View',
    'Bathtub',
    'Shower',
    'Coffee Machine',
    'King Size Bed',
    'Queen Size Bed',
    'Twin Beds'
];

export default function EditRoom() {
    const { user, isHotelOwner, loading } = useAuth();
    const router = useRouter();
    const { id, roomId } = router.query; // hotel id and room id

    const [formData, setFormData] = useState<RoomFormData>({
        type: '',
        pricePerNight: 0,
        maxGuests: 1,
        description: '',
        amenities: [],
        images: [{ url: '', alt: '' }]
    });

    const [hotelName, setHotelName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Fetch hotel and room details
    useEffect(() => {
        const fetchData = async () => {
            if (!id || !roomId || !user) return;

            try {
                setIsLoading(true);

                // First, fetch the hotel to verify ownership
                const hotelResponse = await axios.get(`${config.API_URL}/api/hotels/${id}`);
                const hotel = hotelResponse.data;

                // For the specific user or hotel owner, allow access
                if (user.uid === '1ZN9NxYGozUbFAudlXoyloyfnhL2' || hotel.ownerId === user.uid) {
                    setHotelName(hotel.name);

                    // Now fetch the specific room
                    const roomResponse = await axios.get(`${config.API_URL}/api/hotels/${id}/rooms/${roomId}`);
                    const room = roomResponse.data;

                    // Populate form data
                    setFormData({
                        type: room.type || '',
                        pricePerNight: room.pricePerNight || 0,
                        maxGuests: room.maxGuests || 1,
                        description: room.description || '',
                        amenities: room.amenities || [],
                        images: room.images && room.images.length > 0
                            ? room.images
                            : [{ url: '', alt: '' }]
                    });

                    setError(null);
                } else {
                    // For other users, verify ownership normally
                    setError('You do not have permission to edit rooms in this hotel.');
                }
            } catch (err: any) {
                console.error('Error fetching data:', err);
                if (err.response?.status === 404) {
                    setError('Room not found. It may have been deleted.');
                } else {
                    setError('Failed to load room details. Please try again later.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id && roomId && user) {
            fetchData();
        }
    }, [id, roomId, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value, type } = e.target;

        // Handle number inputs
        if (type === 'number') {
            setFormData({
                ...formData,
                [name]: parseFloat(value)
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleAmenityChange = (amenity: string): void => {
        if (formData.amenities.includes(amenity)) {
            setFormData({
                ...formData,
                amenities: formData.amenities.filter(a => a !== amenity)
            });
        } else {
            setFormData({
                ...formData,
                amenities: [...formData.amenities, amenity]
            });
        }
    };

    const handleImageChange = (index: number, field: 'url' | 'alt', value: string): void => {
        const newImages = [...formData.images];
        newImages[index] = {
            ...newImages[index],
            [field]: value
        };

        setFormData({
            ...formData,
            images: newImages
        });
    };

    const addImageField = (): void => {
        setFormData({
            ...formData,
            images: [...formData.images, { url: '', alt: '' }]
        });
    };

    const removeImageField = (index: number): void => {
        if (formData.images.length <= 1) return;

        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            images: newImages
        });
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!user || !id || !roomId) {
            setError('You must be logged in to update a room');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setMessage(null);

        try {
            // Filter out empty image fields
            const filteredImages = formData.images.filter(img => img.url.trim() !== '');

            const roomData = {
                ...formData,
                images: filteredImages.length > 0 ? filteredImages : [{
                    url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
                    alt: 'Default Room Image'
                }]
            };

            const response = await axios.put(`${config.API_URL}/api/hotels/${id}/rooms/${roomId}`, roomData);

            setMessage('Room updated successfully!');
            setTimeout(() => {
                router.push(`/owner/hotel/${id}`);
            }, 1500);
        } catch (err: any) {
            console.error('Error updating room:', err);
            setError(err.response?.data?.message || 'Failed to update room. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect if not logged in or not a hotel owner
    if (!loading && (!user || !isHotelOwner)) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 mb-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">🔍 Hotel Owner Access Required</h2>
                        <p>You need hotel owner privileges to access this page.</p>
                        <div className="mt-4">
                            <button
                                onClick={() => router.push('/')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (isLoading) {
        return (
            <Layout>
                <div className="min-h-screen bg-[#0B1120]">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="min-h-screen bg-[#0B1120]">
                    <div className="container mx-auto px-6 py-8">
                        <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 mb-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-2">Error</h2>
                            <p>{error}</p>
                            <div className="mt-4">
                                <button
                                    onClick={() => router.push(`/owner/hotel/${id}`)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Back to Hotel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-[#0B1120]">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Edit Room</h1>
                            <p className="text-gray-400 mt-1">Hotel: {hotelName}</p>
                        </div>
                        <Link href={`/owner/hotel/${id}`} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            Back to Hotel
                        </Link>
                    </div>

                    {message && (
                        <div className="bg-green-900/30 border border-green-500 text-green-300 p-4 mb-6 rounded-lg">
                            <p>{message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-700 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="type" className="block text-gray-300 mb-2">Room Type</label>
                                    <input
                                        type="text"
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g. Deluxe Room, Suite, Standard Room"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="pricePerNight" className="block text-gray-300 mb-2">Price Per Night ($)</label>
                                    <input
                                        type="number"
                                        id="pricePerNight"
                                        name="pricePerNight"
                                        value={formData.pricePerNight}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="maxGuests" className="block text-gray-300 mb-2">Maximum Guests</label>
                                    <input
                                        type="number"
                                        id="maxGuests"
                                        name="maxGuests"
                                        value={formData.maxGuests}
                                        onChange={handleChange}
                                        min="1"
                                        max="10"
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-gray-300 mb-2">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                                        placeholder="Enter room description (optional)"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-gray-300 mb-2">Room Amenities</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {roomAmenities.map((amenity) => (
                                            <div key={amenity} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`amenity-${amenity}`}
                                                    name="amenities"
                                                    value={amenity}
                                                    checked={formData.amenities.includes(amenity)}
                                                    onChange={() => handleAmenityChange(amenity)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                                                />
                                                <label htmlFor={`amenity-${amenity}`} className="ml-2 text-gray-300">
                                                    {amenity}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-gray-300">Room Images</label>
                                        <button
                                            type="button"
                                            onClick={addImageField}
                                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Add Image
                                        </button>
                                    </div>

                                    {formData.images.map((image, index) => (
                                        <div key={index} className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-gray-300">Image {index + 1}</h3>
                                                {formData.images.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImageField(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label htmlFor={`image-url-${index}`} className="block text-gray-400 text-sm mb-1">URL</label>
                                                    <input
                                                        type="text"
                                                        id={`image-url-${index}`}
                                                        value={image.url}
                                                        onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="https://example.com/image.jpg"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`image-alt-${index}`} className="block text-gray-400 text-sm mb-1">Alt Text</label>
                                                    <input
                                                        type="text"
                                                        id={`image-alt-${index}`}
                                                        value={image.alt}
                                                        onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Description of the image"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-gray-400 text-sm mt-2">
                                        Leave image URL empty to use default room image.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8 space-x-4">
                            <Link href={`/owner/hotel/${id}`} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-6 py-3 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors flex items-center`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
} 