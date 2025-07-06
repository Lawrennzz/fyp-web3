import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getContract } from '../../utils/web3Config';
import { ethers } from 'ethers';
import DatePicker from 'react-datepicker';
import { GetStaticProps, GetStaticPaths } from 'next';
import { format } from 'date-fns';
import {
  IoWifiOutline,
  IoRestaurantOutline,
  IoCarOutline,
  IoBeerOutline,
  IoHeartOutline,
  IoTvOutline,
  IoPersonOutline,
  IoBedOutline,
  IoServerOutline
} from 'react-icons/io5';
import { FaSwimmingPool, FaSpa, FaPaw } from 'react-icons/fa';

interface Room {
  _id: string;
  type: string;
  description?: string;
  beds: {
    count: number;
    type: string;
  };
  pricePerNight: number;
  available: boolean;
  amenities?: string[];
  maxGuests: number;
  images?: {
    url: string;
    alt?: string;
  }[];
}

interface Hotel {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  image: string;
  images: {
    url: string;
    alt?: string;
  }[];
  rooms: Room[];
  rating: number;
  amenities: string[];
  reviews: {
    user: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

interface HotelDetailProps {
  initialHotel: Hotel | null;
}

export default function HotelDetail({ initialHotel }: HotelDetailProps) {
  const router = useRouter();
  const { account } = useWeb3React();
  const isConnected = !!account;

  const [hotel, setHotel] = useState<Hotel | null>(initialHotel);
  const [loading, setLoading] = useState(!initialHotel);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedGuests, setSelectedGuests] = useState(1);

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${router.query.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel details');
      }

      const data = await response.json();
      setHotel(data);
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      setError('Failed to load hotel details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotel details if not provided initially
  useEffect(() => {
    if (router.query.id && !hotel) {
      fetchHotelDetails();
    }
  }, [router.query.id]);

  // Initialize dates from URL query
  useEffect(() => {
    if (router.isReady && isInitialLoad) {
      const { checkIn: checkInQuery, checkOut: checkOutQuery, guests } = router.query;

      if (checkInQuery) {
        const checkInDate = new Date(checkInQuery as string);
        if (!isNaN(checkInDate.getTime()) && checkInDate >= today) {
          setCheckIn(checkInDate);
        }
      }

      if (checkOutQuery) {
        const checkOutDate = new Date(checkOutQuery as string);
        if (!isNaN(checkOutDate.getTime()) && checkOutDate > today) {
          setCheckOut(checkOutDate);
        }
      }

      if (guests) {
        setSelectedGuests(Number(guests));
      }

      setIsInitialLoad(false);
    }
  }, [router.isReady, today, isInitialLoad]);

  // Update URL when dates or guests change
  useEffect(() => {
    if (router.isReady && !isInitialLoad) {
      const newQuery = {
        ...router.query,
        checkIn: checkIn ? checkIn.toISOString() : undefined,
        checkOut: checkOut ? checkOut.toISOString() : undefined,
        guests: selectedGuests
      };

      // Remove undefined values
      Object.keys(newQuery).forEach(key =>
        newQuery[key] === undefined && delete newQuery[key]
      );

      // Only update if the query params have actually changed
      if (JSON.stringify(newQuery) !== JSON.stringify(router.query)) {
        router.push({
          pathname: router.pathname,
          query: newQuery
        }, undefined, { shallow: true });
      }
    }
  }, [checkIn, checkOut, selectedGuests, router.isReady, isInitialLoad, router.pathname, router.query]);

  // Handle date changes
  const handleCheckInChange = (date: Date | null) => {
    setCheckIn(date);
    // If check-out is before new check-in, update it
    if (date && checkOut && checkOut <= date) {
      const newCheckOut = new Date(date);
      newCheckOut.setDate(newCheckOut.getDate() + 1);
      setCheckOut(newCheckOut);
    }
  };

  const handleCheckOutChange = (date: Date | null) => {
    if (date && checkIn && date > checkIn) {
      setCheckOut(date);
    }
  };

  // Check if a room is available for selected dates and guest count
  const isRoomAvailable = (room: Room) => {
    if (!checkIn || !checkOut) return true; // If no dates selected, show all rooms
    if (selectedGuests > room.maxGuests) return false; // Check if room can accommodate the guests
    return true; // For now, just return true as we haven't implemented booking storage yet
  };

  const handleBooking = async (roomId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    const selectedRoomDetails = hotel?.rooms.find(room => room._id === roomId);
    if (!selectedRoomDetails) {
      alert('Room not found');
      return;
    }

    if (selectedGuests > selectedRoomDetails.maxGuests) {
      alert(`This room can only accommodate ${selectedRoomDetails.maxGuests} guests`);
      return;
    }

    router.push({
      pathname: `/checkout/${roomId}`,
      query: {
        hotelId: hotel?._id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests: selectedGuests,
        nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
        totalPrice: selectedRoomDetails.pricePerNight * Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  };

  // Show loading state
  if (router.isFallback || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </Layout>
    );
  }

  // Show hotel not found state
  if (!hotel) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <div className="text-gray-400">Hotel not found</div>
        </div>
      </Layout>
    );
  }

  const getLocationString = () => {
    if (!hotel.location) return '';
    const parts = [];
    if (hotel.location.address) parts.push(hotel.location.address);
    if (hotel.location.city) parts.push(hotel.location.city);
    if (hotel.location.country) parts.push(hotel.location.country);
    return parts.join(', ');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120] text-white">
        {/* Hero Section */}
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
          <Image
            src={hotel?.image || '/images/default-hotel.jpg'}
            alt={hotel?.name || 'Hotel'}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container mx-auto px-6 py-8">
          {hotel && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - Hotel Details */}
              <div className="lg:w-2/3">
                {/* Back Button */}
                <button
                  onClick={() => router.push('/hotels')}
                  className="flex items-center text-gray-400 hover:text-white mb-6"
                >
                  ← Back to Search Results
                </button>

                {/* Hotel Name and Location */}
                <div className="mb-8">
                  <h1 className="text-4xl font-bold mb-4">{hotel.name}</h1>
                  <p className="text-gray-400 flex items-center">
                    <span className="mr-2">📍</span>
                    {hotel.location.address}, {hotel.location.city}, {hotel.location.country}
                  </p>
                </div>

                {/* Main Hotel Image */}
                <div className="relative h-[400px] w-full rounded-xl overflow-hidden mb-6">
                  <Image
                    src={typeof hotel.images[0] === 'string' ? hotel.images[0] : hotel.images[0]?.url || '/images/placeholder.jpg'}
                    alt={hotel.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Hotel Gallery */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {hotel.images.slice(1, 4).map((image, index) => (
                    <div key={index} className="relative h-[200px] rounded-lg overflow-hidden">
                      <Image
                        src={typeof image === 'string' ? image : image.url}
                        alt={`${hotel.name} gallery ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 22vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Hotel Description */}
                <div className="mb-8">
                  <p className="text-gray-300">{hotel.description}</p>
                </div>

                {/* Hotel Amenities */}
                <div className="bg-[#1E293B] rounded-xl p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-6">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center text-gray-400">
                        {amenity === 'WiFi' && <IoWifiOutline className="w-5 h-5 mr-2" />}
                        {amenity === 'Pool' && <FaSwimmingPool className="w-5 h-5 mr-2" />}
                        {amenity === 'Spa & Wellness' && <FaSpa className="w-5 h-5 mr-2" />}
                        {amenity === 'Restaurant' && <IoRestaurantOutline className="w-5 h-5 mr-2" />}
                        {amenity === 'Bar' && <IoBeerOutline className="w-5 h-5 mr-2" />}
                        {amenity === 'Parking' && <IoCarOutline className="w-5 h-5 mr-2" />}
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Booking Section */}
              <div className="lg:w-1/3">
                <div className="sticky top-8">
                  {/* Date Selection */}
                  <div className="bg-[#1E293B] rounded-xl p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-6">Select Dates</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 mb-2">Check-in</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-white [color-scheme:dark]"
                          value={checkIn ? format(checkIn, 'yyyy-MM-dd') : ''}
                          min={format(today, 'yyyy-MM-dd')}
                          onChange={(e) => handleCheckInChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Check-out</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-white [color-scheme:dark]"
                          value={checkOut ? format(checkOut, 'yyyy-MM-dd') : ''}
                          min={checkIn ? format(new Date(checkIn.getTime() + 86400000), 'yyyy-MM-dd') : format(tomorrow, 'yyyy-MM-dd')}
                          onChange={(e) => handleCheckOutChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Guests</label>
                        <select
                          className="w-full px-4 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-white"
                          value={selectedGuests}
                          onChange={(e) => setSelectedGuests(Number(e.target.value))}
                        >
                          {[1, 2, 3, 4].map(num => (
                            <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Available Rooms Section */}
                  <div className="bg-[#1E293B] rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>
                    <div className="space-y-4">
                      {hotel.rooms.map((room) => (
                        <div
                          key={room._id}
                          className={`bg-[#0B1120] rounded-lg p-6 ${isRoomAvailable(room) ? 'opacity-100' : 'opacity-50'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-semibold">{room.type}</h3>
                              <p className="text-gray-400 mt-1">{room.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end">
                                <span className="text-2xl font-bold">
                                  ${(room.pricePerNight || 0).toFixed(2)}
                                </span>
                                <span className="text-gray-400 ml-2">per night</span>
                              </div>
                              <button
                                onClick={() => handleBooking(room._id)}
                                disabled={!isRoomAvailable(room) || !isConnected}
                                className="mt-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Book Now
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {room.amenities?.map((amenity, index) => (
                              <div key={index} className="flex items-center text-gray-400">
                                {amenity === 'WiFi' && <IoWifiOutline className="w-5 h-5 mr-2" />}
                                {amenity === 'Room Service' && <IoServerOutline className="w-5 h-5 mr-2" />}
                                {amenity === 'Mini Bar' && <IoBeerOutline className="w-5 h-5 mr-2" />}
                                {amenity === 'Smart TV' && <IoTvOutline className="w-5 h-5 mr-2" />}
                                {amenity}
                              </div>
                            ))}
                            <div className="flex items-center text-gray-400">
                              <IoPersonOutline className="w-5 h-5 mr-2" />
                              Max Guests: {room.maxGuests}
                            </div>
                          </div>

                          {/* Room Images */}
                          {room.images && room.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {room.images.map((image, index) => (
                                <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                                  <Image
                                    src={typeof image === 'string' ? image : image.url}
                                    alt={`${room.type} view ${index + 1}`}
                                    fill
                                    className="object-cover hover:opacity-80 transition-opacity"
                                    sizes="(max-width: 768px) 50vw, 16vw"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Helper function to get amenity icons
const getAmenityIcon = (amenity: string) => {
  const iconClass = "w-5 h-5 mr-2";
  switch (amenity.toLowerCase()) {
    case 'wifi':
      return <IoWifiOutline className={iconClass} />;
    case 'pool':
      return <FaSwimmingPool className={iconClass} />;
    case 'spa & wellness':
      return <FaSpa className={iconClass} />;
    case 'restaurant':
      return <IoRestaurantOutline className={iconClass} />;
    case 'bar':
      return <IoBeerOutline className={iconClass} />;
    case 'parking':
      return <IoCarOutline className={iconClass} />;
    case 'pet-friendly':
      return <FaPaw className={iconClass} />;
    default:
      return <IoHeartOutline className={iconClass} />;
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.id) {
    return {
      notFound: true
    };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${params.id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch hotel');
    }
    const hotel = await response.json();
    return {
      props: {
        initialHotel: hotel
      },
      revalidate: 60 // Revalidate every minute
    };
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return {
      props: {
        initialHotel: null
      },
      revalidate: 60
    };
  }
}; 