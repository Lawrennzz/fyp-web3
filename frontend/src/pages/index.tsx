import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { IoLocationOutline, IoPeopleOutline, IoCalendarOutline, IoStar } from 'react-icons/io5';
import { BsCurrencyDollar } from 'react-icons/bs';
import type { IconType } from 'react-icons';

interface Hotel {
  _id: string;
  name: string;
  location: string;
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
    router.push({
      pathname: '/hotels',
      query: {
        location,
        checkIn: checkIn?.toISOString(),
        checkOut: checkOut?.toISOString(),
        guests,
      },
    });
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
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <h1 className="text-5xl font-bold text-center mb-4">
            Your next hotel booking with Web3
          </h1>
          <p className="text-xl text-center text-gray-300 mb-12">
            The first native Web3 Hotel Booking Platform using Blockchain.
          </p>

          {/* Search Bar */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-wrap gap-4 items-center justify-center mb-8">
            <div className="flex items-center bg-gray-700 rounded-md px-4 py-2 min-w-[250px]">
              <LocationIcon className="text-gray-400 mr-2 w-5 h-5" />
              <input
                type="text"
                placeholder="Where are you traveling?"
                className="bg-transparent border-none focus:outline-none text-white w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="flex items-center bg-gray-700 rounded-md px-4 py-2">
              <CalendarIcon className="text-gray-400 mr-2 w-5 h-5" />
              <DatePicker
                selected={checkIn}
                onChange={date => setCheckIn(date)}
                className="bg-transparent border-none focus:outline-none text-white w-32"
                dateFormat="dd/MM/yyyy"
              />
            </div>

            <div className="flex items-center bg-gray-700 rounded-md px-4 py-2">
              <CalendarIcon className="text-gray-400 mr-2 w-5 h-5" />
              <DatePicker
                selected={checkOut}
                onChange={date => setCheckOut(date)}
                className="bg-transparent border-none focus:outline-none text-white w-32"
                dateFormat="dd/MM/yyyy"
              />
            </div>

            <div className="flex items-center bg-gray-700 rounded-md px-4 py-2">
              <PeopleIcon className="text-gray-400 mr-2 w-5 h-5" />
              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="bg-transparent border-none focus:outline-none text-white w-16"
              />
            </div>

            <div className="flex items-center bg-gray-700 rounded-md px-4 py-2">
              <CurrencyIcon className="text-gray-400 mr-2 w-5 h-5" />
              <span className="text-white">{currency}</span>
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md transition-colors"
            >
              Search
            </button>
          </div>

          {/* Popular Destinations */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {popularDestinations.map((destination: string) => (
              <button
                key={destination}
                onClick={() => setLocation(destination)}
                className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-full flex items-center"
              >
                <LocationIcon className="mr-2 w-5 h-5" />
                {destination}
              </button>
            ))}
          </div>

          {/* Featured Hotels Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center mb-8">Featured Hotels</h2>
            {loading ? (
              <div className="text-center text-gray-400">Loading featured hotels...</div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredHotels.map((hotel) => (
                  <div
                    key={hotel._id}
                    className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                  >
                    <div className="relative h-48">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{hotel.location}</p>
                      <div className="flex items-center mb-3">
                        {renderStars(hotel.rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-500">
                          {hotel.price} USDT
                        </span>
                        <button
                          onClick={() => router.push(`/hotels/${hotel._id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backend Status */}
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900 font-medium">Backend Status</h3>
              <button 
                onClick={() => window.location.reload()} 
                className="text-blue-600 hover:text-blue-700 ml-4"
              >
                Refresh
              </button>
            </div>
            <div className="flex items-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`text-sm ${
                backendStatus === 'connected' ? 'text-green-500' : 'text-red-500'
              }`}>
                {backendStatus === 'connected' ? 'Connected' : 'Backend Disconnected'}
              </span>
            </div>
            {backendStatus === 'disconnected' && (
              <p className="text-red-500 text-sm mt-1">
                Make sure the backend server is running on port 3001
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 