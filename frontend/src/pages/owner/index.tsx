import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/FirebaseContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import Link from 'next/link';
import axios from 'axios';
import { config } from '../../config';
import { PLACEHOLDER_HOTEL_IMAGE, normalizeImageUrl } from '../../utils/helpers';

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
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [showDebug, setShowDebug] = useState(false);
    const [isCreatingTestHotel, setIsCreatingTestHotel] = useState(false);
    const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

    // Check API status
    useEffect(() => {
        const checkApiStatus = async () => {
            try {
                const response = await axios.get(`${config.API_URL}/api/owner/test`);
                if (response.data && response.data.message) {
                    setApiStatus('connected');
                    setDebugInfo((prev: Record<string, any>) => ({
                        ...prev,
                        apiStatus: 'connected',
                        apiStatusMessage: response.data.message,
                        apiStatusCheckedAt: new Date().toISOString()
                    }));
                }
            } catch (err: any) {
                console.error('API status check failed:', err);
                setApiStatus('error');
                setDebugInfo((prev: Record<string, any>) => ({
                    ...prev,
                    apiStatus: 'error',
                    apiStatusError: err.message,
                    apiStatusCheckedAt: new Date().toISOString()
                }));
            }
        };

        checkApiStatus();
    }, []);

    // Log authentication state for debugging
    useEffect(() => {
        console.log('Auth state in owner dashboard:', {
            user: user?.uid,
            isHotelOwner,
            loading
        });

        // Store debug info for display
        setDebugInfo({
            userId: user?.uid || 'Not signed in',
            email: user?.email || 'Not available',
            isHotelOwner: isHotelOwner ? 'Yes' : 'No',
            loading: loading ? 'Yes' : 'No',
            timestamp: new Date().toISOString()
        });
    }, [user, isHotelOwner, loading]);

    // Redirect if not logged in or not a hotel owner
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [loading, router, user]);

    // Fetch hotel owner's hotels
    useEffect(() => {
        const fetchHotels = async () => {
            if (!user) return;

            try {
                setIsLoading(true);

                // Use the regular hotels endpoint with a filter query parameter
                console.log(`Fetching hotels for owner ${user.uid} using fallback method`);
                const response = await axios.get(`${config.API_URL}/api/hotels`, {
                    params: { ownerId: user.uid }
                });

                console.log('API response:', response.data);
                setHotels(response.data);
                setError(null);

                // Update debug info with API response
                setDebugInfo((prev: Record<string, any>) => ({
                    ...prev,
                    usedFallback: true,
                    hotelsCount: response.data.length,
                    apiEndpoint: `${config.API_URL}/api/hotels?ownerId=${user.uid}`,
                    apiResponseTimestamp: new Date().toISOString(),
                    apiResponseData: response.data
                }));
            } catch (err: any) {
                console.error('Error fetching hotels:', err);
                setError('Failed to load hotels. Please try again later.');

                // Update debug info with error
                setDebugInfo((prev: Record<string, any>) => ({
                    ...prev,
                    apiError: err.message,
                    apiErrorStatus: err.response?.status,
                    apiErrorTimestamp: new Date().toISOString()
                }));
            } finally {
                setIsLoading(false);
            }
        };

        if (user && isHotelOwner) {
            fetchHotels();
        } else if (user && !loading) {
            setIsLoading(false);
        }
    }, [user, isHotelOwner, loading]);

    // Function to create a test hotel
    const createTestHotel = async () => {
        if (!user) return;

        try {
            setIsCreatingTestHotel(true);

            // Create a test hotel using the regular hotels API
            const testHotel = {
                name: 'Test Owner Hotel',
                description: 'This is a test hotel for the owner dashboard',
                location: {
                    city: 'Test City',
                    country: 'Test Country',
                    address: '123 Test Street'
                },
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                images: [
                    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', alt: 'Hotel Front' }
                ],
                rating: 4.5,
                amenities: ['WiFi', 'Pool', 'Parking', 'Restaurant'],
                rooms: [
                    {
                        type: 'Deluxe Room',
                        pricePerNight: 150,
                        maxGuests: 2,
                        description: 'A comfortable room with all amenities',
                        amenities: ['TV', 'Air Conditioning', 'Mini Bar'],
                        images: [
                            { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a', alt: 'Deluxe Room' }
                        ]
                    }
                ],
                ownerId: user.uid
            };

            const response = await axios.post(`${config.API_URL}/api/hotels`, testHotel);

            // Update the hotels list with the new hotel
            setHotels(prevHotels => [...prevHotels, response.data]);
            setError(null);

            // Update debug info
            setDebugInfo((prev: Record<string, any>) => ({
                ...prev,
                testHotelCreated: true,
                testHotelId: response.data._id,
                testHotelCreatedAt: new Date().toISOString()
            }));

        } catch (err: any) {
            console.error('Error creating test hotel:', err);
            setError('Failed to create test hotel. Please try again later.');

            // Update debug info with error
            setDebugInfo((prev: Record<string, any>) => ({
                ...prev,
                testHotelError: err.message,
                testHotelErrorStatus: err.response?.status,
                testHotelErrorTimestamp: new Date().toISOString()
            }));
        } finally {
            setIsCreatingTestHotel(false);
        }
    };

    if (loading) {
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

    if (!user) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                        <h2 className="text-xl font-bold mb-4">🔍 Authentication Required</h2>
                        <p>Please sign in to access the hotel owner dashboard.</p>
                        <div className="mt-4">
                            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Go to Home
                            </Link>
                        </div>
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
                            <p><strong>User Email:</strong> {user?.email || 'Not available'}</p>
                            <p><strong>User ID:</strong> {user?.uid || 'Not available'}</p>
                            <p><strong>Authentication Status:</strong> ✅ Signed in</p>
                            <p><strong>Is Hotel Owner:</strong> ❌ No</p>
                        </div>
                        <div className="mt-4">
                            <p>You need hotel owner privileges to access this page. Please contact the administrator.</p>
                            <p className="mt-2">If you believe this is an error, try signing out and signing back in.</p>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Refresh Page
                                </button>
                                <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                    Go to Home
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Debug information */}
                    <div className="mt-8 bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">Debug Information</h3>
                        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
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
                        <h1 className="text-3xl font-bold text-white">Hotel Owner Dashboard</h1>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm transition-colors"
                                aria-label="Toggle debug info"
                            >
                                {showDebug ? 'Hide Debug' : 'Show Debug'}
                            </button>
                            <Link href="/owner/register-hotel" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Register New Hotel
                            </Link>
                        </div>
                    </div>

                    {showDebug && (
                        <div className="mb-6 bg-gray-800 p-4 rounded-lg text-white border border-gray-700">
                            <h2 className="text-xl font-bold mb-2">Debug Information</h2>
                            <div className="overflow-auto">
                                <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
                            </div>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                                >
                                    Refresh Page
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 mb-6 rounded-lg">
                            <h2 className="font-bold">Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {hotels.length === 0 && !isLoading && !error ? (
                        <div className="bg-blue-900/30 border border-blue-500 text-blue-300 p-6 mb-6 rounded-lg">
                            <h2 className="font-bold text-xl mb-2">No Hotels Found</h2>
                            <p className="mb-4">You haven't registered any hotels yet.</p>
                            <div className="mt-4 flex space-x-4">
                                <Link href="/owner/register-hotel" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Register New Hotel
                                </Link>
                                <button
                                    onClick={createTestHotel}
                                    disabled={isCreatingTestHotel}
                                    className={`px-4 py-2 ${isCreatingTestHotel ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors flex items-center`}
                                >
                                    {isCreatingTestHotel ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            Create Test Hotel
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotels.map((hotel) => (
                                <div key={hotel._id} className="bg-[#1E293B] rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-blue-500 transition-colors">
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={normalizeImageUrl(hotel.image)}
                                            alt={hotel.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.src = PLACEHOLDER_HOTEL_IMAGE;
                                            }}
                                        />
                                    </div>
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold mb-2 text-white">{hotel.name}</h2>
                                        <p className="text-gray-400 mb-2">
                                            {hotel.location.city}, {hotel.location.country}
                                        </p>
                                        <div className="flex items-center mb-4">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-5 h-5 ${i < hotel.rating / 2 ? 'text-yellow-400' : 'text-gray-600'}`}
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
                                        <Link
                                            href={`/owner/hotel/${hotel._id}`}
                                            className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Manage Hotel
                                        </Link>
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