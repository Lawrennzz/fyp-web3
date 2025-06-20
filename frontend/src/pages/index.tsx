import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import DatePicker from 'react-datepicker';
import { IoLocationOutline, IoPeopleOutline, IoCalendarOutline, IoStar, IoWalletOutline } from 'react-icons/io5';
import { BsCurrencyDollar } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import Image from 'next/image';

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

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const popularDestinations: string[] = ['Dublin', 'Istanbul', 'Paris', 'London'];

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/hotels`);
        if (response.ok) {
          setBackendStatus('connected');
          const data = await response.json();
          setFeaturedHotels(data.slice(0, 6)); // Show first 6 hotels as featured
          setError(null);
        } else {
          setBackendStatus('disconnected');
          setError('Failed to fetch hotels');
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
  }, [BACKEND_URL]);

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

  // Function to handle check-in date change
  const handleCheckInChange = (date: Date | null) => {
    setCheckIn(date);
    // If check-out is before new check-in, update it
    if (date && checkOut && checkOut <= date) {
      const newCheckOut = new Date(date);
      newCheckOut.setDate(newCheckOut.getDate() + 1);
      setCheckOut(newCheckOut);
    }
  };

  // Function to handle check-out date change
  const handleCheckOutChange = (date: Date | null) => {
    if (date && checkIn && date > checkIn) {
      setCheckOut(date);
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
              sizes="100vw"
              quality={100}
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
                Your next hotel booking with Web3
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-center text-white mb-12 lg:mb-16 max-w-3xl mx-auto font-medium drop-shadow-lg px-4">
                The first native Web3 Hotel Booking Platform using Blockchain.
                Experience secure and transparent bookings with cryptocurrency.
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-6xl mx-auto px-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#0B1120]/30 backdrop-blur-[2px] rounded-2xl"></div>
                  <div className="bg-[#0B1120]/70 backdrop-blur-xl rounded-2xl p-4 lg:p-3 border border-white/10 shadow-2xl relative">
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
                        <CalendarIcon className="text-white/90 group-hover:text-white w-5 h-5 transition-colors flex-shrink-0" />
                        <DatePicker
                          selected={checkIn}
                          onChange={handleCheckInChange}
                          className="bg-transparent border-none focus:outline-none text-white w-full placeholder-white/70 text-base ml-3 cursor-pointer"
                          dateFormat="dd-MM-yy"
                          placeholderText="Check-in"
                          minDate={new Date()}
                          showPopperArrow={false}
                        />
                      </div>

                      {/* Check-out Date */}
                      <div className="flex items-center bg-[#0B1120]/50 hover:bg-[#0B1120]/60 rounded-xl h-14 px-4 group transition-colors border border-white/10 focus-within:border-[#3898FF]/30">
                        <CalendarIcon className="text-white/90 group-hover:text-white w-5 h-5 transition-colors flex-shrink-0" />
                        <DatePicker
                          selected={checkOut}
                          onChange={handleCheckOutChange}
                          className="bg-transparent border-none focus:outline-none text-white w-full placeholder-white/70 text-base ml-3 cursor-pointer"
                          dateFormat="dd-MM-yy"
                          placeholderText="Check-out"
                          minDate={checkIn || new Date()}
                          showPopperArrow={false}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel) => (
              <div
                key={hotel._id}
                className="bg-[#1E293B] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{hotel.name}</h3>
                    <div className="flex items-center bg-blue-600 px-2 py-1 rounded-lg">
                      {renderStars(hotel.rating)}
                    </div>
                  </div>
                  <p className="text-gray-400 mb-4 flex items-center">
                    <LocationIcon className="w-4 h-4 mr-2" />
                    {`${hotel.location.address}, ${hotel.location.city}, ${hotel.location.country}`}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">${hotel.price}</p>
                      <p className="text-sm text-gray-400">per night</p>
                    </div>
                    <button
                      onClick={() => router.push(`/hotels/${hotel._id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 