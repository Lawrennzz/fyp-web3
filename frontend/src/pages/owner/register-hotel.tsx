import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useAuth } from '../../contexts/FirebaseContext';
import { ethers } from 'ethers';
import { getContract } from '../../utils/web3Config';
import HotelBookingABI from '../../contracts/HotelBooking.json';
import { config } from '../../config';
import { doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
import IPFSUploader from '../../components/IPFSUploader';
import axios from 'axios';

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

export default function RegisterHotel() {
    const { account, library } = useWeb3React<Web3Provider>();
    const { isHotelOwner, user } = useAuth();
    const router = useRouter();
    const { db } = useFirebase();

    // Hotel details state
    const [hotelName, setHotelName] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [address, setAddress] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // Room details state
    const [rooms, setRooms] = useState([{
        type: 'Standard',
        description: '',
        pricePerNight: 0,
        maxGuests: 2,
        amenities: [] as string[],
        images: [] as string[]
    }]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);

    useEffect(() => {
        // Redirect if not logged in or not a hotel owner
        if (!user && !isHotelOwner) {
            router.push('/');
        }
    }, [user, isHotelOwner, router]);

    const handleAmenityToggle = (amenity: string) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
        } else {
            setSelectedAmenities([...selectedAmenities, amenity]);
        }
    };

    const handleRoomAmenityToggle = (index: number, amenity: string) => {
        const newRooms = [...rooms];
        if (newRooms[index].amenities.includes(amenity)) {
            newRooms[index].amenities = newRooms[index].amenities.filter(a => a !== amenity);
        } else {
            newRooms[index].amenities = [...newRooms[index].amenities, amenity];
        }
        setRooms(newRooms);
    };

    const addRoom = () => {
        setRooms([...rooms, {
            type: 'Standard',
            description: '',
            pricePerNight: 0,
            maxGuests: 2,
            amenities: [],
            images: []
        }]);
    };

    const removeRoom = (index: number) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter((_, i) => i !== index));
        }
    };

    const handleRoomChange = (index: number, field: string, value: any) => {
        const newRooms = [...rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setRooms(newRooms);
    };

    const handleRoomImageUpload = (index: number, urls: string[]) => {
        const newRooms = [...rooms];
        newRooms[index].images = [...newRooms[index].images, ...urls];
        setRooms(newRooms);
    };

    const registerHotelOnBlockchain = async () => {
        if (!library || !account) {
            setError('Wallet not connected');
            return null;
        }

        try {
            const contract = getContract(
                config.HOTEL_BOOKING_CONTRACT,
                HotelBookingABI.abi,
                library.getSigner()
            );

            // Register hotel on blockchain
            const tx = await contract.addHotel(
                hotelName,
                `${city}, ${country}`,
                description,
                imageUrls.length > 0 ? imageUrls[0] : ''
            );

            await tx.wait();

            return {
                transactionHash: tx.hash,
                hotelId: (await contract.hotelIdCounter()).sub(1).toString()
            };
        } catch (error: any) {
            console.error('Error registering hotel on blockchain:', error);
            setError(`Blockchain error: ${error.message || 'Unknown error'}`);
            return null;
        }
    };

    const saveHotelToBackend = async (blockchainId: string, blockchainTxHash: string) => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        try {
            // Prepare hotel data
            const hotelData = {
                name: hotelName,
                description,
                location: {
                    city,
                    country,
                    address,
                    coordinates: {
                        lat: 0, // Would need to integrate with a geocoding service
                        lng: 0
                    }
                },
                image: imageUrls.length > 0 ? imageUrls[0] : '',
                images: imageUrls,
                rating: 0,
                amenities: selectedAmenities,
                rooms: rooms.map(room => ({
                    type: room.type,
                    description: room.description,
                    pricePerNight: room.pricePerNight,
                    maxGuests: room.maxGuests,
                    amenities: room.amenities,
                    images: room.images,
                    bookings: []
                })),
                ownerId: user.uid,
                blockchainId: blockchainId,
                blockchainTxHash
            };

            // Save to backend
            const response = await axios.post(`${config.API_URL}/api/hotels`, hotelData);
            return true;
        } catch (error: any) {
            console.error('Error saving hotel to backend:', error);
            setError(`Backend error: ${error.message || 'Unknown error'}`);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate form
            if (!hotelName || !description || !city || !country || !address) {
                setError('Please fill in all required fields');
                setIsSubmitting(false);
                return;
            }

            if (imageUrls.length === 0) {
                setError('Please upload at least one hotel image');
                setIsSubmitting(false);
                return;
            }

            if (selectedAmenities.length === 0) {
                setError('Please select at least one amenity');
                setIsSubmitting(false);
                return;
            }

            // Validate rooms
            for (const room of rooms) {
                if (!room.type || room.pricePerNight <= 0 || room.maxGuests <= 0) {
                    setError('Please fill in all room details correctly');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Step 1: Register hotel on blockchain
            const blockchainResult = await registerHotelOnBlockchain();
            if (!blockchainResult) {
                setIsSubmitting(false);
                return;
            }

            setTransactionHash(blockchainResult.transactionHash);

            // Step 2: Save hotel details to backend
            const backendResult = await saveHotelToBackend(blockchainResult.hotelId, blockchainResult.transactionHash);
            if (!backendResult) {
                setIsSubmitting(false);
                return;
            }

            // Success
            setSuccess(`Hotel "${hotelName}" has been successfully registered!`);

            // Reset form after successful submission
            setTimeout(() => {
                router.push('/owner');
            }, 3000);

        } catch (error: any) {
            console.error('Error registering hotel:', error);
            setError(`Registration error: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <h1 className="text-3xl font-bold mb-8">Register New Hotel</h1>

                    {!account && !user && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">Connect Your Wallet</h2>
                            <p>Please connect your wallet to register a hotel.</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
                            <h2 className="font-bold">Success!</h2>
                            <p>{success}</p>
                            {transactionHash && (
                                <p className="mt-2">
                                    Transaction Hash:{' '}
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                                    </a>
                                </p>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Hotel Details Section */}
                        <div className="bg-[#1E293B] rounded-xl p-6">
                            <h2 className="text-2xl font-semibold mb-6">Hotel Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Hotel Name *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                        placeholder="Enter hotel name"
                                        value={hotelName}
                                        onChange={(e) => setHotelName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Description *</label>
                                    <textarea
                                        className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                        placeholder="Enter hotel description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">City *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                        placeholder="Enter city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Country *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                        placeholder="Enter country"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Address *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                        placeholder="Enter full address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium mb-2">Amenities *</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {standardAmenities.map((amenity) => (
                                        <div
                                            key={amenity}
                                            className={`px-4 py-2 rounded-lg cursor-pointer text-center text-sm transition-colors
                        ${selectedAmenities.includes(amenity)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-[#0B1120] text-gray-300 hover:bg-gray-700'}`}
                                            onClick={() => handleAmenityToggle(amenity)}
                                        >
                                            {amenity}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="mt-6">
                                <IPFSUploader onUploadComplete={(urls: string[]) => setImageUrls([...imageUrls, ...urls])} />

                                {imageUrls.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-2">Uploaded Images</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {imageUrls.map((url, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={url}
                                                        alt={`Hotel image ${index + 1}`}
                                                        className="h-32 w-full object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                                                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rooms Section */}
                        <div className="bg-[#1E293B] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">Room Details</h2>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={addRoom}
                                >
                                    Add Room
                                </button>
                            </div>

                            {rooms.map((room, index) => (
                                <div key={index} className="mb-8 border border-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Room {index + 1}</h3>
                                        {rooms.length > 1 && (
                                            <button
                                                type="button"
                                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                                onClick={() => removeRoom(index)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Room Type *</label>
                                            <select
                                                className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                                value={room.type}
                                                onChange={(e) => handleRoomChange(index, 'type', e.target.value)}
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
                                                value={room.pricePerNight}
                                                onChange={(e) => handleRoomChange(index, 'pricePerNight', Number(e.target.value))}
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
                                                value={room.maxGuests}
                                                onChange={(e) => handleRoomChange(index, 'maxGuests', Number(e.target.value))}
                                                min="1"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-2">Room Description</label>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded-lg bg-[#0B1120] border-gray-700"
                                                placeholder="Enter room description"
                                                value={room.description}
                                                onChange={(e) => handleRoomChange(index, 'description', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    {/* Room Amenities */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-2">Room Amenities</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {standardAmenities.map((amenity) => (
                                                <div
                                                    key={amenity}
                                                    className={`px-3 py-1 rounded-lg cursor-pointer text-center text-xs transition-colors
                            ${room.amenities.includes(amenity)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-[#0B1120] text-gray-300 hover:bg-gray-700'}`}
                                                    onClick={() => handleRoomAmenityToggle(index, amenity)}
                                                >
                                                    {amenity}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Room Images */}
                                    <div className="mt-4">
                                        <IPFSUploader onUploadComplete={(urls) => handleRoomImageUpload(index, urls)} />

                                        {room.images.length > 0 && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium mb-2">Room Images</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {room.images.map((url, imgIndex) => (
                                                        <div key={imgIndex} className="relative">
                                                            <img
                                                                src={url}
                                                                alt={`Room image ${imgIndex + 1}`}
                                                                className="h-24 w-full object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                                                                onClick={() => {
                                                                    const newRooms = [...rooms];
                                                                    newRooms[index].images = newRooms[index].images.filter((_, i) => i !== imgIndex);
                                                                    setRooms(newRooms);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className={`px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Registering...' : 'Register Hotel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
} 