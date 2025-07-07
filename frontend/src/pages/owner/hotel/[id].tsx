import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/FirebaseContext';
import { useFirebase } from '../../../contexts/FirebaseContext';
import Link from 'next/link';
import axios from 'axios';
import { config } from '../../../config';
import IPFSUploader from '../../../components/IPFSUploader';

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

// Standard amenities list
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

// Room types
const roomTypes = [
    'Standard',
    'Deluxe',
    'Suite',
    'Executive Suite',
    'Family Room',
    'Single Room',
    'Double Room'
];

export default function HotelManagement() {
    const { user, isHotelOwner, loading } = useAuth();
    const router = useRouter();
    const { id } = router.query;

    // Hotel state
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Room management state
    const [showAddRoomForm, setShowAddRoomForm] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [newRoom, setNewRoom] = useState({
        type: 'Standard',
        description: '',
        pricePerNight: 0,
        maxGuests: 2,
        amenities: [] as string[],
        images: [] as string[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Redirect if not logged in or not a hotel owner
    useEffect(() => {
        if (!loading && !isHotelOwner && !user) {
            router.push('/');
        }
    }, [isHotelOwner, loading, router, user]);

    // Fetch hotel details
    useEffect(() => {
        const fetchHotel = async () => {
            if (!id) return;

            try {
                setIsLoading(true);
                const response = await axios.get(`${config.API_URL}/api/hotels/${id}`);
                setHotel(response.data);

                // Verify this hotel belongs to the current user
                if (response.data.ownerId !== user?.uid) {
                    setError('You do not have permission to manage this hotel');
                } else {
                    setError(null);
                }
            } catch (err: any) {
                console.error('Error fetching hotel:', err);
                setError('Failed to load hotel details. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        if (user && isHotelOwner && id) {
            fetchHotel();
        }
    }, [id, user, isHotelOwner]);

    // Handle room amenity toggle
    const handleRoomAmenityToggle = (amenity: string) => {
        if (newRoom.amenities.includes(amenity)) {
            setNewRoom({
                ...newRoom,
                amenities: newRoom.amenities.filter(a => a !== amenity)
            });
        } else {
            setNewRoom({
                ...newRoom,
                amenities: [...newRoom.amenities, amenity]
            });
        }
    };

    // Handle room image upload
    const handleRoomImageUpload = (urls: string[]) => {
        setNewRoom({
            ...newRoom,
            images: [...newRoom.images, ...urls]
        });
    };

    // Remove room image
    const removeRoomImage = (index: number) => {
        setNewRoom({
            ...newRoom,
            images: newRoom.images.filter((_, i) => i !== index)
        });
    };

    // Edit room
    const editRoom = (room: Room) => {
        setEditingRoomId(room._id);
        setNewRoom({
            type: room.type,
            description: room.description || '',
            pricePerNight: room.pricePerNight,
            maxGuests: room.maxGuests,
            amenities: room.amenities,
            images: room.images.map(img => img.url)
        });
        setShowAddRoomForm(true);
    };

    // Cancel room form
    const cancelRoomForm = () => {
        setShowAddRoomForm(false);
        setEditingRoomId(null);
        setNewRoom({
            type: 'Standard',
            description: '',
            pricePerNight: 0,
            maxGuests: 2,
            amenities: [],
            images: []
        });
    };

    // Add or update room
    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Validate form
            if (!newRoom.type || newRoom.pricePerNight <= 0 || newRoom.maxGuests <= 0) {
                setError('Please fill in all required fields correctly');
                setIsSubmitting(false);
                return;
            }

            if (editingRoomId) {
                // Update existing room
                await axios.put(`${config.API_URL}/api/hotels/${id}/rooms/${editingRoomId}`, newRoom);
                setSuccessMessage('Room updated successfully');
            } else {
                // Add new room
                await axios.post(`${config.API_URL}/api/hotels/${id}/rooms`, newRoom);
                setSuccessMessage('Room added successfully');
            }

            // Refresh hotel data
            const response = await axios.get(`${config.API_URL}/api/hotels/${id}`);
            setHotel(response.data);

            // Reset form
            cancelRoomForm();
        } catch (err: any) {
            console.error('Error saving room:', err);
            setError(`Error: ${err.response?.data?.message || 'Failed to save room'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete room
    const deleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;

        try {
            setIsLoading(true);
            await axios.delete(`${config.API_URL}/api/hotels/${id}/rooms/${roomId}`);

            // Refresh hotel data
            const response = await axios.get(`${config.API_URL}/api/hotels/${id}`);
            setHotel(response.data);

            setSuccessMessage('Room deleted successfully');
        } catch (err: any) {
            console.error('Error deleting room:', err);
            setError(`Error: ${err.response?.data?.message || 'Failed to delete room'}`);
        } finally {
            setIsLoading(false);
        }
    };

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

    if (error && error.includes('permission')) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                        <h2 className="text-xl font-bold mb-4">Access Denied</h2>
                        <p>{error}</p>
                        <div className="mt-4">
                            <Link href="/owner" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!hotel) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                        <h2 className="text-xl font-bold mb-4">Hotel Not Found</h2>
                        <p>The hotel you are looking for could not be found.</p>
                        <div className="mt-4">
                            <Link href="/owner" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Back to Dashboard
                            </Link>
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
                            <Link href="/owner" className="text-blue-500 hover:text-blue-400 mb-2 inline-block">
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold">{hotel.name}</h1>
                            <p className="text-gray-400">{hotel.location.city}, {hotel.location.country}</p>
                        </div>
                        <div>
                            <Link
                                href={`/hotels/${hotel._id}`}
                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 mr-2"
                            >
                                View Hotel
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">Success</h2>
                            <p>{successMessage}</p>
                        </div>
                    )}

                    {/* Hotel Details Section */}
                    <div className="bg-[#1E293B] rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-semibold mb-6">Hotel Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                                <p className="text-gray-400 mb-1"><span className="font-medium text-white">Name:</span> {hotel.name}</p>
                                <p className="text-gray-400 mb-1"><span className="font-medium text-white">Location:</span> {hotel.location.address}, {hotel.location.city}, {hotel.location.country}</p>
                                <p className="text-gray-400 mb-1"><span className="font-medium text-white">Rating:</span> {hotel.rating.toFixed(1)}/5</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-2">Description</h3>
                                <p className="text-gray-400">{hotel.description}</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                                {hotel.amenities.map((amenity) => (
                                    <span key={amenity} className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded text-sm">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Images</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {hotel.images.map((image, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={image.url}
                                            alt={image.alt}
                                            className="h-32 w-full object-cover rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rooms Section */}
                    <div className="bg-[#1E293B] rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Room Management</h2>
                            {!showAddRoomForm && (
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={() => setShowAddRoomForm(true)}
                                >
                                    Add Room
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Room Form */}
                        {showAddRoomForm && (
                            <div className="mb-8 border border-gray-700 rounded-lg p-4">
                                <h3 className="text-xl font-semibold mb-4">
                                    {editingRoomId ? 'Edit Room' : 'Add New Room'}
                                </h3>
                                <form onSubmit={handleRoomSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Room Type *</label>
                                            <select
                                                className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                                value={newRoom.type}
                                                onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                                                required
                                            >
                                                {roomTypes.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Price Per Night (USDT) *</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                                placeholder="Enter price"
                                                value={newRoom.pricePerNight}
                                                onChange={(e) => setNewRoom({ ...newRoom, pricePerNight: Number(e.target.value) })}
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Max Guests *</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                                placeholder="Enter max guests"
                                                value={newRoom.maxGuests}
                                                onChange={(e) => setNewRoom({ ...newRoom, maxGuests: Number(e.target.value) })}
                                                min="1"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-2">Room Description</label>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                                placeholder="Enter room description"
                                                value={newRoom.description}
                                                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    {/* Room Amenities */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-2">Room Amenities</label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                            {standardAmenities.map((amenity) => (
                                                <div
                                                    key={amenity}
                                                    className={`px-3 py-1 rounded-lg cursor-pointer text-center text-xs transition-colors
                            ${newRoom.amenities.includes(amenity)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-[#0B1120] text-gray-300 hover:bg-gray-700'}`}
                                                    onClick={() => handleRoomAmenityToggle(amenity)}
                                                >
                                                    {amenity}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Room Images */}
                                    <div className="mt-4">
                                        <IPFSUploader onUploadComplete={handleRoomImageUpload} />

                                        {newRoom.images.length > 0 && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium mb-2">Room Images</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {newRoom.images.map((url, imgIndex) => (
                                                        <div key={imgIndex} className="relative">
                                                            <img
                                                                src={url}
                                                                alt={`Room image ${imgIndex + 1}`}
                                                                className="h-24 w-full object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                                                                onClick={() => removeRoomImage(imgIndex)}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                            onClick={cancelRoomForm}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Saving...' : editingRoomId ? 'Update Room' : 'Add Room'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Rooms List */}
                        {hotel.rooms.length === 0 ? (
                            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
                                <h3 className="font-bold">No Rooms Available</h3>
                                <p>This hotel doesn't have any rooms yet. Add a room to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {hotel.rooms.map((room) => (
                                    <div key={room._id} className="border border-gray-700 rounded-lg overflow-hidden">
                                        <div className="h-40 overflow-hidden">
                                            {room.images.length > 0 ? (
                                                <img
                                                    src={room.images[0].url}
                                                    alt={room.images[0].alt}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                    <span className="text-gray-500">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold">{room.type}</h3>
                                            <p className="text-blue-400 font-medium">${room.pricePerNight} / night</p>
                                            <p className="text-gray-400 text-sm mt-1">Max Guests: {room.maxGuests}</p>
                                            {room.description && (
                                                <p className="text-gray-400 text-sm mt-2">{room.description}</p>
                                            )}
                                            {room.amenities.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {room.amenities.slice(0, 3).map((amenity) => (
                                                            <span
                                                                key={amenity}
                                                                className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs"
                                                            >
                                                                {amenity}
                                                            </span>
                                                        ))}
                                                        {room.amenities.length > 3 && (
                                                            <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">
                                                                +{room.amenities.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-4 flex justify-end space-x-2">
                                                <button
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                    onClick={() => editRoom(room)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                    onClick={() => deleteRoom(room._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
} 