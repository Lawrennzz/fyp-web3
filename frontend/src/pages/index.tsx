import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import DatePicker from 'react-datepicker';
import { IoLocationOutline, IoPeopleOutline, IoCalendarOutline, IoStar, IoWalletOutline } from 'react-icons/io5';
import { BsCurrencyDollar } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import Image from 'next/image';
import { config } from '../config';
import { normalizeImageUrl, PLACEHOLDER_HOTEL_IMAGE } from '../utils/helpers';
import SafeImage from '../components/SafeImage';

interface Hotel {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
  };
  price: number;
  rating: number;
  image: string;
  description: string;
  rooms: { pricePerNight: number }[];
}

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(new Date());
  const [checkOut, setCheckOut] = useState<Date | null>(new Date());
  const [guests, setGuests] = useState(1);
  const [currency] = useState('USDT');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const popularDestinations: string[] = ['Dublin', 'Istanbul', 'Paris', 'London'];

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${config.API_URL}/api/health`);
        if (response.ok) {
          setBackendStatus('connected');
          // Fetch hotels separately
          const hotelsResponse = await fetch(`${config.API_URL}/api/hotels`);
          if (hotelsResponse.ok) {
            const data = await hotelsResponse.json();
            setFeaturedHotels(data.slice(0, 6)); // Show first 6 hotels as featured
            setError(null);
          } else {
            setError('Failed to fetch hotels');
          }
        } else {
          setBackendStatus('disconnected');
          setError('Failed to connect to backend');
        }
      } catch (err) {
        setBackendStatus('disconnected');
        setError('Backend server is not responding');
      } finally {
        setLoading(false);
      }
    };

    checkBackendStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      return; // Don't proceed if dates aren't selected
    }

    // Don't proceed with empty or single character searches
    if (!location || location.trim().length <= 1) {
      return;
    }

    router.push({
      pathname: '/hotels',
      query: {
        location: location.trim(),
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
      },
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if empty or more than one character
    if (!value || value.trim().length !== 1) {
      setLocation(value);
    }
  };

  // Function to get tomorrow's date based on a reference date
  const getTomorrow = (date: Date) => {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  // Function to format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Handle check-in date change
  const handleCheckInChange = (date: Date) => {
    const checkInDate = new Date(date);
    const currentCheckOut = checkOut || getTomorrow(checkInDate);

    // If check-out is before new check-in, set check-out to the next day
    if (currentCheckOut <= checkInDate) {
      setCheckOut(getTomorrow(checkInDate));
    }
    setCheckIn(checkInDate);
  };

  // Handle check-out date change
  const handleCheckOutChange = (date: Date) => {
    const checkOutDate = new Date(date);
    const checkInDate = checkIn || new Date();

    // Only update if check-out is after check-in
    if (checkOutDate > checkInDate) {
      setCheckOut(checkOutDate);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => {
      const StarIcon = IoStar as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
      return (
        <StarIcon
          key={index}
          className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-400'}`}
        />
      );
    });
  };

  const LocationIcon = IoLocationOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
  const CalendarIcon = IoCalendarOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
  const PeopleIcon = IoPeopleOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
  const CurrencyIcon = BsCurrencyDollar as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120] text-white">
        {/* Hero Section */}
        <div className="relative">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#0B1120] opacity-60"></div>
            <Image
              src="/images/hero-bg.jpg"
              alt="Hero background"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              quality={100}
              priority
              className="object-cover opacity-60"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                console.error('Error loading hero image');
                e.currentTarget.style.backgroundColor = '#0B1120';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/70 via-[#0B1120]/50 to-[#0B1120]/80"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="min-h-[700px] flex flex-col items-center justify-center py-20 lg:py-32">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-center mb-6 text-white drop-shadow-lg max-w-[90%] mx-auto">
                Your next hotel booking with <span className="text-blue-500">Web3</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-center text-white mb-12 lg:mb-16 max-w-3xl mx-auto font-medium drop-shadow-lg px-4">
                The first native Web3 Hotel Booking Platform using Blockchain.
                Experience secure and transparent bookings with cryptocurrency.
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative z-20 -mt-32 mb-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Find Your Perfect Stay</h2>
              <p className="text-lg text-gray-300">Search from thousands of hotels worldwide</p>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-6xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-[#0B1120]/30 backdrop-blur-[2px] rounded-2xl"></div>
                <div className="bg-[#0B1120]/70 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Location Input */}
                    <div className="flex items-center bg-[#0B1120]/50 hover:bg-[#0B1120]/60 rounded-xl h-14 px-4 lg:col-span-2 group transition-colors border border-white/10 focus-within:border-[#3898FF]/30">
                      <LocationIcon className="text-white/90 group-hover:text-white w-5 h-5 transition-colors flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Where are you traveling?"
                        className="bg-transparent border-none focus:outline-none text-white w-full placeholder-white/70 text-base ml-3"
                        value={location}
                        onChange={handleLocationChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                      />
                    </div>

                    {/* Check-in Date */}
                    <div className="flex items-center bg-[#0B1120]/50 hover:bg-[#0B1120]/60 rounded-xl h-14 px-4 group transition-colors border border-white/10 focus-within:border-[#3898FF]/30">
                      <input
                        type="date"
                        value={checkIn ? checkIn.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          handleCheckInChange(date);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-transparent border-none focus:outline-none text-white w-full placeholder-white/70 text-base"
                        placeholder="Check-in date"
                      />
                    </div>

                    {/* Check-out Date */}
                    <div className="flex items-center bg-[#0B1120]/50 hover:bg-[#0B1120]/60 rounded-xl h-14 px-4 group transition-colors border border-white/10 focus-within:border-[#3898FF]/30">
                      <input
                        type="date"
                        value={checkOut ? checkOut.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          handleCheckOutChange(date);
                        }}
                        min={checkIn ? checkIn.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        className="bg-transparent border-none focus:outline-none text-white w-full placeholder-white/70 text-base"
                        placeholder="Check-out date"
                      />
                    </div>

                    {/* Guests Input */}
                    <div className="flex items-center bg-[#0B1120]/50 hover:bg-[#0B1120]/60 rounded-xl h-14 px-4 group transition-colors border border-white/10 focus-within:border-[#3898FF]/30">
                      <PeopleIcon className="text-white/90 group-hover:text-white w-5 h-5 transition-colors flex-shrink-0" />
                      <div className="flex items-center w-full ml-3">
                        <button
                          type="button"
                          onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                          className="text-white/90 hover:text-white px-2 py-1"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={guests}
                          onChange={(e) => setGuests(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="bg-transparent border-none focus:outline-none text-white w-16 text-center placeholder-white/70 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Guests"
                        />
                        <button
                          type="button"
                          onClick={() => setGuests(prev => Math.min(10, prev + 1))}
                          className="text-white/90 hover:text-white px-2 py-1"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="bg-[#3898FF] hover:bg-[#3898FF]/90 text-white h-14 px-8 rounded-xl transition-colors font-semibold text-base shadow-[0_0_20px_rgba(56,152,255,0.15)] hover:shadow-[0_0_25px_rgba(56,152,255,0.25)] border border-[#3898FF]/30 w-full"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Destinations */}
        <div className="relative z-10 py-16 bg-[#0B1120]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Top Cities:</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularDestinations.map((city) => (
                <button
                  key={city}
                  onClick={() => setLocation(city)}
                  className="flex items-center justify-center gap-2 bg-[#0B1120]/50 hover:bg-[#0B1120]/70 rounded-xl py-4 px-6 transition-colors border border-white/10 hover:border-white/20"
                >
                  <LocationIcon className="w-5 h-5" />
                  <span className="text-lg font-medium">{city}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Hotels Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold mb-8">Featured Hotels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {featuredHotels.map((hotel) => {
              const lowestPrice = Math.min(...hotel.rooms.map(room => room.pricePerNight));
              return (
                <div
                  key={hotel._id}
                  className="bg-[#1E293B] rounded-xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/hotels/${hotel._id}`)}
                >
                  <div className="relative h-48 w-full">
                    <SafeImage
                      src={hotel.image}
                      alt={hotel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
                    <p className="text-gray-400 mb-4">
                      {hotel.location.city}, {hotel.location.country}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(hotel.rating)}
                      </div>
                      <p className="text-2xl font-bold">${lowestPrice}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
} 