import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/FirebaseContext';
import axios from 'axios';
import { config } from '../../config';
import Link from 'next/link';

const standardAmenities = [
    'WiFi',
    'Pool',
    'Restaurant',
    'Gym',
    'Spa & Wellness',
    'Parking',
    'Kids-friendly',
    'Room Service',
    'Pet-friendly',
    'Bar'
];

interface FormData {
    name: string;
    description: string;
    location: {
        city: string;
        country: string;
        address: string;
    };
    image: string;
    rating: number;
    amenities: string[];
}

export default function RegisterHotel() {
    const { user, isHotelOwner, loading } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        location: {
            city: '',
            country: '',
            address: ''
        },
        image: '',
        rating: 0,
        amenities: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            // Handle nested properties like location.city
            const [parent, child] = name.split('.');
            if (parent === 'location') {
                setFormData({
                    ...formData,
                    location: {
                        ...formData.location,
                        [child]: value
                    }
                });
            }
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

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setMessage('');

        if (!user) {
            setError('You must be logged in to register a hotel');
            setIsSubmitting(false);
            return;
        }

        try {
            const hotelData = {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                image: formData.image,
                rating: Number(formData.rating),
                amenities: formData.amenities,
                ownerId: user.uid
            };

            const response = await axios.post(`${config.API_URL}/api/hotels`, hotelData);

            setMessage('Hotel registered successfully!');
            router.push('/owner');
        } catch (err: any) {
            console.error('Error registering hotel:', err);
            setError(err.response?.data?.message || 'Failed to register hotel. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect if not logged in or not a hotel owner
    if (!loading && (!user || !isHotelOwner)) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p className="font-bold">Access Denied</p>
                        <p>You need hotel owner privileges to access this page.</p>
                        <div className="mt-4">
                            <button
                                onClick={() => router.push('/')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Go to Home
                            </button>
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
                        <h1 className="text-3xl font-bold text-white">Register New Hotel</h1>
                        <Link href="/owner" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            Back to Dashboard
                        </Link>
                    </div>

                    {error && (
                        <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 mb-6 rounded-lg">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-700 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-gray-300 mb-2">Hotel Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter hotel name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-gray-300 mb-2">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                                        placeholder="Enter hotel description"
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="city" className="block text-gray-300 mb-2">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="location.city"
                                        value={formData.location.city}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="country" className="block text-gray-300 mb-2">Country</label>
                                    <input
                                        type="text"
                                        id="country"
                                        name="location.country"
                                        value={formData.location.country}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter country"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="address" className="block text-gray-300 mb-2">Address</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="location.address"
                                        value={formData.location.address}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter address"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="rating" className="block text-gray-300 mb-2">Rating (0-10)</label>
                                    <input
                                        type="number"
                                        id="rating"
                                        name="rating"
                                        value={formData.rating}
                                        onChange={handleChange}
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">Amenities</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {standardAmenities.map((amenity) => (
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
                                    <label htmlFor="image" className="block text-gray-300 mb-2">Image URL</label>
                                    <input
                                        type="text"
                                        id="image"
                                        name="image"
                                        value={formData.image}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter image URL (optional)"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8 space-x-4">
                            <Link href="/owner" className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
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
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        Register Hotel
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
} 