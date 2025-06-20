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

interface Room {
  _id: string;
  type: string;
  description?: string;
  beds: {
    count: number;
    type: string;
  };
  price: number;
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
  price: number;
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

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Initialize dates from URL query
  useEffect(() => {
    if (router.isReady && isInitialLoad) {
      const { checkIn: checkInQuery, checkOut: checkOutQuery } = router.query;
      
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
      
      setIsInitialLoad(false);
    }
  }, [router.isReady]);

  // Update URL when dates change
  useEffect(() => {
    if (router.isReady && !isInitialLoad) {
      const newQuery = {
        ...router.query,
        checkIn: checkIn ? checkIn.toISOString() : undefined,
        checkOut: checkOut ? checkOut.toISOString() : undefined
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
  }, [checkIn, checkOut, router.isReady, isInitialLoad]);

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

  // Check if a room is available for selected dates
  const isRoomAvailable = (room: Room) => {
    if (!checkIn || !checkOut) return true; // If no dates selected, show all rooms
    
    // Here you would check against room.bookings
    // For now, just return true as we haven't implemented booking storage yet
    return true;
  };

  // Show loading state while fallback is rendering
  if (router.isFallback) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    if (router.query.id && !hotel) {
      fetchHotelDetails();
    }
  }, [router.query.id]);

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

  const handleBooking = async (roomId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${router.query.id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          account
        }),
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      alert('Booking successful!');
      router.push('/bookings');
    } catch (error) {
      console.error('Error booking room:', error);
      alert('Error booking room. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120]">
          <div className="container mx-auto px-6 py-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="h-[500px] bg-gray-700 rounded-lg mb-4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !hotel) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120]">
          <div className="container mx-auto px-6 py-12 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="text-gray-400">{error || 'Hotel not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
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
      <div className="min-h-screen bg-[#0B1120]">
        {/* Back Button */}
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            ← Back to Search Results
          </button>
        </div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Images */}
            <div className="lg:w-2/3">
              {/* Main Image */}
              <div className="relative h-[500px] mb-4 rounded-lg overflow-hidden">
                <Image
                  src={hotel.image || hotel.images?.[0]?.url || '/placeholder-hotel.jpg'}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  priority
                />
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-4 gap-4">
                {(hotel.images || []).map((img, index) => (
                  <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                    <Image
                      src={img.url}
                      alt={img.alt || `${hotel.name} gallery ${index + 1}`}
                      fill
                      className="object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      sizes="(max-width: 768px) 25vw, 20vw"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Hotel Info */}
            <div className="lg:w-1/3">
              <div className="sticky top-4">
                <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>
                
                <div className="flex items-center gap-2 text-gray-400 mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{getLocationString()}</span>
                </div>

                {/* Date Selection */}
                <div className="bg-[#1E293B] rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Select Dates</h2>
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
                  </div>
                </div>

                {/* Amenities */}
                <div className="bg-[#1E293B] rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {hotel.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-300">
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Rooms */}
                <div className="bg-[#1E293B] rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
                  {!checkIn || !checkOut ? (
                    <div className="text-center py-6 text-gray-400">
                      <p>Please select check-in and check-out dates</p>
                      <p className="text-sm mt-2">to see available rooms</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hotel.rooms && hotel.rooms.length > 0 ? (
                        hotel.rooms
                          .filter(room => room.available && isRoomAvailable(room))
                          .map((room) => (
                            <div
                              key={room._id}
                              className="bg-blue-600 rounded-lg p-6 cursor-pointer hover:bg-blue-700 transition-colors"
                              onClick={() => handleBooking(room._id)}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-semibold mb-2">{room.type}</h3>
                                  <div className="space-y-2">
                                    <p className="text-gray-300 flex items-center gap-2">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                      </svg>
                                      {room.beds.count} {room.beds.type} Bed{room.beds.count > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-gray-300 flex items-center gap-2">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      Up to {room.maxGuests} guests
                                    </p>
                                  </div>
                                  {room.description && (
                                    <p className="text-gray-300 mt-2">{room.description}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-3xl font-bold">${room.price}</p>
                                  <p className="text-gray-300">per night</p>
                                </div>
                              </div>

                              {room.amenities && room.amenities.length > 0 && (
                                <div className="border-t border-blue-500 pt-4 mt-4">
                                  <p className="text-sm text-gray-300 mb-2">Room Amenities:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {room.amenities.map((amenity, index) => (
                                      <span
                                        key={index}
                                        className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-sm"
                                      >
                                        {amenity}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {room.images && room.images.length > 0 && (
                                <div className="border-t border-blue-500 pt-4 mt-4">
                                  <div className="grid grid-cols-3 gap-2">
                                    {room.images.slice(0, 3).map((image, index) => (
                                      <div key={index} className="relative h-20 rounded overflow-hidden">
                                        <Image
                                          src={image.url}
                                          alt={image.alt || `${room.type} view ${index + 1}`}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 768px) 33vw, 25vw"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p>No rooms available for your dates</p>
                          <p className="text-sm mt-2">Try selecting different dates or contact the hotel directly</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper function to get amenity icons
function getAmenityIcon(amenity: string) {
  const iconClass = "w-5 h-5";
  switch (amenity.toLowerCase()) {
    case 'wifi':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>;
    case 'pool':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>;
    case 'gym':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>;
    case 'restaurant':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>;
    case 'parking':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>;
    case 'spa & wellness':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>;
    case 'pet-friendly':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>;
    default:
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>;
  }
}

export const getStaticPaths = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`);
    const hotels = await response.json();
    
    const paths = hotels.map((hotel: Hotel) => ({
      params: { id: hotel._id.toString() }
    }));

    return {
      paths,
      fallback: true
    };
  } catch (error) {
    console.error('Error fetching hotel paths:', error);
    return {
      paths: [],
      fallback: true
    };
  }
};

export const getStaticProps = async ({ params }: { params: { id: string } }) => {
  if (!params?.id) {
    return {
      notFound: true
    };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${params.id}`);
    const hotel = await response.json();

    return {
      props: {
        initialHotel: hotel
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return {
      notFound: true
    };
  }
}; 