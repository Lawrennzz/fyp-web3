import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/FirebaseContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import Link from 'next/link';
import axios from 'axios';
import { config } from '../../config';

interface Room {
    _id: string;
    type: string;
    pricePerNight: number;
    maxGuests: number;
    description?: string;
    amenities: string[];
    images: { url: string; alt: string }[];
}

interface Hotel {
    _id: string;
    name: string;
    description: string;
    location: {
        city: string;
        country: string;
        address: string;
    };
    image: string;
    images: { url: string; alt: string }[];
    rating: number;
    amenities: string[];
    rooms: Room[];
    ownerId: string;
    blockchainId?: string;
}

export default function OwnerDashboard() {
    const { user, isHotelOwner, loading } = useAuth();
    const router = useRouter();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not logged in or not a hotel owner
    useEffect(() => {
        if (!loading && !isHotelOwner && !user) {
            router.push('/');
        }
    }, [isHotelOwner, loading, router, user]);

    // Fetch hotel owner's hotels
    useEffect(() => {
        const fetchHotels = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const response = await axios.get(`${config.API_URL}/api/hotels/owner/${user.uid}`);
                setHotels(response.data);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching hotels:', err);
                setError('Failed to load hotels. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        if (user && isHotelOwner) {
            fetchHotels();
        }
    }, [user, isHotelOwner]);

    if (loading || isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!isHotelOwner) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                        <h2 className="text-xl font-bold mb-4">🔍 Hotel Owner Access Required</h2>
                        <div className="space-y-2">
                            <p><strong>User Email:</strong> {user?.email || 'Not signed in'}</p>
                            <p><strong>Authentication Status:</strong> {user ? '✅ Signed in' : '❌ Not signed in'}</p>
                            <p><strong>Is Hotel Owner:</strong> {isHotelOwner ? '✅ Yes' : '❌ No'}</p>
                        </div>
                        <div className="mt-4">
                            <p>You need hotel owner privileges to access this page. Please contact the administrator.</p>
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
                        <h1 className="text-3xl font-bold">Hotel Owner Dashboard</h1>
                        <Link href="/owner/register-hotel" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Register New Hotel
                        </Link>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {hotels.length === 0 && !isLoading && !error ? (
                        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">No Hotels Found</h2>
                            <p>You haven't registered any hotels yet. Click "Register New Hotel" to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotels.map((hotel) => (
                                <div key={hotel._id} className="bg-[#1E293B] rounded-xl overflow-hidden shadow-lg">
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={hotel.image || '/images/placeholder-hotel.jpg'}
                                            alt={hotel.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold mb-2">{hotel.name}</h2>
                                        <p className="text-gray-400 mb-2">
                                            {hotel.location.city}, {hotel.location.country}
                                        </p>
                                        <div className="flex items-center mb-4">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-5 h-5 ${i < hotel.rating ? 'text-yellow-400' : 'text-gray-400'
                                                            }`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-gray-400 ml-2">{hotel.rating.toFixed(1)}</span>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-400">
                                                {hotel.rooms.length} {hotel.rooms.length === 1 ? 'Room' : 'Rooms'} Available
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {hotel.amenities.slice(0, 3).map((amenity) => (
                                                <span
                                                    key={amenity}
                                                    className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs"
                                                >
                                                    {amenity}
                                                </span>
                                            ))}
                                            {hotel.amenities.length > 3 && (
                                                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">
                                                    +{hotel.amenities.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/owner/hotel/${hotel._id}`}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                                            >
                                                Manage Hotel
                                            </Link>
                                            <Link
                                                href={`/hotels/${hotel._id}`}
                                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
} 