import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { getContract } from '../../utils/web3Config';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { IconType } from 'react-icons';
import { 
  IoStar, 
  IoLocationOutline, 
  IoWifiOutline, 
  IoRestaurantOutline, 
  IoCarOutline, 
  IoCalendarOutline, 
  IoPeopleOutline, 
  IoSearchOutline,
  IoListOutline,
  IoMapOutline,
  IoBeerOutline
} from 'react-icons/io5';
import { FaSwimmingPool, FaSpa, FaPaw } from 'react-icons/fa';
import HotelMap from '../../components/HotelMap';

interface Hotel {
  _id: string;
  name: string;
  location: {
    city: string;
    country: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    } | null;
  };
  description: string;
  image: string;
  rating: number;
  price: number;
  amenities: string[];
}

// Type the icons as React components
const StarIcon = IoStar as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const LocationIcon = IoLocationOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const WifiIcon = IoWifiOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const PoolIcon = FaSwimmingPool as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const SpaIcon = FaSpa as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const RestaurantIcon = IoRestaurantOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const ParkingIcon = IoCarOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const PetIcon = FaPaw as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const CalendarIcon = IoCalendarOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const PeopleIcon = IoPeopleOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const BarIcon = IoBeerOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

export default function Hotels() {
  const router = useRouter();
  const { account } = useWeb3React<Web3Provider>();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(1000);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'relevant' | 'lowToHigh' | 'highToLow' | 'rating'>('relevant');
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    guests: 1
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const availableAmenities = [
    'WiFi',
    'Pool',
    'Spa & Wellness',
    'Restaurant',
    'Bar',
    'Parking',
    'Pet-friendly'
  ];

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
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckIn = e.target.value;
    const checkInDate = new Date(newCheckIn);
    const currentCheckOut = new Date(searchParams.checkOut);

    // If check-out is before new check-in, set check-out to the next day
    if (currentCheckOut <= checkInDate) {
      setSearchParams(prev => ({
        ...prev,
        checkIn: newCheckIn,
        checkOut: formatDate(getTomorrow(checkInDate))
      }));
    } else {
      setSearchParams(prev => ({
        ...prev,
        checkIn: newCheckIn
      }));
    }
  };

  // Handle check-out date change
  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckOut = e.target.value;
    const checkOutDate = new Date(newCheckOut);
    const checkInDate = new Date(searchParams.checkIn);

    // Only update if check-out is after check-in
    if (checkOutDate > checkInDate) {
      setSearchParams(prev => ({
        ...prev,
        checkOut: newCheckOut
      }));
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Initialize search params from URL query only once on initial load
  useEffect(() => {
    if (router.isReady && isInitialLoad) {
      const { location, checkIn, checkOut, guests } = router.query;
      setSearchParams(prev => ({
        location: location as string || prev.location,
        checkIn: checkIn ? new Date(checkIn as string).toISOString().split('T')[0] : prev.checkIn,
        checkOut: checkOut ? new Date(checkOut as string).toISOString().split('T')[0] : prev.checkOut,
        guests: guests ? parseInt(guests as string) : prev.guests
      }));
      setIsInitialLoad(false);
      fetchHotels();
    }
  }, [router.isReady]);

  // Update URL when search params change, but don't trigger a full page reload
  useEffect(() => {
    if (router.isReady && !isInitialLoad) {
      const newQuery = {
        ...router.query,
        ...searchParams
      };
      
      // Only update if the query params have actually changed
      if (JSON.stringify(newQuery) !== JSON.stringify(router.query)) {
        router.push({
          pathname: router.pathname,
          query: newQuery
        }, undefined, { shallow: true });
      }
    }
  }, [searchParams, router.isReady]);

  // Fetch hotels only once on initial load
  useEffect(() => {
    if (isInitialLoad) {
      fetchHotels();
    }
  }, []);

  // Filter hotels whenever filter criteria change
  useEffect(() => {
    if (!loading && hotels.length > 0) {
      let filtered = [...hotels];
      
      // Filter by location
      if (searchParams.location) {
        const searchLocation = searchParams.location.toLowerCase();
        filtered = filtered.filter(hotel => 
          hotel.location.city.toLowerCase().includes(searchLocation) ||
          hotel.location.country.toLowerCase().includes(searchLocation) ||
          hotel.location.address.toLowerCase().includes(searchLocation)
        );
      }
      
      filtered = filtered.filter(hotel => hotel.price <= priceRange);
      
      if (selectedStar !== null) {
        filtered = filtered.filter(hotel => Math.floor(hotel.rating) === selectedStar);
      }
      
      if (selectedAmenities.length > 0) {
        filtered = filtered.filter(hotel => 
          selectedAmenities.every(amenity => 
            hotel.amenities.map(a => a.toLowerCase()).includes(amenity.toLowerCase())
          )
        );
      }
      
      switch (sortBy) {
        case 'lowToHigh':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'highToLow':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
      }
      
      setFilteredHotels(filtered);
    }
  }, [hotels, priceRange, selectedStar, selectedAmenities, sortBy, searchParams.location, loading]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const data = await response.json();
      setHotels(data);
      setFilteredHotels(data); // Initialize filtered hotels with all hotels
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setError('Failed to load hotels. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <WifiIcon className="w-5 h-5" />;
      case 'pool': return <PoolIcon className="w-5 h-5" />;
      case 'spa & wellness': return <SpaIcon className="w-5 h-5" />;
      case 'restaurant': return <RestaurantIcon className="w-5 h-5" />;
      case 'bar': return <BarIcon className="w-5 h-5" />;
      case 'parking': return <ParkingIcon className="w-5 h-5" />;
      case 'pet-friendly': return <PetIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  // Handle hotel card click
  const handleHotelClick = (hotelId: string) => {
    router.push({
      pathname: `/hotels/${hotelId}`,
      query: {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests
      }
    });
  };

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button onClick={fetchHotels} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120] text-white">
        {/* Filter Bar */}
        <div className="container mx-auto px-6 py-4 flex gap-4">
          <button
            onClick={() => setSortBy('relevant')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
              sortBy === 'relevant' ? 'bg-blue-500' : 'bg-[#1E293B]'
            }`}
          >
            <StarIcon className="w-5 h-5" /> Most Relevant
          </button>
          <button
            onClick={() => setSortBy('lowToHigh')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
              sortBy === 'lowToHigh' ? 'bg-blue-500' : 'bg-[#1E293B]'
            }`}
          >
            Price: Low to High
          </button>
          <button
            onClick={() => setSortBy('highToLow')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
              sortBy === 'highToLow' ? 'bg-blue-500' : 'bg-[#1E293B]'
            }`}
          >
            Price: High to Low
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
              sortBy === 'rating' ? 'bg-blue-500' : 'bg-[#1E293B]'
            }`}
          >
            Star Rating
          </button>

          {/* View Toggle Buttons */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#1E293B] text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <IoListOutline className="w-5 h-5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                viewMode === 'map' 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#1E293B] text-gray-400 hover:text-white'
              }`}
              title="Map View"
            >
              <IoMapOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => {
                setSortBy('relevant');
                setPriceRange(1000);
                setSelectedStar(null);
                setSelectedAmenities([]);
              }}
              className="px-6 py-3 bg-red-500 rounded-lg ml-2"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search location..."
                className="w-full pl-12 pr-4 py-4 bg-[#0B1120] border border-gray-700 rounded-lg text-white placeholder-gray-400"
                value={searchParams.location}
                onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
              />
              <LocationIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <div className="w-48 relative">
              <input
                type="date"
                className="w-full pl-12 pr-4 py-4 bg-[#0B1120] border border-gray-700 rounded-lg text-white [color-scheme:dark]"
                value={searchParams.checkIn}
                onChange={handleCheckInChange}
                min={today}
              />
              <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <div className="w-48 relative">
              <input
                type="date"
                className="w-full pl-12 pr-4 py-4 bg-[#0B1120] border border-gray-700 rounded-lg text-white [color-scheme:dark]"
                value={searchParams.checkOut}
                onChange={handleCheckOutChange}
                min={getTomorrow(new Date(searchParams.checkIn)).toISOString().split('T')[0]}
              />
              <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <div className="w-48 relative">
              <select
                className="w-full pl-12 pr-4 py-4 bg-[#0B1120] border border-gray-700 rounded-lg text-white appearance-none cursor-pointer"
                value={searchParams.guests}
                onChange={(e) => setSearchParams(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
              </select>
              <PeopleIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button className="px-8 py-4 bg-blue-500 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors">
              <IoSearchOutline className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* Amenities Filter */}
        <div className="container mx-auto px-6 py-4">
          <h3 className="text-lg font-semibold mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-3">
            {availableAmenities.map((amenity) => (
              <button
                key={amenity}
                onClick={() => {
                  setSelectedAmenities(prev =>
                    prev.includes(amenity)
                      ? prev.filter(a => a !== amenity)
                      : [...prev, amenity]
                  );
                }}
                className={`px-4 py-2 rounded-lg ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1E293B] text-gray-400'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="container mx-auto px-6 py-4">
          <p className="text-gray-400">
            {filteredHotels.length} {filteredHotels.length === 1 ? 'hotel' : 'hotels'} found
          </p>
        </div>

        {viewMode === 'list' ? (
          <div className="container mx-auto px-6 py-4 flex gap-8">
            {/* Left Sidebar */}
            <div className="w-80">
              {/* Price Range */}
              <div className="bg-[#1E293B] rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  Price Range
                </h3>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-4">
                  <span>$0</span>
                  <span>${priceRange}</span>
                </div>
              </div>

              {/* Star Rating */}
              <div className="bg-[#1E293B] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Star Rating</h3>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(stars => (
                    <button
                      key={stars}
                      onClick={() => setSelectedStar(selectedStar === stars ? null : stars)}
                      className={`w-full p-3 rounded-lg flex items-center ${
                        selectedStar === stars ? 'bg-blue-500' : 'bg-[#2D3748]'
                      } hover:bg-opacity-90 transition-colors`}
                    >
                      <div className="flex">
                        {[...Array(stars)].map((_, i) => (
                          <StarIcon key={i} className="text-yellow-400 w-5 h-5" />
                        ))}
                      </div>
                      <span className="ml-2">{stars} stars</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hotel List */}
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading hotels...</p>
                  </div>
                ) : filteredHotels.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No hotels found matching your criteria.</p>
                  </div>
                ) : (
                  filteredHotels.map(hotel => (
                    <div
                      key={hotel._id}
                      id={`hotel-${hotel._id}`}
                      className="bg-[#1E293B] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleHotelClick(hotel._id)}
                    >
                      <div className="flex">
                        <div className="w-1/3 relative h-[250px]">
                          <Image
                            src={hotel.image}
                            alt={hotel.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        </div>
                        <div className="w-2/3 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
                              <div className="flex items-center text-gray-400 mb-2">
                                <LocationIcon className="w-5 h-5 mr-2" />
                                <p>{hotel.location.address}, {hotel.location.city}, {hotel.location.country}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center">
                                <StarIcon className="w-4 h-4 mr-1" />
                                {hotel.rating.toFixed(1)}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-400 mb-4 line-clamp-2">{hotel.description}</p>

                          <div className="flex flex-wrap gap-3 mb-4">
                            {hotel.amenities.map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center bg-[#0B1120] px-3 py-1 rounded-full text-sm"
                              >
                                {getAmenityIcon(amenity)}
                                <span className="ml-2">{amenity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">${hotel.price}</p>
                              <p className="text-sm text-gray-400">per night</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent div's onClick
                                handleHotelClick(hotel._id);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-6 py-4">
            <div className="bg-[#1E293B] rounded-lg overflow-hidden h-[calc(100vh-300px)] min-h-[600px]">
              <HotelMap 
                hotels={filteredHotels} 
                onHotelSelect={(hotelId) => {
                  router.push(`/hotels/${hotelId}`);
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 